# Trades from Solana

Source: https://soheil.fi/developers/docs/solana/

Swaps on Solana, and transfers from it to other networks: the quote carries a transaction our server built, with the fee inside; the user signs it as it is.

## How it works

-   Quote with `fromChainId=1151111081099710`, tokens as mints and `fromAddress` the user's Solana wallet. A swap stays on Solana and pays the wallet that signs (leave `toAddress` out); a transfer names its receiver on the other network.
-   There is no contract of ours on Solana, and none is needed: a Solana transaction runs all its instructions or none. Our server builds one that holds the trade, our fee as a plain transfer, and a short memo naming the quote, and checks it before answering: only known programs run, and only the user signs.
-   The user signs `transaction` as it is, within about a minute (`lastValidBlockHeight`), and it is sent to the network.
-   A trade is also asked from a second route, paid by deposit (a swap on Solana too). When it pays the receiver noticeably more, the quote carries `deposit` and no `transaction`: the wallet sends exactly `deposit.amount` of the token to `deposit.address`, and the trade is followed by the quote's `id` ([as from Bitcoin](https://soheil.fi/developers/docs/bitcoin/)).

## The code

```js
import { Connection, VersionedTransaction } from "@solana/web3.js";

// 1. Quote (on your server). Here: 0.1 SOL to USDC on Solana; to another network, set toChainId and toAddress
const q = await fetch(`https://api.soheil.fi/v1/quote?` + new URLSearchParams({
  fromChainId: "1151111081099710", toChainId: "1151111081099710",
  fromToken: "11111111111111111111111111111111",          // SOL
  toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC (the mint, as written)
  fromAmount: "100000000",                                 // 0.1 SOL (9 decimals)
  fromAddress: wallet.publicKey.toBase58(),
}), { headers: { "x-api-key": process.env.SOHEIL_ROUTER_KEY } }).then((r) => r.json());
if (q.error) throw new Error(q.error.message);

// 2. The user signs the transaction as it is (no approval on Solana)
const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(q.transaction), (c) => c.charCodeAt(0)));
const signed = await wallet.signTransaction(tx);

// 3. Send it within a minute (its blockhash expires): yourself, or through POST /v1/send
const signature = await new Connection(RPC_URL).sendRawTransaction(signed.serialize());
```

## Response

```json
{
  "id": "0x5b1e…", "type": "swap",
  "fromChainId": 1151111081099710, "toChainId": 1151111081099710,
  "fromToken": "11111111111111111111111111111111", "toToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "fromAmount": "100000000", "toAmount": "8257310", "toAmountMin": "8216023",
  "fees": { "token": "11111111111111111111111111111111", "totalBps": 10, "routerBps": 10, "integratorBps": 0,
            "routerFee": "100000", "integratorFee": "0" },
  "approvalAddress": null, "transactionRequest": null,
  "transaction": "AQAAAAAA…",          // base64, a v0 transaction, unsigned: the user signs it as it is
  "lastValidBlockHeight": 312845120,   // the network refuses it after this block height
  "gasEstimate": "143000",             // its compute-unit limit
  "validUntil": 1793710260,            // about a minute ahead
  "estimatedDurationSeconds": 0,
  "deposit": null
}
```

## POST /v1/send

`POST /v1/send` (API key)

Optional: sends a signed transaction through our own connection to the network (it often lands sooner than through a public one). Only the transaction of one of your quotes from the last few minutes, signed by its `fromAddress`, is sent. The answer is `{ "chainId": …, "txHash": "<signature>" }`.

```bash
curl -X POST "https://api.soheil.fi/v1/send" -H "x-api-key: sk_xxxxxxxx_…" -H "content-type: application/json" \
  -d '{ "chainId": 1151111081099710, "transaction": "<the signed transaction, base64>" }'
```

## Fees

-   The router's 0.1% is a transfer inside the same transaction: in the token sold; or, when that cannot be paid as it is, in the token bought (from the least the swap pays), or its value in SOL. `fees.token` says which.
-   No integrator fee on trades that start on Solana yet: leave `integratorBps` out or send 0 (a key's default is not charged there).

## Following it

[`GET /v1/status`](https://soheil.fi/developers/docs/status/) with `chainId=1151111081099710` and `txHash` set to the signature. A trade is ours when it carries our quote's memo, was signed by its sender and paid the quoted fee. A transfer to another network then reads like any [bridge](https://soheil.fi/developers/docs/bridging/#status).
