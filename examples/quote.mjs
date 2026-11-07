// Prints the best price for 0.001 ETH → USDC on Base.
//   SOHEIL_ROUTER_KEY=sk_... node examples/quote.mjs
import { COIN, SoheilRouter } from "@soheil-fi/router";

const router = new SoheilRouter({ apiKey: process.env.SOHEIL_ROUTER_KEY });
const quote = await router.getQuote({
  fromChainId: 8453,
  fromToken: COIN,
  toToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  fromAmount: 10n ** 15n,
  fromAddress: "0x000000000000000000000000000000000000dEaD",
});
console.log(`${Number(quote.toAmount) / 1e6} USDC, at least ${Number(quote.toAmountMin) / 1e6}`);
