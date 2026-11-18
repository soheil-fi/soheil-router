# Quick start

Source: https://soheil.fi/developers/docs/quick-start/

From an API key to a confirmed swap or bridge: quote, approve, send.

## Steps

1.  **Get an API key.** See [API keys](https://soheil.fi/developers/docs/keys/).
2.  **Ask for a quote** with [`GET /v1/quote`](https://soheil.fi/developers/docs/quote/).
3.  **Approve** exactly `fromAmount` to `approvalAddress`, when it is set.
4.  **Send** `transactionRequest` as it is, from the user's wallet.
5.  **Follow it** with [`GET /v1/status`](https://soheil.fi/developers/docs/status/), or just read the receipt.

## The code

JavaScript (viem):

```js
// 1. Quote (on your server: keep the key there)
const params = new URLSearchParams({
  fromChainId: "8453", toChainId: "8453",
  fromToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  toToken: "0x0000000000000000000000000000000000000000",   // ETH
  fromAmount: "100000000",                                  // 100 USDC (6 decimals)
  fromAddress: user, slippageBps: "50",
});
const q = await fetch(`https://api.soheil.fi/v1/quote?${params}`, { headers: { "x-api-key": process.env.SOHEIL_ROUTER_KEY } })
  .then((r) => r.json());
if (q.error) throw new Error(q.error.message);

// 2. Approve exactly fromAmount to our contract (skipped for the coin)
if (q.approvalAddress) {
  await wallet.writeContract({ address: q.fromToken, abi: erc20Abi, functionName: "approve",
    args: [q.approvalAddress, BigInt(q.fromAmount)] });
}

// 3. Send the transaction as it is
const hash = await wallet.sendTransaction({
  to: q.transactionRequest.to, data: q.transactionRequest.data, value: BigInt(q.transactionRequest.value),
});
```

Python (web3.py):

```python
# pip install requests web3
import os, requests
from web3 import Web3

API = "https://api.soheil.fi/v1"
KEY = os.environ["SOHEIL_ROUTER_KEY"]                 # on your server only
w3 = Web3(Web3.HTTPProvider(os.environ["BASE_RPC_URL"]))
account = w3.eth.account.from_key(os.environ["BOT_PRIVATE_KEY"])  # your bot's own wallet

# 1. Quote: 100 USDC on Base to ETH
q = requests.get(f"{API}/quote", headers={"x-api-key": KEY}, timeout=30, params={
    "fromChainId": 8453, "toChainId": 8453,
    "fromToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",   # USDC on Base
    "toToken": "0x0000000000000000000000000000000000000000",     # ETH
    "fromAmount": "100000000",                                   # 100 USDC (6 decimals)
    "fromAddress": account.address, "slippageBps": 50,
}).json()
if "error" in q:
    raise RuntimeError(q["error"]["message"])

def send(tx):
    tx = {**tx, "from": account.address, "chainId": w3.eth.chain_id,
          "nonce": w3.eth.get_transaction_count(account.address), "gasPrice": w3.eth.gas_price}
    tx["gas"] = w3.eth.estimate_gas(tx)
    signed = account.sign_transaction(tx)
    return w3.eth.wait_for_transaction_receipt(w3.eth.send_raw_transaction(signed.raw_transaction))

# 2. Approve exactly fromAmount to our contract (skipped for the coin)
if q["approvalAddress"]:
    # approve(address,uint256) is 0x095ea7b3, then the spender and the amount as 32-byte words
    data = "0x095ea7b3" + q["approvalAddress"][2:].lower().rjust(64, "0") + format(int(q["fromAmount"]), "064x")
    send({"to": Web3.to_checksum_address(q["fromToken"]), "data": data, "value": 0})

# 3. Send the transaction as it is
t = q["transactionRequest"]
receipt = send({"to": Web3.to_checksum_address(t["to"]), "data": t["data"], "value": int(t["value"], 16)})
print("sent", receipt.transactionHash.hex(), "status", receipt.status)
```

curl:

```bash
curl "https://api.soheil.fi/v1/quote?fromChainId=8453&toChainId=8453\
&fromToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\
&toToken=0x0000000000000000000000000000000000000000\
&fromAmount=100000000&fromAddress=0xYourUser&slippageBps=50" \
  -H "x-api-key: sk_xxxxxxxx_…"
```

> **Keep the key on your server**The API allows calls from browsers, but a key in a public page can be read by anyone. Call us from your backend.
