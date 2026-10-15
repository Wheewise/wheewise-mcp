import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { GatewayClient } from "../dist/client.js";
import { createServer } from "../dist/server.js";

const TOKEN = "wwd_" + "a".repeat(43);

// A stand-in for the Wheewise gateway: just enough to check what this package sends and how it reports what comes back.
function gateway() {
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: body ? JSON.parse(body) : null });
      res.setHeader("Content-Type", "application/json");
      if (req.headers.authorization !== `Bearer ${TOKEN}`) return res.writeHead(401).end(JSON.stringify({ error: "Invalid or revoked token." }));
      if (req.url === "/api/mcp/v1/tools") {
        return res.end(
          JSON.stringify({
            shop: "Zaki",
            scopes: ["read"],
            tools: [
              { name: "list_vehicles", description: "Vehicles.", scope: "read", inputSchema: { type: "object", properties: { limit: { type: "integer" } } } },
              { name: "mark_vehicle_sold", description: "Sell.", scope: "write", inputSchema: { type: "object", properties: {} } },
            ],
          }),
        );
      }
      const { name } = JSON.parse(body);
      if (name === "list_vehicles") return res.end(JSON.stringify({ ok: true, result: { total: 1, vehicles: [{ title: "2020 Honda Activa" }] } }));
      res.writeHead(422).end(JSON.stringify({ ok: false, error: "Vehicle not found in your shop." }));
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, seen, url: `http://127.0.0.1:${server.address().port}` })));
}

async function connect(url, token = TOKEN) {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(new GatewayClient({ token, baseUrl: url }), "0.0.0").connect(b);
  const client = new Client({ name: "test", version: "0" });
  await client.connect(a);
  return client;
}

test("lists the tools the gateway offers, with read/write hints, and sends the token", async () => {
  const gw = await gateway();
  const client = await connect(gw.url);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name), ["list_vehicles", "mark_vehicle_sold"]);
  assert.equal(tools[0].annotations.readOnlyHint, true);
  assert.equal(tools[1].annotations.destructiveHint, true);
  assert.match(tools[0].description, /Shop: Zaki/);
  assert.equal(gw.seen[0].auth, `Bearer ${TOKEN}`);
  gw.server.close();
});

test("a tool call returns the gateway's result as text", async () => {
  const gw = await gateway();
  const client = await connect(gw.url);
  const r = await client.callTool({ name: "list_vehicles", arguments: { limit: 5 } });
  assert.notEqual(r.isError, true);
  assert.match(r.content[0].text, /2020 Honda Activa/);
  assert.deepEqual(gw.seen.at(-1).body, { name: "list_vehicles", arguments: { limit: 5 } });
  gw.server.close();
});

test("a refusal comes back as a readable tool error, not a crash", async () => {
  const gw = await gateway();
  const client = await connect(gw.url);
  const r = await client.callTool({ name: "mark_vehicle_sold", arguments: {} });
  assert.equal(r.isError, true);
  assert.equal(r.content[0].text, "Vehicle not found in your shop.");
  gw.server.close();
});

test("a bad token says how to get a new one", async () => {
  const gw = await gateway();
  const client = await connect(gw.url, "wwd_" + "b".repeat(43));
  const r = await client.callTool({ name: "list_vehicles", arguments: {} });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /Settings → AI assistant access/);
  gw.server.close();
});

test("the token is never sent over plain http to a remote host", () => {
  assert.throws(() => new GatewayClient({ token: TOKEN, baseUrl: "http://example.com" }), /https/);
  assert.doesNotThrow(() => new GatewayClient({ token: TOKEN, baseUrl: "http://localhost:3001" }));
});

test("prompts are listed and filled in", async () => {
  const gw = await gateway();
  const client = await connect(gw.url);
  const { prompts } = await client.listPrompts();
  assert.ok(prompts.some((p) => p.name === "build_my_website"));
  assert.ok(prompts.some((p) => p.name === "build_private_website"));
  const site = await client.getPrompt({ name: "build_private_website", arguments: { domain: "https://myshop.com", framework: "Astro" } });
  assert.match(site.messages[0].content.text, /get_site_api/);
  assert.match(site.messages[0].content.text, /https:\/\/myshop\.com/);
  assert.match(site.messages[0].content.text, /Astro/);
  const p = await client.getPrompt({ name: "build_my_website", arguments: { style: "premium" } });
  assert.match(p.messages[0].content.text, /premium/);
  gw.server.close();
});
