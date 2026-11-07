// A whole swap on Base with viem: quote, exact approval, send, follow.
// Run on a server or a script you control: the API key must not reach a browser.
//   SOHEIL_ROUTER_KEY=sk_... PRIVATE_KEY=0x... npx tsx examples/swap-viem.ts
import { createPublicClient, createWalletClient, erc20Abi, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { COIN, SoheilRouter } from "@soheil-fi/router";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const wallet = createWalletClient({ account, chain: base, transport: http() });
const chain = createPublicClient({ chain: base, transport: http() });
const router = new SoheilRouter({ apiKey: process.env.SOHEIL_ROUTER_KEY });

// 1. The best price for 1 USDC → ETH, and the transaction that makes it
const quote = await router.getQuote({
  fromChainId: base.id,
  fromToken: USDC,
  toToken: COIN,
  fromAmount: 1_000_000n, // 1 USDC (6 decimals)
  fromAddress: account.address,
  slippageBps: 50,
});
console.log(`receive ${quote.toAmount} wei (at least ${quote.toAmountMin}), fees ${quote.fees.totalBps} bps`);

// 2. Approve exactly fromAmount, never unlimited (skipped when selling the coin)
if (quote.approvalAddress) {
  const approve = await wallet.writeContract({
    address: quote.fromToken as `0x${string}`,
    abi: erc20Abi,
    functionName: "approve",
    args: [quote.approvalAddress as `0x${string}`, BigInt(quote.fromAmount)],
  });
  await chain.waitForTransactionReceipt({ hash: approve });
}

// 3. Send the transaction unchanged
const tx = quote.transactionRequest;
const hash = await wallet.sendTransaction({ to: tx.to as `0x${string}`, data: tx.data as `0x${string}`, value: BigInt(tx.value) });
console.log("sent", hash);

// 4. Follow it until it is done
const status = await router.waitForTrade(base.id, hash);
console.log(status.status, status.trade?.toAmount);
