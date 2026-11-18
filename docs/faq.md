# FAQ

Source: https://soheil.fi/developers/docs/faq/

Short answers to what integrators ask first.

## Which tokens can be traded?

Any ERC-20 token the router finds liquidity for, and the network's coin; on Solana any token of the classic token program; on the other networks, what `GET /v1/networks` lists for each. Tokens that take a fee on every transfer may fail: the quote expects the full amount to arrive.

## Can I charge a different fee per user?

Yes: send `integratorBps` with each quote, from 0 up to your key's ceiling.

## Where does my fee arrive, and when?

At your key's fee address, in the token sold, in the same transaction as the trade.

## What happens if the price moves?

The trade reverts below `toAmountMin`, and the user keeps their tokens. Quote again; a higher `slippageBps` helps on volatile tokens.

## Is there a testnet?

Not yet. Test on mainnet with small amounts; quotes are free and count only against your key's limits.

## Bridges, Solana and other networks?

Transfers between our networks work today, through the same contract and API, swapping first when needed ([Bridging](https://soheil.fi/developers/docs/bridging/)). Solana works both ways, with swaps on it ([Trades from Solana](https://soheil.fi/developers/docs/solana/)); Bitcoin both ways ([Trades from Bitcoin](https://soheil.fi/developers/docs/bitcoin/)); TON both ways, the coin ([Trades from TON](https://soheil.fi/developers/docs/ton/)). More networks are added over time: `GET /v1/chains` and `GET /v1/networks` are always the current lists.
