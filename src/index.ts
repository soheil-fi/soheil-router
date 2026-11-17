/**
 * Soheil Router: the best price for a token swap or a transfer to another network, and the one transaction that makes
 * it. On EVM networks through a non-upgradeable contract that holds no funds between trades; on Solana, Bitcoin, TON,
 * Tron, Sui and Cosmos networks without one. Docs: https://soheil.fi/developers/docs/
 */

/** Networks: GET /v1/chains. */
export interface Network {
  chainId: number;
  name: string;
  /** Our contract on this network (lower case). */
  contract: string;
  /** The router's own fee, in basis points. */
  routerBps: number;
  feeCollector: string | null;
  explorer: string | null;
  /** Contracts a trade may call there (for allowlists). */
  partners: { name: string; contract: string }[];
}

/**
 * A network served without a contract of ours: GET /v1/networks (Solana, Bitcoin, TON, Tron, Sui, Hyperliquid, Cosmos
 * networks, and the networks paid by deposit). Each says what it can do right now.
 */
export interface OtherNetwork {
  /** The id to give as fromChainId or toChainId. */
  chainId: number;
  name: string;
  /** How its addresses and tokens look: solana, bitcoin, ton, tron, sui, hyperliquid, cosmos, deposit; more may come. */
  type: string;
  /** Its coin as a token. */
  nativeToken: string;
  explorer: string | null;
  /** Transfers can be paid out there. */
  receive: boolean;
  /** Trades can start there. */
  send: boolean;
  /** Swaps within the network. */
  swap: boolean;
  routerBps: number;
  feeCollector: string | null;
  /** The tokens it takes, as written, where it takes only a few; null where any token works or its one token is nativeToken. */
  tokens: string[] | null;
  /**
   * Whether a trade that starts here can carry your integratorBps (paid by the bridge to your key's EVM fee address and
   * claimed there). On Tron: its transfers, not its swaps. Not yet on Solana or the Cosmos networks.
   */
  integratorFee: boolean;
}

/** GET /v1/info. */
export interface Info {
  name: string;
  version: string;
  networks: number;
  routerBps: number;
  maxIntegratorBps: number;
  keys: string;
  keyRequests: string | null;
  docs: string;
  openapi: string;
}

/**
 * What to swap. Amounts are integer strings in the token's smallest unit; the coin is 0x000…0 on EVM networks. On the
 * other networks tokens and addresses are written as that network writes them (GET /v1/networks).
 */
export interface QuoteRequest {
  fromChainId: number;
  /** Where the recipient receives: fromChainId for a swap (the default), or another of the router's networks to bridge there. */
  toChainId?: number;
  fromToken: string;
  toToken: string;
  fromAmount: string | bigint;
  /** The wallet that pays and signs. */
  fromAddress: string;
  /** Where the tokens go; defaults to fromAddress. Required when the recipient is on another kind of network. */
  toAddress?: string;
  /** Max price move in basis points (1 to 5000, default 50). */
  slippageBps?: number;
  /** Your own fee in basis points, paid to your key's fee address inside the trade. */
  integratorBps?: number;
  /**
   * Set true when you only show this price and will ask again before anyone signs (a list of routes, a preview). Partners
   * that limit quotes which are never traded are then left out, so the quote you ask for to sign can only be as good or better.
   */
  priceOnly?: boolean;
}

export interface Fees {
  token: string;
  totalBps: number;
  routerBps: number;
  integratorBps: number;
  routerFee: string;
  integratorFee: string;
}

/** The transaction the user signs, unchanged; value is hex. */
export interface TransactionRequest {
  to: string;
  data: string;
  value: string;
  chainId: number;
}

/** Where to pay a quote that is paid by deposit: send exactly amount of token to address (with memo when it is set). */
export interface Deposit {
  chainId: number;
  /** A single-use address for this quote alone. */
  address: string;
  token: string;
  amount: string;
  /** XRP, Stellar and the like: without it the deposit is not credited. */
  memo?: string;
}

/** One message of a trade that starts on TON, as TON Connect's sendTransaction takes it. */
export interface TonMessage {
  address: string;
  /** Nanotons. */
  amount: string;
  /** The message body: a BOC, base64. */
  payload: string;
}

/** A contract call on Tron for the sender's wallet (TronWeb's triggerSmartContract with this raw calldata). */
export interface TronCall {
  contract: string;
  data: string;
  /** TRX sent with the call, in sun. */
  callValue: string;
  /** The most energy the call may burn, in sun. */
  feeLimit: number;
  /** The router's fee when TRX is sold in a swap on Tron: a plain TRX transfer to send before the call. */
  fee?: { to: string; amount: string };
  /** The TRX this quote's transactions are expected to burn for the sender, in sun. Show it: a transaction that runs out fails. */
  networkCost?: string;
}

/**
 * The transaction of a trade that starts on a Cosmos network: sign every message, in order, in one transaction on
 * chainId (the network's own id, like "cosmoshub-4"). The router's fee is the last message.
 */
export interface CosmosTx {
  chainId: string;
  messages: CosmosMessage[];
}

/**
 * One Cosmos message: its type and its fields as a JSON text, named as in its protobuf definition. A text because it
 * holds numbers larger than JavaScript's (timeout_timestamp): read those as bigint or strings.
 */
export interface CosmosMessage {
  typeUrl: string;
  value: string;
}

/**
 * What the recipient gets, the fees, and what the sender signs. Which field carries that depends on where the trade
 * starts: transactionRequest (EVM), transaction (Solana; Sui's USDC to USDC), messages (TON), tron (Tron), cosmos (a
 * Cosmos network), or deposit (Bitcoin, Sui and the networks paid by deposit: nothing to sign, an address to pay).
 */
export interface Quote {
  id: string;
  type: string;
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  /** The least the user receives: enforced by the contract. */
  toAmountMin: string;
  fees: Fees;
  /** Approve this address for exactly fromAmount first (null when fromToken is the coin). */
  approvalAddress: string | null;
  /** From an EVM network: the call to our contract. Null elsewhere. */
  transactionRequest: TransactionRequest | null;
  gasEstimate: string | null;
  /** Unix seconds after which the quote should be asked again. */
  validUntil: number;
  estimatedDurationSeconds: number;
  /**
   * From Solana: the unsigned transaction, base64, good until the chain passes lastValidBlockHeight. From Sui (USDC to
   * USDC): the transaction as JSON for Transaction.from in Sui's SDK; the wallet adds the gas, signs and sends it. Follow
   * it with getStatus(chainId, { id: quote.id, txHash: digest }).
   */
  transaction?: string | null;
  lastValidBlockHeight?: number | null;
  /** Paid by deposit: where to send exactly fromAmount. Follow it with getStatus(chainId, { id: quote.id }). */
  deposit?: Deposit | null;
  /** From TON: what the wallet sends, in one transaction. Follow it with getStatus(chainId, { id: quote.id }). */
  messages?: TonMessage[] | null;
  /** From Tron: the call the wallet sends. Follow it with getStatus(chainId, { id: quote.id, txHash }). */
  tron?: TronCall;
  /** From a Cosmos network: the transaction the wallet signs. Follow it with getStatus(chainId, { id: quote.id, txHash }). */
  cosmos?: CosmosTx;
}

/** How a sent trade is named: its transaction, its quote's id, or both (see Quote). */
export interface TradeRef {
  txHash?: string;
  id?: string;
}

export interface Leg {
  chainId: number;
  txHash: string;
  blockNumber: number | null;
  timestamp: number | null;
}

export interface Trade {
  id: string;
  sender: string;
  recipient: string;
  fromToken: string;
  fromAmount: string;
  toToken: string;
  toAmount: string;
  routerFee: string;
  integratorFee: string;
  integratorAddress: string | null;
}

/**
 * PENDING, DONE, REFUNDED (a bridge transfer paid back on the source network), FAILED, NOT_OURS or NOT_FOUND; more may
 * come (treat an unknown one as PENDING). For a bridge transfer, receiving is the payout on the destination.
 */
export interface Status {
  status: string;
  substatus: string | null;
  sending: Leg | null;
  receiving: Leg | null;
  trade: Trade | null;
  /** The transaction that paid a refund back on the source network, when the bridge names it. */
  refund?: Leg | null;
  /** Why a transfer was refunded, when the bridge says: PRICE_MOVED or NOT_FILLED. */
  reason?: string | null;
}

/** The API's error: code (INVALID, UNAUTHORIZED, NO_ROUTE, RATE_LIMITED…) and a message safe to show users. */
export class SoheilRouterError extends Error {
  constructor(readonly code: string, readonly status: number, message: string, readonly retryAfterSeconds?: number) {
    super(message);
    this.name = "SoheilRouterError";
  }
}

export interface Options {
  /** Your API key (free: https://soheil.fi/developers/dashboard/). Keep it on your server. */
  apiKey?: string;
  /** Defaults to https://api.soheil.fi */
  baseUrl?: string;
  fetch?: typeof fetch;
}

/** The final statuses of a trade. */
const FINAL = new Set(["DONE", "REFUNDED", "FAILED", "NOT_OURS"]);

export class SoheilRouter {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(options: Options = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.soheil.fi").replace(/\/+$/, "");
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /** The networks served without a contract of ours, and what each can do. No key needed. */
  async getOtherNetworks(): Promise<OtherNetwork[]> {
    return this.request<OtherNetwork[]>("GET", "/v1/networks");
  }

  /** Where the router is live. No key needed. */
  async getNetworks(): Promise<Network[]> {
    return this.request<Network[]>("GET", "/v1/chains");
  }

  /** Fee, limits, docs. No key needed. */
  async getInfo(): Promise<Info> {
    return this.request<Info>("GET", "/v1/info");
  }

  /** The best price and the transaction to sign. */
  async getQuote(req: QuoteRequest): Promise<Quote> {
    const body = { ...req, toChainId: req.toChainId ?? req.fromChainId, fromAmount: String(req.fromAmount) };
    return this.request<Quote>("POST", "/v1/quote", body);
  }

  /**
   * Where a sent trade stands. From an EVM network or Solana: its transaction hash. Elsewhere the quote's id, with the
   * transaction's hash where Quote says so: { id } or { id, txHash }.
   */
  async getStatus(chainId: number, trade: string | TradeRef): Promise<Status> {
    const ref: TradeRef = typeof trade === "string" ? { txHash: trade } : trade;
    const q = new URLSearchParams({ chainId: String(chainId) });
    if (ref.txHash) q.set("txHash", ref.txHash);
    if (ref.id) q.set("id", ref.id);
    return this.request<Status>("GET", `/v1/status?${q}`);
  }

  /** Polls getStatus until the trade is DONE, REFUNDED, FAILED or NOT_OURS (or the time runs out). */
  async waitForTrade(chainId: number, trade: string | TradeRef, { intervalMs = 3000, timeoutMs = 300_000 } = {}): Promise<Status> {
    const end = Date.now() + timeoutMs;
    for (;;) {
      const s = await this.getStatus(chainId, trade);
      if (FINAL.has(s.status) || Date.now() + intervalMs > end) return s;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  /** Sends a signed Solana transaction of a quote through the router's own connection. Sending it yourself works as well. */
  async sendSolana(chainId: number, transaction: string): Promise<{ chainId: number; txHash: string }> {
    return this.request("POST", "/v1/send", { chainId, transaction });
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { accept: "application/json" };
    if (this.apiKey) headers["x-api-key"] = this.apiKey;
    if (body !== undefined) headers["content-type"] = "application/json";
    const res = await this.fetcher(this.baseUrl + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const retry = Number(res.headers.get("retry-after"));
      throw new SoheilRouterError(json?.error?.code ?? `HTTP_${res.status}`, res.status, json?.error?.message ?? res.statusText,
        Number.isFinite(retry) && retry > 0 ? retry : undefined);
    }
    return json as T;
  }
}

/** An EVM network's coin as a token address. */
export const COIN = "0x0000000000000000000000000000000000000000";
