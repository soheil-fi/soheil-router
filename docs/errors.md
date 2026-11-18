# Errors

Source: https://soheil.fi/developers/docs/errors/

Every error is JSON with a code and a message you can show your users.

## Shape

```json
{ "error": { "code": "NO_ROUTE", "message": "No route for this pair and amount right now." } }
```

## Codes

New codes may be added: handle an unknown one by its HTTP status.

| Code | HTTP | Meaning |
| --- | --- | --- |
| `INVALID` | 400 | A field is missing or wrong; the message says which. |
| `UNAUTHORIZED` | 401 | No key, or a wrong one. |
| `KEY_DISABLED` | 403 | Your key is switched off. |
| `ORIGIN_NOT_ALLOWED` | 403 | A publishable key used outside the websites listed on it (or without a browser's `Origin`): add the website in the dashboard, or call from your server with a secret key. |
| `SECRET_KEY_REQUIRED` | 403 | A publishable key on an endpoint that needs a secret key (anything but `/v1/quote` and `/v1/status`). |
| `NOT_FOUND` | 404 | No such endpoint. |
| `METHOD_NOT_ALLOWED` | 405 | The endpoint does not take this method. |
| `UNSUPPORTED_CHAIN` | 422 | The router is not on this network, or cannot reach `toChainId` from it yet. |
| `NO_ROUTE` | 422 | No route for this pair and amount right now. |
| `RATE_LIMITED` | 429 | Over your key's requests a minute (or, with a publishable key, one visitor's); wait `Retry-After` seconds. |
| `QUOTA_EXCEEDED` | 429 | Your key's monthly requests are used up; `Retry-After` says when they start again. |
| `INTERNAL` | 500 | Something went wrong on our side; try again. |
| `UPSTREAM` | 502 | A network we read from did not answer; try again. |
| `PAUSED` | 503 | The contract on this network is paused. |
| `NOT_READY` | 503 | The contract on this network is not ready for trades yet. |
