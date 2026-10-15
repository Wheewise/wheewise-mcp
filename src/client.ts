/** Talks to the Wheewise dealer gateway (https://dealer.wheewise.com/api/mcp/v1) with the dealer's personal access token. */

export type ToolInfo = {
  name: string;
  description: string;
  scope: "read" | "write";
  inputSchema: Record<string, unknown>;
};

export type Manifest = { shop: string; scopes: string[]; tools: ToolInfo[] };

export class GatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type ClientOptions = {
  token: string;
  baseUrl?: string;
  /** Per-request timeout in milliseconds. */
  timeoutMs?: number;
  userAgent?: string;
};

export class GatewayClient {
  private readonly base: string;
  private readonly timeoutMs: number;

  constructor(private readonly options: ClientOptions) {
    // The token goes in a header: refuse to send it anywhere that is not HTTPS (localhost is allowed for development).
    const base = (options.baseUrl ?? "https://dealer.wheewise.com").replace(/\/+$/, "");
    const url = new URL(base);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !local) throw new Error("WHEEWISE_API_URL must be an https:// address.");
    this.base = `${base}/api/mcp/v1`;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.base}${path}`, {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${this.options.token}`,
          "Content-Type": "application/json",
          "User-Agent": this.options.userAgent ?? "wheewise-dealer-mcp",
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      throw new GatewayError(
        timedOut ? "Wheewise took too long to answer. Try again." : "Could not reach Wheewise. Check your internet connection.",
        0,
      );
    }
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      const message =
        res.status === 401
          ? "Your Wheewise token is invalid, expired or revoked. Create a new one in the dealer app under Settings → AI assistant access."
          : (body?.error ?? `Wheewise answered with an error (${res.status}).`);
      throw new GatewayError(message, res.status);
    }
    return body as T;
  }

  manifest(): Promise<Manifest> {
    return this.request<Manifest>("/tools", { method: "GET" });
  }

  /** Runs one tool. A tool's own refusal (wrong id, invalid price, …) comes back as a GatewayError with a message fit to show. */
  async call(name: string, args: Record<string, unknown>): Promise<unknown> {
    const body = await this.request<{ ok: boolean; result?: unknown; error?: string }>("/call", {
      method: "POST",
      body: JSON.stringify({ name, arguments: args }),
    });
    if (!body.ok) throw new GatewayError(body.error ?? "The tool failed.", 422);
    return body.result;
  }
}
