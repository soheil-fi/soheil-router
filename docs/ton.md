# Trades from TON

Source: https://soheil.fi/developers/docs/ton/

From TON to Solana, Bitcoin or a network in /v1/chains: the user's TON wallet sends one transaction, and the bridge takes the router's fee inside the order.

## How it works

-   Quote with `fromChainId=6070000000000000`, `fromToken` the coin (`EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c`) and the amount in nanotons. `fromAddress` is the user's TON wallet, the one that sends: refunds go there. `toAddress` is required.
-   The answer carries `messages`: what the wallet sends, in one transaction. Today one message, the coin to the bridge, with this order as its comment.
-   Once it lands, the coin is swapped and the recipient is paid on `toChainId`. The router's 0.1% is taken inside the order; there is no separate fee transfer.

## Request

```bash
curl "https://api.soheil.fi/v1/quote?fromChainId=6070000000000000&toChainId=8453\
&fromToken=EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c&toToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\
&fromAmount=5000000000&fromAddress=UQYourUsersTonWallet&toAddress=0xRecipient" \
  -H "x-api-key: sk_xxxxxxxx_…"
```

## Response

```json
{
  "id": "0x3b9e…", "type": "bridge",
  "fromChainId": 6070000000000000, "toChainId": 8453,
  "fromToken": "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c", "toToken": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  "fromAmount": "5000000000",          // nanotons: 5 TON
  "toAmount": "5573913", "toAmountMin": "5462435",
  "fees": { "token": "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c", "totalBps": 10, "routerBps": 10, "integratorBps": 0, "routerFee": "5000000", "integratorFee": "0" },
  "approvalAddress": null, "transactionRequest": null, "transaction": null, "deposit": null,
  "messages": [                        // what the user's TON wallet sends, in one transaction
    { "address": "EQCrdGsD…", "amount": "5000000000", "payload": "te6cckEB…" }
  ],
  "validUntil": 1793711400,            // send before it (about 10 minutes), or quote again
  "estimatedDurationSeconds": 10
}
```

## Sending it

Give `messages` to the wallet as they are. With TON Connect:

```js
import { TonConnectUI, toUserFriendlyAddress } from "@tonconnect/ui";

const tonConnect = new TonConnectUI({ manifestUrl: "https://your.app/tonconnect-manifest.json" });

// 1. Quote (on your server), with the connected wallet as fromAddress
const q = await fetch(`https://api.soheil.fi/v1/quote?` + new URLSearchParams({
  fromChainId: "6070000000000000", toChainId: "8453",
  fromToken: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c", // the coin
  toToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",          // USDC on Base
  fromAmount: "5000000000",                                        // 5 TON
  fromAddress: toUserFriendlyAddress(tonConnect.account.address), // UQ…: the wallet's raw 0:… form is not taken
  toAddress: "0xRecipient",
}), { headers: { "x-api-key": process.env.ROUTER_KEY } }).then((r) => r.json());

// 2. The wallet sends the messages as they are, in one transaction
await tonConnect.sendTransaction({ validUntil: q.validUntil, messages: q.messages });

// 3. Follow it by the quote's id
const s = await fetch(`https://api.soheil.fi/v1/status?chainId=6070000000000000&id=${q.id}`, { headers: { "x-api-key": process.env.ROUTER_KEY } }).then((r) => r.json());
```

## Rules

-   The coin only: jettons (USDT on TON and others) cannot start a trade yet.
-   Send the messages unchanged, from `fromAddress`, before `validUntil`. Changed, the message is not this order and is refunded.
-   What cannot be filled is refunded to `fromAddress`, on TON.
-   An integrator fee is taken by the bridge and paid to your key's fee address, which must be an EVM address; you claim it from the bridge (it is not in your dashboard's earnings).

## Following it

A TON wallet answers with a message, not the trade's transaction, so [`GET /v1/status`](https://soheil.fi/developers/docs/status/) takes the quote's `id` instead of `txHash`:

```bash
curl "https://api.soheil.fi/v1/status?chainId=6070000000000000&id=0x3b9e…" -H "x-api-key: sk_xxxxxxxx_…"
```

`PENDING` / `WAITING_DEPOSIT` until it lands, `PENDING` / `PROCESSING` while it is swapped, then `DONE` (`sending` is the TON transaction, `receiving` the payout), `REFUNDED` or `FAILED`.
