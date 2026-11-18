# Public endpoints

Source: https://soheil.fi/developers/docs/public/

Endpoints that need no key.

## Endpoints

`GET /v1/health` (no key)

`{ "status": "ok", "networks": 7 }` when the API can serve; `503` with `"down"` when it cannot. For uptime checks.

`GET /v1/info` (no key)

The API's version, the router's fee, the highest fee you can set, and how keys are given.

`GET /v1/chains` (no key)

The networks, our contract on each, its explorer, and the contracts a trade may call there.

## GET /v1/networks

`GET /v1/networks` (no key)

The networks served without a contract of ours (Solana, Bitcoin, TON, Tron, Sui, Hyperliquid and Cosmos networks), each with its id, how its addresses look (`type`), its coin as a token, and what works right now: `receive` (transfers to it), `send` (trades from it), `swap` (swaps within it), `integratorFee` (whether a trade from it can carry your `integratorBps`; on Tron its transfers, not its swaps).

```json
[
  { "chainId": 1151111081099710, "name": "Solana", "type": "solana", "nativeToken": "11111111111111111111111111111111",
    "explorer": "https://solscan.io", "receive": true, "send": true, "swap": true, "routerBps": 10, "feeCollector": "…", "integratorFee": false },
  { "chainId": 20000000000001, "name": "Bitcoin", "type": "bitcoin", "nativeToken": "bitcoin",
    "explorer": "https://mempool.space", "receive": true, "send": true, "swap": false, "routerBps": 10, "feeCollector": null, "integratorFee": true },
  { "chainId": 6070000000000000, "name": "TON", "type": "ton", "nativeToken": "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
    "explorer": "https://tonviewer.com", "receive": true, "send": true, "swap": false, "routerBps": 10, "feeCollector": null, "integratorFee": true }
]
```

`GET /v1/openapi.json` (no key)

This API as an OpenAPI 3 description, for generating clients.
