# Fees and earnings

Source: https://soheil.fi/developers/docs/fees/

The router takes 0.1%. You set your own fee on top, up to 0.9%, paid to you in the same transaction.

## How fees work

Two fees come off the amount sold, in the token sold, before the swap: the router's **10 bps (0.1%)**, and **yours**, paid to your key's fee address. Your fee is your key's default, or `integratorBps` on the request (0 up to your key's ceiling, 90 bps at most). Together they never exceed 100 bps: the contract refuses more.

## Example

Selling 1,000 USDC with your fee at 20 bps:

|  | Amount | Goes to |
| --- | --- | --- |
| Router fee (0.1%) | 1 USDC | the router |
| Your fee (0.2%) | 2 USDC | your wallet, in the same transaction |
| Swapped | 997 USDC | the user's output |

The quote shows all of this in `fees`, so you can show your users exactly what they pay. [`GET /v1/me`](https://soheil.fi/developers/docs/me/) adds up what your trades earned.

## Compared with other APIs

The fee each takes for itself on a swap:

| API | Its fee | Note |
| --- | --- | --- |
| **Soheil Router** | **0.1%** | on each trade; your own fee is separate and all yours |
| Other swap APIs | 0.15% to 0.25% | what other aggregator APIs take for themselves, as their own docs publish it |

> On a $10,000 swap, the router takes $10 where other swap APIs take $15 to $25. The difference stays with your user, or becomes room for your own fee.

## Guarantees

-   The contract checks the router's fee against what the quote said (`maxSoheilBps`), so it can never charge more than the user was shown.
-   Coin sent along with a token trade pays the same rates.
-   Both fees are paid inside the trade. There is no invoice, no payout and nothing to claim.
