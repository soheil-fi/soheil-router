# Your key and earnings

Source: https://soheil.fi/developers/docs/me/

Your key's settings, this month's requests, and what your trades earned per token.

`GET /v1/me` (API key)

## Response

```json
{ "prefix": "abcdef12", "name": "My app", "integratorAddress": "0x…", "integratorBps": 20, "maxIntegratorBps": 90,
  "perMinute": 60, "monthlyQuota": 50000, "requestsThisMonth": 1234, "routerBps": 10,
  "earned": { "trades": 87, "byToken": [ { "chainId": 8453, "token": "0x8335…2913", "symbol": "USDC",
              "decimals": 6, "volume": "52000000000", "integratorFee": "104000000" } ] } }
```

`earned.byToken` lists every token your trades sold, on every network, in one answer. `symbol` and `decimals` are `null` when the network could not be asked just then.
