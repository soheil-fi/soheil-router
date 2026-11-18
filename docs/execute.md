# Sending the transaction

Source: https://soheil.fi/developers/docs/execute/

What the user signs after a quote, and what happens if the price moves.

## Approval

When `approvalAddress` is set, the user approves exactly `fromAmount` of `fromToken` to it (our contract) first.

> Ask for exact approvals, never unlimited ones. Tokens like USDT that refuse a new approval over an old one need an approval of 0 first.

## Selling the coin

When `fromToken` is the coin, there is no approval; `transactionRequest.value` carries the amount.

## Sending

Send `to`, `data` and `value` unchanged. Let the wallet estimate gas, or use `gasEstimate` with some margin.

## Reverts

A trade that would give less than `toAmountMin`, or whose swap fails, reverts as a whole: the user keeps the tokens and pays only gas. Quote again and retry.

> This page is for networks with our contract. Starting on Solana, the user signs `transaction` instead ([Trades from Solana](https://soheil.fi/developers/docs/solana/)); starting on Bitcoin, they pay an address ([Trades from Bitcoin](https://soheil.fi/developers/docs/bitcoin/)).
