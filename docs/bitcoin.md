# Trades from Bitcoin

Source: https://soheil.fi/developers/docs/bitcoin/

From Bitcoin to Solana, TON or a network in /v1/chains, paid to a single-use address from any wallet or exchange: nothing to sign through us.

## How it works

-   Quote with `fromChainId=20000000000001`, `fromToken=bitcoin` and the amount in satoshi. `fromAddress` is the user's own Bitcoin address: refunds go there. `toAddress` is required.
-   The answer has no transaction: `deposit` names a single-use Bitcoin address and the exact amount to send to it.
-   Once the deposit confirms, the BTC is swapped and the recipient is paid on `toChainId`. The router's 0.1% is taken from the swap for us; nothing of ours touches the user's BTC.

## Request

```bash
curl "https://api.soheil.fi/v1/quote?fromChainId=20000000000001&toChainId=8453\
&fromToken=bitcoin&toToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\
&fromAmount=100000&fromAddress=bc1qYourUsersOwnAddress&toAddress=0xRecipient" \
  -H "x-api-key: sk_xxxxxxxx_…"
```

## Response

```json
{
  "id": "0x7c40…", "type": "bridge",
  "fromChainId": 20000000000001, "toChainId": 8453,
  "fromToken": "bitcoin", "toToken": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  "fromAmount": "100000",              // satoshi: 0.001 BTC
  "toAmount": "98700000", "toAmountMin": "98206500",
  "fees": { "token": "bitcoin", "totalBps": 10, "routerBps": 10, "integratorBps": 0, "routerFee": "100", "integratorFee": "0" },
  "approvalAddress": null, "transactionRequest": null, "transaction": null,
  "deposit": {                         // where the user pays: exactly amount, from any wallet or exchange
    "chainId": 20000000000001, "address": "bc1q…", "token": "bitcoin", "amount": "100000"
  },
  "validUntil": 1793711400,            // how long the price is fresh (about 20 minutes)
  "estimatedDurationSeconds": 1200
}
```

## Rules for the deposit

-   Send **exactly** `deposit.amount`, once, to `deposit.address`. The address is for this quote only.
-   At least 5,000 satoshi: a smaller deposit may never be picked up.
-   What cannot be filled is refunded to `fromAddress`, on Bitcoin.
-   `validUntil` is how long the price is fresh. Paid later, the swap runs at the price then, never below the slippage you asked for, or is refunded.
-   An integrator fee is taken by the bridge and paid to your key's fee address, which must be an EVM address; you claim it from the bridge (it is not in your dashboard's earnings).

## Following it

There is no transaction of yours to follow, so [`GET /v1/status`](https://soheil.fi/developers/docs/status/) takes the quote's `id` instead of `txHash`:

```bash
curl "https://api.soheil.fi/v1/status?chainId=20000000000001&id=0x7c40…" -H "x-api-key: sk_xxxxxxxx_…"
```

`PENDING` / `WAITING_DEPOSIT` until the deposit is seen, `PENDING` / `PROCESSING` while it is swapped, then `DONE` (`sending` is the deposit, `receiving` the payout), `REFUNDED` or `FAILED`.
