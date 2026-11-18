# Contracts and events

Source: https://soheil.fi/developers/docs/contracts/

Every trade is one call to SoheilRouter, verified on the explorers and on Sourcify.

Addresses are on [Networks](https://soheil.fi/developers/docs/networks/).

## The Traded event

```solidity
event Traded(
    bytes32 indexed requestId, address indexed sender,
    address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut,
    uint256 soheilFee, uint256 integratorFee, address integrator, address recipient
);
```

`requestId` is the quote's `id`; `soheilFee` (the router's fee) and `integratorFee` are the two fees in `tokenIn`. You can index these events yourself; `GET /v1/status` and `GET /v1/me` read the same data.

## Contracts a trade may call

For wallets and security policies that allowlist contracts. The router chooses among them per quote; a new one is callable only 2 days after the owner announces it on-chain.

The live list: `GET https://api.soheil.fi/v1/chains` (no key; every network, our contract there and the contracts a trade may call).
