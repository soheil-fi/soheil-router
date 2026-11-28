# Trades from Hyperliquid

Source: https://soheil.fi/developers/docs/hyperliquid/

From Hyperliquid's trading account to Solana or a network in /v1/chains: the user's wallet signs two messages, and the bridge takes the router's fee inside the order.

## How it works

-   Quote with `fromChainId=1337`, `fromToken` USDC (`0xaf88d065e77c8cc2239327c5edb3a432268e5831`, 6 decimals) and `fromAddress` the user's Hyperliquid account (its 0x… address): refunds go there. `toAddress` defaults to the same address on an EVM network.
-   The answer carries `hyperliquid`: two EIP-712 messages for the wallet to sign. `authorize` ties the transfer to this trade; `transfer` is Hyperliquid's own transfer of exactly `fromAmount` to the bridge. USDC to Arbitrum's USDC can instead come back as Hyperliquid's own withdrawal: `authorize` is then the router's fee (a `usdSend` to the router's fee wallet) and `transfer` the withdrawal of `toAmount` to the receiver (Hyperliquid's own $1 fee is the rest of `fromAmount`). Sign both as they come and send them the same way.
-   Nothing moves until both signatures reach `POST /v1/send` with the quote's `id`: they are checked against `fromAddress` and handed on. The recipient is then paid on `toChainId`. The router's 0.1% is taken inside the order.

## Request

```bash
curl "https://api.soheil.fi/v1/quote?fromChainId=1337&toChainId=8453\
&fromToken=0xaf88d065e77c8cc2239327c5edb3a432268e5831&toToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\
&fromAmount=25000000&fromAddress=0xYourUsersHyperliquidAccount" \
  -H "x-api-key: sk_xxxxxxxx_…"
```

## Response

```json
{
  "id": "0x9d02…", "type": "bridge",
  "fromChainId": 1337, "toChainId": 8453,
  "fromToken": "0xaf88d065e77c8cc2239327c5edb3a432268e5831", "toToken": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  "fromAmount": "25000000",            // 25 USDC
  "toAmount": "24949042", "toAmountMin": "24823296",
  "fees": { "token": "0xaf88d065e77c8cc2239327c5edb3a432268e5831", "totalBps": 10, "routerBps": 10, "integratorBps": 0, "routerFee": "25000", "integratorFee": "0" },
  "approvalAddress": null, "transactionRequest": null, "transaction": null, "deposit": null, "messages": null,
  "validUntil": 1794781200, "estimatedDurationSeconds": 10,
  "hyperliquid": {
    "authorize": { "domain": { … }, "types": { … }, "primaryType": "NonceMapping", "message": { … } },
    "transfer": { "domain": { … }, "types": { … }, "primaryType": "HyperliquidTransaction:SendAsset",
                  "message": { "destination": "0x66cf…", "token": "USDC:…", "amount": "25.000000", … } }
  }
}
```

## Signing and sending

Sign both with the account's wallet, as they are, then send them with the quote's `id`. The answer's `txHash` is the quote's id.

```js
// The user's wallet signs both messages as they are (eth_signTypedData_v4), then the router hands them on
const [account] = await window.ethereum.request({ method: "eth_requestAccounts" }); // the fromAddress of the quote
const sign = (data) => window.ethereum.request({ method: "eth_signTypedData_v4", params: [account, JSON.stringify(data)] });
const authorizeSignature = await sign(quote.hyperliquid.authorize);
const signature = await sign(quote.hyperliquid.transfer);
await fetch("https://api.soheil.fi/v1/send", {
  method: "POST",
  headers: { "content-type": "application/json", "x-api-key": "sk_xxxxxxxx_…" },
  body: JSON.stringify({ chainId: 1337, id: quote.id, authorizeSignature, signature }),
});
```

## Rules

-   USDC from the main trading account only (not a sub-account), before `validUntil` (5 minutes). Signatures are taken once.
-   Both messages are signed for chain id 1: a wallet that asks to switch networks for a signature may do so; nothing is sent on that network.
-   What cannot be filled is refunded to `fromAddress`, on Hyperliquid.
-   An integrator fee is taken by the bridge and paid to your key's fee address, which must be an EVM address; you claim it from the bridge (it is not in your dashboard's earnings).

## Following it

[`GET /v1/status`](https://soheil.fi/developers/docs/status/) takes the quote's `id`:

```bash
curl "https://api.soheil.fi/v1/status?chainId=1337&id=0x9d02…" -H "x-api-key: sk_xxxxxxxx_…"
```

`PENDING` until the transfer is seen and while it is paid out, then `DONE` (`receiving` is the payout), `REFUNDED` or `FAILED`.
