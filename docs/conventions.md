# Conventions

Source: https://soheil.fi/developers/docs/conventions/

How every endpoint writes chains, addresses, amounts and times, and what v1 promises not to change.

## Values

| Value | Written as |
| --- | --- |
| Chains | `fromChainId`, `toChainId`, `chainId`: the EVM chain ID, a number (the networks that are not EVM have ids of ours: [Networks](https://soheil.fi/developers/docs/networks/#other)) |
| Addresses | 0x…, lower case in answers; any case accepted in requests. On networks that are not EVM: as written, never changed (case matters there) |
| The coin | `0x0000000000000000000000000000000000000000` (`0xeeee…eeee` is accepted too) |
| Amounts | decimal strings in the token's smallest unit, never numbers (they overflow JavaScript) |
| The transaction's `value` | hex (0x…), as wallets take it |
| Ids and hashes | 0x + 64 hex (a Solana transaction is its base58 signature; a Bitcoin one its 64-hex id) |
| Times | unix seconds |
| Names ending in `Bps` | basis points (1 bps = 0.01%); names ending in Fee are amounts |
| Unknown | `null`, never a placeholder |

## What stays the same

-   Within v1, fields and endpoints are never renamed or removed. New fields and new endpoints may appear: ignore what you do not know.
-   Values like `type`, `status`, `substatus` and error codes may gain new members. Treat an unknown one by its meaning: an unknown `status` as `PENDING`, an unknown error code by its HTTP status.
-   Shapes carry both networks (`fromChainId`, `toChainId`, `sending`, `receiving`), so a swap and a bridge transfer read the same way.

## One quote, one transaction

Each quote has its own `id`, and its transaction is meant to be sent once. The contract does not refuse an id it has seen: sending the same transaction twice makes two trades, if the user's balance and approval allow it. Approving exactly `fromAmount` (never more) keeps a resent transaction from going through.
