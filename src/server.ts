import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GatewayClient, GatewayError, type Manifest } from "./client.js";
import { PROMPTS } from "./prompts.js";

export const SERVER_NAME = "wheewise-dealer";

// Tools that remove something visible to buyers or cannot be undone with one more call.
const DESTRUCTIVE = new Set(["mark_vehicle_sold", "remove_review_reply", "rotate_site_key"]);

/** An MCP server that exposes whatever tools the dealer's token allows. The list comes from Wheewise, so it never drifts from the app. */
export function createServer(client: Pick<GatewayClient, "manifest" | "call">, version: string): Server {
  const server = new Server({ name: SERVER_NAME, version }, { capabilities: { tools: {}, prompts: {} } });

  // One fetch per session: the list only changes when the dealer creates a new token or Wheewise ships a release.
  let manifest: Promise<Manifest> | null = null;
  const load = () => {
    manifest ??= client.manifest().catch((e) => {
      manifest = null; // do not cache a failure: the next call tries again
      throw e;
    });
    return manifest;
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const { shop, tools } = await load();
    return {
      tools: tools.map((t) => ({
        name: t.name,
        description: `${t.description} (Shop: ${shop})`,
        inputSchema: { type: "object" as const, ...t.inputSchema },
        annotations: {
          readOnlyHint: t.scope === "read",
          destructiveHint: DESTRUCTIVE.has(t.name),
          idempotentHint: t.scope === "read",
          openWorldHint: false,
        },
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const result = await client.call(request.params.name, (request.params.arguments ?? {}) as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      // A refusal is an answer the assistant can read and act on, not a protocol failure.
      const message = err instanceof GatewayError ? err.message : "Something went wrong. Try again.";
      return { isError: true, content: [{ type: "text" as const, text: message }] };
    }
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS.map(({ name, title, description, arguments: args }) => ({ name, title, description, arguments: args })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = PROMPTS.find((p) => p.name === request.params.name);
    if (!prompt) throw new Error(`Unknown prompt: ${request.params.name}`);
    return {
      description: prompt.description,
      messages: [{ role: "user" as const, content: { type: "text" as const, text: prompt.text(request.params.arguments ?? {}) } }],
    };
  });

  return server;
}
