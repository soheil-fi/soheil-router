# Swap widget

Source: https://soheil.fi/developers/docs/widget/

A complete swap and bridge form for your site in two lines of code. Your fee is paid to your wallet in every trade.

## Add it to your page

1.  Make a **publishable key** in the [dashboard](https://soheil.fi/developers/dashboard/) and list your website on it ([Secret and publishable keys](https://soheil.fi/developers/docs/keys/#kinds)).
2.  Add the script once, and the tag where the widget goes. It works in plain HTML, React, Vue, Svelte, WordPress: anywhere a page can hold a tag.

```html
<!-- 1. Once, anywhere on the page -->
<script src="https://soheil.fi/widget/v1.js" defer></script>

<!-- 2. Where the widget goes -->
<soheil-swap api-key="pk_your_key" theme="auto"></soheil-swap>
```

Visitors pick the tokens and networks, connect their wallet, approve exactly the amount and sign one transaction. Bridges are followed until they land. Everything runs in the visitor's browser and wallet: no account, nothing held by you or by us.

## Build yours

Choose the look and the starting tokens, try it with live prices, and copy the code.

## Attributes

| Attribute | Value | What it does |
| --- | --- | --- |
| `api-key` | pk\_… | Your publishable key. Required. |
| `theme` | `light`, `dark` or `auto` | Auto follows the visitor's system setting. |
| `accent` | #rrggbb | The color of the main button and highlights; the text on it turns dark or light to stay readable. |
| `from-chain` | chain id | The network to pay on at start (one of `GET /v1/chains`). |
| `from-token` | address | The token to pay at start; the coin is `0x000…0`. |
| `to-chain` | chain id | The network to receive on at start (the same network: a swap; another: a bridge). |
| `to-token` | address | The token to receive at start. |
| `amount` | number | A starting amount, in tokens (`25`, not in the smallest unit). |
| `lock-from` | (no value) | The visitor cannot change the token to pay. |
| `lock-to` | (no value) | The visitor cannot change the token to receive: for a “buy our token” page. |
| `chains` | ids, comma-separated | Only these networks (`8453,42161,10`). |
| `slippage` | bps | The starting max slippage, 1 to 5000; 50 (0.5%) by default. Visitors can change it in the settings. |
| `fee-bps` | bps | Your fee on this page, up to your key's ceiling; your key's default when left out. |
| `partner` | text | Your name, shown next to your fee in the summary. |
| `allow-recipient` | (no value) | Visitors can send the output to another address. |
| `to-address` | address | Every trade pays this address (a deposit page, a game top-up); shown to the visitor. |
| `title` | text | The heading; `Swap` by default. |

## Wallets and events

By default the widget offers the wallets installed in the browser (MetaMask, Rabby, Coinbase Wallet and every other wallet that announces itself). If your app already connected the visitor's wallet, give the widget that wallet instead: set its `provider` to any EIP-1193 provider. Its events tell your page what happens.

```js
const swap = document.querySelector("soheil-swap");

// Use the wallet your app already connected (any EIP-1193 provider: wagmi, RainbowKit, Privy, window.ethereum…)
swap.provider = await connector.getProvider();

swap.addEventListener("soheil:transaction", (e) => console.log("sent", e.detail.chainId, e.detail.txHash));
swap.addEventListener("soheil:success", (e) => console.log("landed", e.detail.status));
swap.addEventListener("soheil:error", (e) => console.warn(e.detail.code, e.detail.message));
```

| Event | detail |
| --- | --- |
| `soheil:ready` | { version, chains }: the networks are loaded. |
| `soheil:quote` | A fresh price: the [quote](https://soheil.fi/developers/docs/quote/#response) as the API returns it. |
| `soheil:connect` | { address, chainId }: a wallet connected. |
| `soheil:transaction` | { chainId, txHash, quote }: the visitor signed and the trade was sent. |
| `soheil:success` | { chainId, txHash, quote, status }: the swap is mined, or the bridge paid out ([status](https://soheil.fi/developers/docs/status/)). |
| `soheil:error` | { stage, code, message }: no price, the visitor declined, a revert or a refund. |

## Size and style

The widget fills its container up to 420 pixels and keeps its own styles inside, so your page's CSS never breaks it. Set its width and corners from outside:

```text
soheil-swap {
  max-width: 400px;     /* it fills its container up to 420px by default */
  --sw-radius: 12px;    /* corner radius */
}
```

## Good to know

-   It works on the networks where the router has its contract ([Networks](https://soheil.fi/developers/docs/networks/)), with wallets on those networks.
-   It asks for exact approvals only, never unlimited ones, and re-prices before the visitor signs.
-   Each visitor can make 20 requests a minute through your key, so one tab left open cannot use up your key's minute.
-   The script is one file with no dependencies (about 64 KB, 16 KB compressed). Load it with `defer` so it never slows your page.
-   Prices refresh by themselves while the visitor is using the form, and stop a few minutes after they leave it; the widget always gets a fresh price before the visitor signs. Every price counts as a request on your key.
-   If your site sets a Content-Security-Policy, allow `script-src https://soheil.fi`, `connect-src https://api.soheil.fi https://soheil.fi` and `img-src https:` (token logos).

> **Your own interface instead?**Call the API from your server with a secret key: [Quick start](https://soheil.fi/developers/docs/quick-start/).
