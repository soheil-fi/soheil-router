# Soheil Router

[![mcptry](https://mcptry.com/badge/fi.soheil/router)](https://mcptry.com/servers/fi.soheil/router)

**One API call for the best token swap price, and one transaction that makes it.**
Soheil Router compares prices across DEXes and aggregators on each network and executes the trade through its own
contract: non-upgradeable, source verified on the explorers, and it holds no funds between trades.

- **Docs:** https://soheil.fi/developers/docs/
- **Free API key:** https://soheil.fi/developers/dashboard/
- **OpenAPI 3.1:** https://api.soheil.fi/v1/openapi.json
- **For AI assistants:** https://soheil.fi/developers/llms-full.txt · MCP server at `https://api.soheil.fi/v1/mcp`

## Fees

0.1% (10 bps) to the router on each swap. You can add your own fee (up to 0.9%), paid to your wallet inside the same
transaction: nothing to claim.

## Install

```bash
npm install github:soheil-fi/soheil-router
```

## Quick start

```ts
import { COIN, SoheilRouter } from "@soheil-fi/router";

const router = new SoheilRouter({ apiKey: process.env.SOHEIL_ROUTER_KEY }); // keep the key on your server

const quote = await router.getQuote({
  fromChainId: 8453,                                       // Base
  fromToken: COIN,                                         // ETH
  toToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",   // USDC
  fromAmount: 10n ** 15n,                                  // 0.001 ETH, in wei
  fromAddress: "0xUserWallet",
  integratorBps: 30,                                       // your fee: 0.3%
});

// quote.approvalAddress → approve exactly quote.fromAmount first (null when selling the coin)
// quote.transactionRequest → have the user's wallet send it unchanged
const status = await router.waitForTrade(8453, txHash);     // DONE, REFUNDED, FAILED or NOT_OURS
```

A whole swap with viem is in [`examples/swap-viem.ts`](examples/swap-viem.ts).

| Method | Key | Returns |
| --- | --- | --- |
| `getNetworks()` | no | Live networks, our contract and the contracts a trade may call |
| `getInfo()` | no | Fee, limits, docs |
| `getQuote(request)` | yes | Price, minimum received, fees, approval address, transaction |
| `getStatus(chainId, txHash)` | yes | `PENDING`, `DONE`, `REFUNDED`, `FAILED`, `NOT_OURS` or `NOT_FOUND` |
| `waitForTrade(chainId, txHash)` | yes | `getStatus` until the trade is final |

Errors are thrown as `SoheilRouterError` with `code` (`NO_ROUTE`, `RATE_LIMITED`, `UNAUTHORIZED`…), the HTTP `status`
and a `message` safe to show your users.

## Bridge to another network

Set `toChainId` to another of the router's networks. The answer has `type: "bridge"`, and the user still signs one
transaction on the source network; the recipient is paid on the destination within seconds.

```ts
const quote = await router.getQuote({
  fromChainId: 8453,                                       // from Base
  toChainId: 42161,                                        // to Arbitrum
  fromToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  toToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",   // USDC on Arbitrum
  fromAmount: 100_000_000n,                                // 100 USDC
  fromAddress: "0xUserWallet",
});
// quote.toAmount is what arrives; a transfer nobody fills is refunded to fromAddress on Base (status REFUND_PENDING until then)
const status = await router.waitForTrade(8453, txHash);     // DONE (status.receiving = the payout) or REFUNDED
```

`fromToken` and `toToken` can be any token: what the bridge does not carry is swapped first on the source network, or
bought on arrival on the destination (then `toAmountMin` is that swap's least; if the price moves past it, the recipient
gets the bridged token, like USDC, instead). Still one transaction, fees taken once. Docs: https://soheil.fi/developers/docs/bridging/

## Use it from an AI assistant (MCP)

The API is also an MCP server (Streamable HTTP) with the tools `get_networks`, `get_api_info`, `get_quote` and
`get_trade_status`.

```bash
claude mcp add --transport http soheil-router https://api.soheil.fi/v1/mcp \
  --header "Authorization: Bearer $SOHEIL_ROUTER_KEY"
```

```json
{ "mcpServers": { "soheil-router": { "url": "https://api.soheil.fi/v1/mcp", "headers": { "Authorization": "Bearer sk_your_key" } } } }
```

## Good to know

- Amounts are integer strings in the token's smallest unit; use `bigint`, never JavaScript numbers.
- Approve exactly `fromAmount`, never an unlimited amount.
- The user always signs in their own wallet: the API never holds keys or funds.

Built by [Soheil.fi](https://soheil.fi). Questions: support@soheil.fi

## License

MIT
