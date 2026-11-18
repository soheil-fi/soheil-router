# API keys

Source: https://soheil.fi/developers/docs/keys/

One key per app: it carries your fee address, your fee and your limits.

## Getting a key

1.  Create a free account in the [developer dashboard](https://soheil.fi/developers/dashboard/) (email and password, confirmed with a code).
2.  In **API keys**, make a key: its name, the address that receives your fee, and your fee (0 to 90 bps).
3.  Copy the key: it is shown only once, and it works right away.

You get a key like `sk_<prefix>_<secret>`.

## Secret and publishable keys

|  | Secret key | Publishable key |
| --- | --- | --- |
| Looks like | `sk_…` | `pk_…` |
| Where it lives | Your server, never in a web page | Your web pages: it is meant to be seen |
| Works from | Anywhere | Only the websites listed on it (the browser's `Origin`) |
| Endpoints | All | `/v1/quote` and `/v1/status` |
| Limits | Per key | Per key, and per visitor |
| Used for | Bots, backends, your own app's server | [The swap widget](https://soheil.fi/developers/docs/widget/), quotes from your front end |

A publishable key is safe in a public page because of where it works, not because it is hidden: anyone can read it, but browsers send the page's real address with every call, and the router answers only the websites you listed (like `https://app.example.com`, `https://*.example.com` for every subdomain, or `http://localhost:3000` while you build). Your fee still goes to your own fee address, so a copied key can only pay you.

## Using it

Send it in the `x-api-key` header on every call that needs one.

```bash
-H "x-api-key: sk_xxxxxxxx_…"
```

> We keep only a hash of the secret, so a lost key is replaced, not recovered. Keep it on your server.

## Changing a key

Each key carries its fee address, its default fee, its fee ceiling and its limits. Change the name, fee address and fee in the dashboard, switch a key off or delete it there at once if it leaks; write to developers \[at\] soheil.fi for higher limits.

> Turn on two-factor sign-in in the dashboard's Settings: your account controls where your fees go.
