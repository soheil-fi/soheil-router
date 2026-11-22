# Get a quote

Source: https://soheil.fi/developers/docs/quote/

The best price for a swap or a bridge, with the transaction that makes it. Also POST /v1/quote with the same fields as JSON.

`GET /v1/quote` (API key)

## Request

curl:

```bash
curl "https://api.soheil.fi/v1/quote?fromChainId=8453&toChainId=8453\
&fromToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\
&toToken=0x0000000000000000000000000000000000000000\
&fromAmount=100000000&fromAddress=0xYourUser&slippageBps=50" \
  -H "x-api-key: sk_xxxxxxxx_…"
```

Python:

```python
import os, requests

q = requests.get("https://api.soheil.fi/v1/quote", headers={"x-api-key": os.environ["SOHEIL_ROUTER_KEY"]}, timeout=30, params={
    "fromChainId": 8453, "toChainId": 8453,
    "fromToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "toToken": "0x0000000000000000000000000000000000000000",
    "fromAmount": "100000000", "fromAddress": "0xYourUser", "slippageBps": 50,
}).json()
if "error" in q:
    raise RuntimeError(q["error"]["message"])
print(q["toAmount"], q["toAmountMin"], q["transactionRequest"]["to"])
```

Try it with real prices, no key needed: [Try it live](https://soheil.fi/developers/docs/try/).

## Fields

- `fromChainId` (integer, required): Chain ID where the user sends from: a network in `/v1/chains`, or Solana or Bitcoin ([Networks](https://soheil.fi/developers/docs/networks/#other)).
- `toChainId` (integer, required): Chain ID where the recipient receives: `fromChainId` for a swap, another of our networks to bridge there ([Bridging](https://soheil.fi/developers/docs/bridging/)), including Solana, Bitcoin, TON, Tron, Sui, Hyperliquid and Cosmos networks.
- `fromToken` (string, required): Token sold (the coin is `0x000…0`; on networks that are not EVM see [their formats](https://soheil.fi/developers/docs/networks/#formats)).
- `toToken` (string, required): Token bought.
- `fromAmount` (string): Amount sold, in the token's smallest unit, above 0. Required unless `toAmount` is given.
- `toAmount` (string): Instead of `fromAmount`: an exact amount to receive, for a swap on one of the networks in `/v1/chains` (`fromChainId` = `toChainId`). The answer is an ordinary quote: its `fromAmount` is what it takes to send, and its `toAmountMin` is never below the amount you asked for (what arrives above it is the recipient's too). Use it to pay a fixed price in another token.
- `fromAddress` (string, required): The wallet that signs and pays. From Bitcoin: the user's own Bitcoin address, which takes refunds ([Trades from Bitcoin](https://soheil.fi/developers/docs/bitcoin/)).
- `toAddress` (string): Who receives the output, on `toChainId`; `fromAddress` by default. Never a token or our contract. Required when the two networks' addresses differ (to or from Solana, Bitcoin or TON).
- `slippageBps` (integer): 1 to 5000; 50 (0.5%) by default. A cross-chain route whose own swaps need more room may use up to 300 (3%); `toAmountMin` always shows the least that arrives.
- `integratorBps` (integer): Your fee for this request, 0 up to your key's ceiling; your key's default when left out. Where no contract of ours is, only networks whose integratorFee is true in GET /v1/networks take it (not yet Solana, the Cosmos networks or swaps on Tron): leave it out or send 0 there.
- `priceOnly` (boolean): Set `true` when you only show this price and will ask again before anyone signs (a list of routes, a preview). Partners that limit quotes which are never traded are left out then, so the quote you ask for to sign can only be as good or better.

## Response

```json
{
  "id": "0x9f2c…",                     // the trade's request id (bytes32 in the call and in the Traded event)
  "type": "swap",                      // "swap" on one network; "bridge" to another network
  "fromChainId": 8453, "toChainId": 8453,
  "fromToken": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", "toToken": "0x0000000000000000000000000000000000000000",
  "fromAmount": "100000000",
  "toAmount": "41287340000000000",     // expected output, both fees already taken from the input
  "toAmountMin": "41080903300000000",  // the least the recipient gets: the transaction reverts below it
  "fees": { "token": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
            "totalBps": 30, "routerBps": 10, "integratorBps": 20,
            "routerFee": "100000", "integratorFee": "200000" },
  "approvalAddress": "0x…",            // our contract: approve exactly fromAmount first (null for the coin)
  "transactionRequest": { "to": "0x…", "data": "0x4c5d1e10…", "value": "0x0", "chainId": 8453 },
  "gasEstimate": "270000",
  "validUntil": 1793710800,            // unix seconds: send before it, or quote again
  "estimatedDurationSeconds": 0        // from mined to received: 0 for a swap (the same transaction)
}
```

## Reading the answer

-   `toAmount` is what the user should receive, with both fees already taken.
-   `toAmountMin` is the least they will receive, enforced by the contract.
-   `fees` are taken from `fromAmount`, in `fees.token`.
-   `gasEstimate` includes the contract's own work.
-   A trade that starts on Solana carries `transaction` instead of `transactionRequest` ([Trades from Solana](https://soheil.fi/developers/docs/solana/)); one that starts on Bitcoin carries `deposit` ([Trades from Bitcoin](https://soheil.fi/developers/docs/bitcoin/)). Both are `null` otherwise.
-   `validUntil` (about 20 minutes ahead) is how long the price is fresh, not an on-chain deadline: send before it, or quote again. Sent later, the trade may revert (the user keeps their tokens) or fill at a worse price, never below `toAmountMin`.
