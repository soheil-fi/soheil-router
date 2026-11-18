# Trades from Cosmos

Source: https://soheil.fi/developers/docs/cosmos/

From a Cosmos network to another one, to a network in /v1/chains, or a swap on the same network: the user's Cosmos wallet signs one transaction, with the router's fee as its last message.

## How it works

-   Quote with `fromChainId` a Cosmos network from [`GET /v1/networks`](https://soheil.fi/developers/docs/public/#networks) whose `send` is true, and `fromToken` one of the denoms in its `tokens`, as written. `fromAddress` is the user's wallet there (its prefix: `cosmos1…`, `osmo1…`).
-   `toChainId` is another Cosmos network there, a network in `GET /v1/chains` (then `toToken` is a token address and `toAddress` an EVM address), or the same network for a swap between its listed tokens. `toAddress` is required unless it is a swap.
-   The answer carries `cosmos`: the network's own chain id and the `messages` of one transaction. The route's message comes first; the router's 0.1%, a bank send in the token sold, is the last one. Both happen or neither does.

## Request

```bash
curl "https://api.soheil.fi/v1/quote?fromChainId=8900003296855744&toChainId=8453\
&fromToken=uatom&toToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\
&fromAmount=5000000&fromAddress=cosmos1YourUsersWallet&toAddress=0xRecipient" \
  -H "x-api-key: sk_xxxxxxxx_…"
```

## Response

```json
{
  "id": "0x7c41…", "type": "bridge",
  "fromChainId": 8900003296855744, "toChainId": 8453,
  "fromToken": "uatom", "toToken": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  "fromAmount": "5000000",             // 5 ATOM
  "toAmount": "6497674", "toAmountMin": "6486953",
  "fees": { "token": "uatom", "totalBps": 10, "routerBps": 10, "integratorBps": 0, "routerFee": "5000", "integratorFee": "0" },
  "approvalAddress": null, "transactionRequest": null, "transaction": null, "deposit": null, "messages": null,
  "validUntil": 1794781200, "estimatedDurationSeconds": 180,
  "cosmos": {
    "chainId": "cosmoshub-4",
    "messages": [
      { "typeUrl": "/ibc.applications.transfer.v1.MsgTransfer",
        "value": "{\"source_port\":\"transfer\",\"source_channel\":\"channel-141\",\"token\":{\"denom\":\"uatom\",\"amount\":\"4995000\"},\"sender\":\"cosmos1…\",\"receiver\":\"osmo1…\",\"timeout_height\":{},\"timeout_timestamp\":1794782013362485814,\"memo\":\"…\"}" },
      { "typeUrl": "/cosmos.bank.v1beta1.MsgSend",   // the router's fee, last
        "value": "{\"from_address\":\"cosmos1…\",\"to_address\":\"cosmos1…\",\"amount\":[{\"denom\":\"uatom\",\"amount\":\"5000\"}]}" }
    ]
  }
}
```

## Sending it

Each message is its `typeUrl` and its fields as a JSON text (`value`), named as in the message's protobuf definition. Encode each for your signing library, sign them all in one transaction with the user's wallet, and broadcast it. With Keplr and CosmJS:

```js
import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";

// A sketch for the two message types most routes use; add the others the same way (see Rules)
const encode = ({ typeUrl, value }) => {
  const m = JSON.parse(value);
  if (typeUrl === "/ibc.applications.transfer.v1.MsgTransfer") {
    return { typeUrl, value: {
      sourcePort: m.source_port, sourceChannel: m.source_channel, token: m.token,
      sender: m.sender, receiver: m.receiver, memo: m.memo,
      // larger than a JavaScript number: read it from the text itself
      timeoutTimestamp: BigInt(value.match(/"timeout_timestamp":"?(\d+)/)[1]),
    } };
  }
  if (typeUrl === "/cosmos.bank.v1beta1.MsgSend") {
    return { typeUrl, value: { fromAddress: m.from_address, toAddress: m.to_address, amount: m.amount } };
  }
  throw new Error("Not encoded yet: " + typeUrl);
};

const { chainId, messages } = quote.cosmos;
await window.keplr.enable(chainId);
const signer = window.keplr.getOfflineSigner(chainId);
const [{ address }] = await signer.getAccounts();          // must be the quote's fromAddress
const client = await SigningStargateClient.connectWithSigner(RPC_URL, signer, { gasPrice: GasPrice.fromString("0.005uatom") });
const sent = await client.signAndBroadcast(address, messages.map(encode), "auto");
// then: GET /v1/status?chainId=8900003296855744&id=<quote.id>&txHash=<sent.transactionHash>
```

## Rules

-   Sign every message, in order, unchanged, from `fromAddress`, before `validUntil`. A transaction that leaves one out is not this quote's: its status is `NOT_OURS`.
-   `value` is a text because it holds numbers larger than JavaScript's (`timeout_timestamp`): read those as BigInt or strings.
-   The types you may get: `/ibc.applications.transfer.v1.MsgTransfer`, `/cosmwasm.wasm.v1.MsgExecuteContract` (a swap on the network itself; its `msg` is the contract's JSON, sent as bytes), `/cosmos.bank.v1beta1.MsgSend`, and Circle's CCTP burn from Noble (`/circle.cctp.v1.MsgDepositForBurn`, `…WithCaller`).
-   A step that fails on the way returns the tokens to the user's own account, on the network where it stopped.
-   No integrator fee on trades that start on a Cosmos network yet.

## Following it

[`GET /v1/status`](https://soheil.fi/developers/docs/status/) takes the quote's `id` and the transaction's hash together:

```bash
curl "https://api.soheil.fi/v1/status?chainId=8900003296855744&id=0x7c41…&txHash=9F2C…" -H "x-api-key: sk_xxxxxxxx_…"
```

`PENDING` until the network has the transaction and while the transfer travels, then `DONE`, `REFUNDED` (back in the sender's wallet on the network it left), or `FAILED`. `NOT_OURS`: the transaction is not this quote's.
