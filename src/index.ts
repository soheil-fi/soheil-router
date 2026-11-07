/**
 * Soheil Router: the best price for a token swap and the one transaction that makes it, through a non-upgradeable
 * contract that holds no funds between trades. Docs: https://soheil.fi/developers/docs/
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

/** What to swap. Amounts are integer strings in the token's smallest unit; the coin is 0x000…0. */
export interface QuoteRequest {
  fromChainId: number;
  /** Same as fromChainId for now; defaults to it. */
  toChainId?: number;
  fromToken: string;
  toToken: string;
  fromAmount: string | bigint;
  /** The wallet that pays and signs. */
  fromAddress: string;
  /** Where the tokens go; defaults to fromAddress. */
  toAddress?: string;
  /** Max price move in basis points (1 to 5000, default 50). */
  slippageBps?: number;
  /** Your own fee in basis points, paid to your key's fee address inside the trade. */
  integratorBps?: number;
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
  transactionRequest: TransactionRequest;
  gasEstimate: string;
  /** Unix seconds after which the quote should be asked again. */
  validUntil: number;
  estimatedDurationSeconds: number;
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

/** PENDING, DONE, FAILED, NOT_OURS or NOT_FOUND; more may come (treat an unknown one as PENDING). */
export interface Status {
  status: string;
  substatus: string | null;
  sending: Leg | null;
  receiving: Leg | null;
  trade: Trade | null;
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
const FINAL = new Set(["DONE", "FAILED", "NOT_OURS"]);

export class SoheilRouter {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(options: Options = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.soheil.fi").replace(/\/+$/, "");
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
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

  /** Where a sent trade stands. */
  async getStatus(chainId: number, txHash: string): Promise<Status> {
    return this.request<Status>("GET", `/v1/status?chainId=${chainId}&txHash=${encodeURIComponent(txHash)}`);
  }

  /** Polls getStatus until the trade is DONE, FAILED or NOT_OURS (or the time runs out). */
  async waitForTrade(chainId: number, txHash: string, { intervalMs = 3000, timeoutMs = 300_000 } = {}): Promise<Status> {
    const end = Date.now() + timeoutMs;
    for (;;) {
      const s = await this.getStatus(chainId, txHash);
      if (FINAL.has(s.status) || Date.now() + intervalMs > end) return s;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
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

/** The network's coin as a token address. */
export const COIN = "0x0000000000000000000000000000000000000000";
