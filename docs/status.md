# Trade status

Source: https://soheil.fi/developers/docs/status/

Whether a trade went through, and what the contract recorded.

`GET /v1/status?chainId=&txHash=` (API key)

`txHash` is the transaction the user sent; on Solana its signature. A trade from Bitcoin, TON, Tron, Sui or a network paid by deposit is followed by its quote: `id=` instead of `txHash`; a swap on Tron and a Sui transaction the wallet signed take both, `id=` and `txHash=` (on Sui the digest, base58; on Tron the swap's transaction id), and each counts only its own trade ([Trades from Bitcoin](https://soheil.fi/developers/docs/bitcoin/#status), [Trades from TON](https://soheil.fi/developers/docs/ton/#status)). A transfer to Cosmos Hub or to a network paid by deposit can come with a `transactionRequest` to another contract than ours (its `to`; approve `approvalAddress` as usual), and a trade from Cosmos Hub with a `cosmos.memo`: send `id=` with `txHash=` for those too.

## Request

curl:

```bash
curl "https://api.soheil.fi/v1/status?chainId=8453&txHash=0x…" -H "x-api-key: sk_xxxxxxxx_…"
```

Python:

```python
import os, time, requests

def wait(chain_id: int, tx_hash: str) -> dict:
    """Asks every few seconds until the trade is settled (a bridge: paid on the destination, or refunded)."""
    while True:
        s = requests.get("https://api.soheil.fi/v1/status", params={"chainId": chain_id, "txHash": tx_hash},
                         headers={"x-api-key": os.environ["SOHEIL_ROUTER_KEY"]}, timeout=30).json()
        if s.get("status") in ("DONE", "FAILED", "REFUNDED", "NOT_OURS"):
            return s
        time.sleep(4)
```

## States

| status | substatus | Meaning |
| --- | --- | --- |
| `PENDING` | `NOT_MINED` | Sent, not mined yet. Ask again in a few seconds. |
| `DONE` | `COMPLETED` | Mined (a bridge transfer: paid on the destination, see `receiving`); `trade` has what the contract recorded. |
| `PENDING` | `WAITING_FILL` | A bridge transfer: mined on the source network, not paid on the destination yet (usually seconds). |
| `PENDING` | `REFUND_PENDING` | A bridge transfer nobody filled: the refund to the sender on the source network is on its way (or waits for the sender to cancel it). |
| `FAILED` | `BRIDGE_FAILED` | The bridge reports the transfer failed. |
| `REFUNDED` | `REFUNDED` | A bridge transfer paid back to the sender on the source network. When the bridge says, `refund` is that payment's transaction and `reason` why: `PRICE_MOVED` (the price moved past the slippage limit before it was filled; a fresh quote usually goes through) or `NOT_FILLED`. On some routes the refund waits in the user's own refund box, a contract of ours that can pay only that user: `refundBox` is its address, and anyone may call its `release(token)` (`address(0)` for the coin) to send it all to the user. |
| `FAILED` | `REVERTED` | Sent to our contract and reverted; the user kept their tokens. |
| `NOT_OURS` | `null` | Mined, but not a trade through our contract. |
| `NOT_FOUND` | `null` | The network does not know this transaction (yet). Check the hash and chainId. |
| `PENDING` | `WAITING_DEPOSIT` | From Bitcoin or TON: the deposit has not arrived (or is not seen yet). |
| `PENDING` | `PROCESSING` | From Bitcoin or TON: the deposit arrived and is being swapped and paid out. From a Cosmos network: the transfer is on its way. |

## Response

```json
{
  "status": "DONE", "substatus": "COMPLETED",
  "sending":   { "chainId": 8453, "txHash": "0x…", "blockNumber": 22018445, "timestamp": 1793710210 },
  "receiving": { "chainId": 8453, "txHash": "0x…", "blockNumber": 22018445, "timestamp": 1793710210 },
  "trade": { "id": "0x9f2c…", "sender": "0xyouruser…", "recipient": "0xyouruser…",
             "fromToken": "0x8335…2913", "fromAmount": "100000000",
             "toToken": "0x0000…0000", "toAmount": "41290000000000000",
             "routerFee": "100000", "integratorFee": "200000", "integratorAddress": "0xyourfeeaddress…" },
  "received": { "token": "0x0000…0000", "amount": "41290000000000000" }
}
```

## Notes

-   `chainId` is the network the transaction was sent on. `sending` is that transaction; `receiving` is the one that paid the recipient: the same for a swap, a second one on `toChainId` for a bridge.
-   Once `DONE`, `received` is what reached the recipient: `token` on the receiving network and `amount` in its smallest unit. For a swap it comes from the contract's own record; for a bridge transfer, when the bridge reports it. Otherwise it is `null`, and `receiving` still names the payout transaction.
-   New values may appear in `status` and `substatus`: treat an unknown `status` as `PENDING`.
-   A transaction holding more than one trade (a contract calling ours twice) shows the first.
-   Every trade is also read from the chain on its own, so your earnings count whether or not you ask.
