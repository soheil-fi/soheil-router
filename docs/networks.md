# Networks

Source: https://soheil.fi/developers/docs/networks/

Where the contract is live today (GET /v1/chains), and the networks served without it: Solana, Bitcoin, TON, Tron, Sui, Hyperliquid and Cosmos networks (GET /v1/networks).

## Live networks

The contract has the same address on every network except Base. Click an address to see the verified source on the network's explorer.

The live list: `GET https://api.soheil.fi/v1/chains` (no key; every network, our contract there and the contracts a trade may call).

> More EVM networks are added over time. `GET /v1/chains` is always the current list.

## Solana, Bitcoin, TON, Tron, Sui, Hyperliquid and Cosmos

These have no contract of ours, and none is needed: the same [`GET /v1/quote`](https://soheil.fi/developers/docs/quote/) takes them as `fromChainId` or `toChainId`. [`GET /v1/networks`](https://soheil.fi/developers/docs/public/#networks) lists them, with what each can do right now.

| Network | chainId | To it | From it | How a trade from it runs |
| --- | --- | --- | --- | --- |
| Solana | `1151111081099710` | yes | yes, and swaps within it | The quote carries `transaction`; the user signs it ([Trades from Solana](https://soheil.fi/developers/docs/solana/)) |
| Bitcoin | `20000000000001` | yes | yes | The quote carries `deposit`, an address to pay ([Trades from Bitcoin](https://soheil.fi/developers/docs/bitcoin/)) |
| TON | `6070000000000000` | yes | yes, the coin and its other tokens | The coin: the quote carries `messages` for the wallet to send ([Trades from TON](https://soheil.fi/developers/docs/ton/)). Another token (its jetton address as `fromToken`): the quote carries `deposit`, an address the wallet pays |
| Tron | `728126428` | yes, USDT and TRX | yes, USDT and TRX, and swaps within it (any two Tron tokens) | The quote carries `tron`, a call for the wallet to send, after approving `approvalAddress` for a token. `tron.networkCost` is the TRX it is expected to burn; a swap that sells TRX also carries `tron.fee`, sent first |
| Sui | `9270000000000000` | yes, USDC and SUI | yes, the tokens it takes there | USDC to USDC on a network in GET /v1/chains: the quote can carry `transaction`, a Sui transaction (JSON) the wallet signs and sends, with the router's fee inside. Otherwise `deposit`: an address the wallet pays exactly `fromAmount` to (`fromToken` is the coin type) |
| Hyperliquid | `1337` | yes, USDC (to the trading account) | not yet | — |
| Osmosis, Noble, Cosmos Hub, Celestia and more (`type` `cosmos`) | see GET /v1/networks | yes, the tokens it lists | yes, the tokens it lists, and swaps between them | The quote carries `cosmos`: the messages of one transaction for the Cosmos wallet ([Trades from Cosmos](https://soheil.fi/developers/docs/cosmos/)) |
| Zcash, XRP, Dogecoin, Litecoin, NEAR, Cardano, Stellar and more (`type` `deposit`) | see GET /v1/networks | yes where `receive` is true: the tokens it lists, from a network in GET /v1/chains, to an address that needs no memo or tag | yes, the tokens it lists | The quote carries `deposit`: an address to pay from any wallet or exchange, and a `memo` where the network needs one |

Transfers to them start on any network in `GET /v1/chains` (through our contract, as any [bridge](https://soheil.fi/developers/docs/bridging/)), on Solana, on Bitcoin or on TON. Bitcoin and TON have one token each, their coin. Tron and Sui take the few tokens listed in their `tokens`: transfers to Tron start on the networks in `GET /v1/chains` or on Solana, and transfers from Tron go to those networks or Solana; transfers to Sui, Hyperliquid and the Cosmos networks start on the networks in `GET /v1/chains`. Trades from TON's other tokens are paid by deposit and end on a network in `GET /v1/chains` or on Solana. Trades from Sui are paid by deposit the same way, or, for USDC to USDC on a network in `GET /v1/chains` that Circle's CCTP reaches, signed by the Sui wallet: `transaction` is a Sui transaction as JSON (`Transaction.from(quote.transaction)` in Sui's SDK reads it; the wallet adds the gas, in SUI), holding the router's fee (a USDC transfer to `feeCollector`) and the bridge. That way takes no integrator fee: a quote with `integratorBps` is paid by deposit. Trades from a Cosmos network end on another Cosmos network or on a network in `GET /v1/chains`. Transfers to a network paid by deposit (Zcash, XRP, Dogecoin…) start on a network in `GET /v1/chains`: `toToken` is one of its `tokens` as listed, `toAddress` your own address there.

Read which field the quote carries, not only the network: from TON (the coin), from Tron, from Sui and for a transfer from Solana the router asks two routes and answers with the better one, so the same request can come back with `messages`, `tron` or `transaction` (the wallet signs) or with `deposit` (the wallet sends exactly `fromAmount` to that address). Both are followed by the quote's `id`; from Solana and Sui, add `txHash` when the wallet signed (on Sui the transaction's digest).

> On Tron every token transaction burns TRX at the network's own price, whatever the amount: approving USDT costs about 10 TRX, sending it 6 to 13. `tron.networkCost` (in sun, 1 TRX = 1000000) is what this quote's transactions are expected to burn for the sender's wallet. Show it, and check the wallet holds it: a transaction that runs out of TRX fails and still burns what it used.

A swap on Tron (`fromChainId` and `toChainId` both Tron) takes any two Tron tokens and pays the sender, or `toAddress` when it is another Tron address. Selling TRX, the router's fee is `tron.fee`, a plain TRX transfer of `amount` to `to` that the wallet sends before the call; the call then sells the rest. Selling a token carries no router fee. Swaps on Tron take no integrator fee yet.

## Tokens and addresses there

| Network | Token | Its coin | Wallet address | Transaction |
| --- | --- | --- | --- | --- |
| Solana | the mint, base58, as written (case matters) | `11111111111111111111111111111111` | base58 | its signature, base58 |
| Bitcoin | only its coin | `bitcoin`, in satoshi | bc1…, 1… or 3…, as written | its id, 64 hex |
| TON | only its coin | `EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c`, 9 decimals | EQ… or UQ… (any spelling of the account) | followed by the quote's id |
| Tron | USDT `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` or TRX, as written | `T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb`, 6 decimals | T…, as written | followed by the quote's id; a swap on Tron by the id and `txHash` (its transaction id) |
| Sui | USDC, its coin type `0xdba3…::usdc::USDC`, or SUI | `0x2::sui::SUI`, 9 decimals | 0x + 64 hex | from Sui: followed by the quote's id, and `txHash` (its digest, base58) when the wallet signed `transaction` |
| Hyperliquid | USDC, written `0xaf88d065e77c8cc2239327c5edb3a432268e5831`, 6 decimals | — | the account's 0x… address | — |
| Cosmos networks | a denom from its `tokens`, as written (`uatom`, `ibc/…`) | its `nativeToken` | bech32 with the network's prefix (cosmos1…, osmo1…) | — |
| Networks paid by deposit (`deposit`) | an id from its `tokens`, as written | its `nativeToken` | the network's own form, as written; to receive, one that needs no memo or tag (an exchange address that needs a destination tag or memo would lose the payment) | followed by the quote's id |

> From a network paid by deposit, `fromAddress` is your own address there (refunds go to it), and the trade ends on a network in `GET /v1/chains` or on Solana. Send exactly `fromAmount`, with the `memo` when the quote has one: without it the deposit is not credited. An integrator fee there is a second app fee of the swap, credited to your key's EVM fee address at NEAR Intents (withdrawn there with that wallet; not in your dashboard's earnings).

> A transfer to Solana, Bitcoin, TON, Tron, Sui, Hyperliquid or a Cosmos network always needs `toAddress`, a wallet there. On Bitcoin, TON and Tron, never an exchange address that needs a memo or tag: the payout carries none.
