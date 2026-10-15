#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GatewayClient } from "./client.js";
import { createServer } from "./server.js";

const token = process.env.WHEEWISE_API_TOKEN?.trim();
if (!token) {
  // stdout belongs to the MCP protocol: every human message goes to stderr.
  console.error(
    "WHEEWISE_API_TOKEN is not set.\nCreate a token in the dealer app under Settings → AI assistant access, then add it to this server's settings as WHEEWISE_API_TOKEN.",
  );
  process.exit(1);
}

const version = (JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string }).version;
const client = new GatewayClient({
  token,
  baseUrl: process.env.WHEEWISE_API_URL,
  userAgent: `wheewise-dealer-mcp/${version}`,
  allowCustomHost: process.env.WHEEWISE_ALLOW_CUSTOM_URL === "1",
});

await createServer(client, version).connect(new StdioServerTransport());
console.error(`Wheewise dealer MCP ${version} ready.`);
