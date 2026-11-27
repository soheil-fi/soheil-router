# Introduction

Source: https://soheil.fi/developers/docs/

Soheil Router is a swap and bridge API for wallets, apps and bots: one request, one transaction, and a 0.1% fee, where other APIs take 0.15% to 0.25%.

## What it is

For every request, Soheil Router finds the best price it can reach and returns **one transaction** to our own contract, `SoheilRouter`. That transaction takes the fees, runs the swap and sends the output to the user. If anything fails, or the output is below the minimum, it reverts as a whole and the user keeps their tokens.

## Why Soheil Router

-   **0.1% fee.** Other swap APIs take 0.15% to 0.25% ([compare](https://soheil.fi/developers/docs/fees/#compare)). More of every swap stays with your user and with you.
-   **You earn on every swap.** Add your own fee, 0 to 0.9%. It is paid to your wallet inside the same transaction: no invoice, nothing to claim.
-   **Non-custodial.** Funds go from the user's wallet through the contract to the recipient in one transaction. The contract holds nothing between trades and cannot be upgraded.
-   **One integration.** The same request and answer on every network, from one endpoint.

> **Today**Swaps on every network we support, and bridges between them: the token as it is, or swapped first or on arrival, in one transaction (see [Bridging](https://soheil.fi/developers/docs/bridging/)). Also the networks without a contract of ours (Solana, Bitcoin, TON, Tron, Sui, Hyperliquid and Cosmos networks): what each one can do is in [Networks](https://soheil.fi/developers/docs/networks/#other).

## Base URL and formats

```bash
https://api.soheil.fi/v1
```

-   Requests and answers are JSON.
-   Amounts are strings in the token's smallest unit (100 USDC is `"100000000"`).
-   The network's own coin (ETH, BNB, POL, AVAX) is `0x0000000000000000000000000000000000000000`.

## Where next

[**Quick start**Your first swap or bridge in three calls.](https://soheil.fi/developers/docs/quick-start/)[**Get an API key**How keys work and how to create one.](https://soheil.fi/developers/docs/keys/)[**Swap widget**A ready swap and bridge form for your site.](https://soheil.fi/developers/docs/widget/)[**Try it live**A real quote from your browser, no sign-up.](https://soheil.fi/developers/docs/try/)[**Fees and earnings**What the user pays and what you earn.](https://soheil.fi/developers/docs/fees/)[**API reference**Every field of GET /v1/quote.](https://soheil.fi/developers/docs/quote/)
