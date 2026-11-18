# Bridging to another network

Source: https://soheil.fi/developers/docs/bridging/

Send a token to another of our networks with the same request and one transaction: the recipient is paid there within seconds, or the sender is refunded.

## How it works

-   Quote with `toChainId` set to the destination. The answer has `type: "bridge"` and the one transaction to sign on the source network.
-   That transaction goes to our contract, like a swap: it takes the router's fee and yours from the amount, in the token sent, swaps the rest first when the bridge does not carry that token, and deposits it for the transfer.
-   A relayer pays the recipient on the destination, usually within seconds (`estimatedDurationSeconds`).

## Request

curl:

```bash
curl "https://api.soheil.fi/v1/quote?fromChainId=8453&toChainId=42161\
&fromToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\
&toToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831\
&fromAmount=100000000&fromAddress=0xYourUser" \
  -H "x-api-key: sk_xxxxxxxx_…"
```

Python:

```python
import os, requests

q = requests.get("https://api.soheil.fi/v1/quote", headers={"x-api-key": os.environ["SOHEIL_ROUTER_KEY"]}, timeout=30, params={
    "fromChainId": 8453, "toChainId": 42161,                    # Base to Arbitrum
    "fromToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  # USDC on Base
    "toToken": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",    # USDC on Arbitrum
    "fromAmount": "100000000", "fromAddress": "0xYourUser",
}).json()
print(q["type"], q["toAmount"], q["estimatedDurationSeconds"], "s")
```

Approve and send exactly as for a swap ([Sending the transaction](https://soheil.fi/developers/docs/execute/)).

## What arrives

`toAmount` is exactly what reaches the recipient on `toChainId`, after every fee; `toAmountMin` is the same: a transfer is paid in full or refunded, never in part. `toToken` is the token on the destination network.

When `toToken` is one no bridge carries, it is bought on arrival: a token that is carried goes over, then is swapped for `toToken` on the destination as it is paid out, all from the one transaction. `toAmount` is then that swap's expected output and `toAmountMin` the least it accepts; if the price there moves past your `slippageBps` by the time it arrives, the recipient gets the carried token instead (USDC or the like), never nothing. Fees are taken once, on the source network.

## Refunds

If nobody fills the transfer, it is refunded to the sender (`fromAddress`) on the source network: on most routes automatically once its time runs out; on some, after the sender cancels it in the bridge's own app (the status shows `REFUND_PENDING` meanwhile). The refund never goes to our contract.

## Following it

Ask [Trade status](https://soheil.fi/developers/docs/status/) with the source network and the transaction hash: `PENDING` / `WAITING_FILL` until it is paid, then `DONE` with `receiving` set to the payout on the destination, or `REFUNDED`.

## What works today

-   Between the router's networks (`GET /v1/chains`), and from them to Solana, Bitcoin, TON, Tron, Sui, Hyperliquid and Cosmos networks ([Networks](https://soheil.fi/developers/docs/networks/#other)): set `toAddress` to a wallet there.
-   `fromToken` and `toToken` can be any token: what the bridge does not carry is swapped first on the source network, or on arrival on the destination (see What arrives).
-   After a swap, the bridge takes exactly the swap's minimum: whatever the swap returns above it goes back to the sender on the source network, in that asset. Other pairs answer `NO_ROUTE`.
