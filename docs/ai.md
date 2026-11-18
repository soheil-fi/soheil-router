# Build with an AI assistant

Source: https://soheil.fi/developers/docs/ai/

Give Claude, ChatGPT, Gemini, Cursor or Copilot these docs, and it can write the whole integration for you.

## Give it the docs

Point your assistant to one of these, or paste it in:

| File | What it is |
| --- | --- |
| [`soheil.fi/developers/llms-full.txt`](https://soheil.fi/developers/llms-full.txt) | Every docs page in one Markdown file. |
| [`soheil.fi/developers/llms.txt`](https://soheil.fi/developers/llms.txt) | A short index, with a link to each page in Markdown. |
| [`api.soheil.fi/v1/openapi.json`](https://api.soheil.fi/v1/openapi.json) | The whole API as OpenAPI 3.1, for generated clients and typed code. |

Every page here also has **Copy page as Markdown** under its title.

## Connect it over MCP

The API is also an MCP server, so an assistant or agent can call it as tools. It speaks Streamable HTTP at `https://api.soheil.fi/v1/mcp` and needs no key: everything works at a low shared rate, on every network the router serves. With your API key as `Authorization: Bearer` (or `x-api-key`) the calls get your own limits and your integrator fee, counted like any other call.

| Tool | What it does |
| --- | --- |
| `get_networks` | Where the router trades: the EVM networks with our contract, and Solana, Bitcoin, TON, Tron, Sui, Hyperliquid, Cosmos and the deposit networks, each saying what it can do. |
| `get_api_info` | The router's fee, the limits, where the docs are. |
| `get_quote` | The best price for a swap or a transfer to another network, and what the sender signs. |
| `get_signing_guide` | The exact steps to sign and send a quote on the network it starts on, and how to follow it. |
| `get_trade_status` | Where a sent trade stands, by its transaction, its quote's `id`, or both. |

Without a key:

Claude Code:

```bash
claude mcp add --transport http soheil-router https://api.soheil.fi/v1/mcp
```

Cursor:

```json
{
  "mcpServers": {
    "soheil-router": { "url": "https://api.soheil.fi/v1/mcp" }
  }
}
```

With your own key (your limits, your fee):

Claude Code:

```bash
claude mcp add --transport http soheil-router https://api.soheil.fi/v1/mcp \
  --header "Authorization: Bearer $SOHEIL_ROUTER_KEY"
```

Cursor:

```json
{
  "mcpServers": {
    "soheil-router": {
      "url": "https://api.soheil.fi/v1/mcp",
      "headers": { "Authorization": "Bearer sk_your_key" }
    }
  }
}
```

> The server returns what to sign, never a key to a wallet: the user, or an agent with a wallet of its own, signs every trade.

## Prompts that work

Swap in a web app:

```text
Using the Soheil Router API (docs: https://soheil.fi/developers/llms-full.txt),
add token swaps to my Next.js app on Base. Call /v1/quote from a server route
with my key from the SOHEIL_ROUTER_KEY env var (never in the browser), charge
integratorBps 30, ask the user's wallet (viem) to approve exactly fromAmount when
approvalAddress is set, send transactionRequest unchanged, then poll /v1/status.
```

Telegram bot:

```text
Read https://soheil.fi/developers/llms-full.txt. Write a Node.js Telegram bot
command /quote <amount> <from> <to> that calls the Soheil Router API on Base and
replies with toAmount, toAmountMin and both fees in readable units. Read the
key from an env var.
```

Python script:

```text
Using the OpenAPI at https://api.soheil.fi/v1/openapi.json, write a Python
function quote(chain_id, from_token, to_token, amount, wallet) that returns the
parsed quote, raises on the {"error": {"code", "message"}} shape, and treats
unknown status values as PENDING.
```

## Check what it wrote

-   The API key stays on your server; a key in browser code can be used by anyone.
-   Approvals are for exactly `fromAmount`, never unlimited.
-   `transactionRequest` is sent unchanged, and amounts stay strings or BigInt, never JavaScript numbers.
-   Errors are read from `error.code`, and unknown codes are handled by their HTTP status.

> Quotes are free and count only against your key's limits, so let the assistant test against the live API with a small amount.
