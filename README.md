# embr-foundry-tool-sample-node

A minimal **Node.js / Express** tool server that exposes the same two tools
through **two Foundry-consumable surfaces**:

- **OpenAPI (custom skill)** at `/api/*` + spec at `/openapi.json`.
- **MCP (Model Context Protocol)** streamable-HTTP at `/mcp`.

Same code path, two doors. Lets you compare the two integration paths from a
single deployment.

This is the Node sibling of [`embr-foundry-tool-sample-python`](https://github.com/embr-devs/embr-foundry-tool-sample-python)
and [`embr-foundry-tool-sample-dotnet`](https://github.com/embr-devs/embr-foundry-tool-sample-dotnet).

## What's in the box

- ESM Node app on Node 20+ / Express 5.
- Two tools: `getWeather` and `getTime` — pure functions in `tools.js`.
- Hand-written OpenAPI 3.1 doc with an `x-api-key` security scheme declared
  (Foundry's custom-OpenAPI tool import rejects anonymous specs).
- MCP server via the official `@modelcontextprotocol/sdk` package, mounted at
  `/mcp` with a stateless StreamableHTTP transport (new transport per request,
  no session management).

## Layout

```
app/
  server.js     # Express endpoint mapping + auth gate
  tools.js     # core tool implementations
  mcp.js       # McpServer + StreamableHTTPServerTransport wiring
  openapi.js   # hand-written OpenAPI 3.1 document
embr.yaml      # Embr deploy config (platform: nodejs)
.env.example   # optional TOOL_API_KEY for runtime auth
```

## Surfaces

| Path | Purpose |
|---|---|
| `/health` | Liveness probe |
| `/` | Index — points at the two surfaces |
| `/api/weather?location=...` | OpenAPI tool (returns `WeatherResponse`) |
| `/api/time?timezone=...` | OpenAPI tool (returns `TimeResponse`) |
| `/openapi.json` | OpenAPI 3.1 spec — feed this to Foundry's "custom OpenAPI tool" |
| `/mcp` | MCP streamable-HTTP — register as a remote MCP tool in Foundry |

## Auth

The OpenAPI spec declares an `x-api-key` header security scheme (Foundry
requires at least one auth scheme on imported tools). At runtime:

- If `TOOL_API_KEY` is **unset**, requests are accepted without a header.
  This is the easy mode for the Foundry import flow and local development.
- If `TOOL_API_KEY` is **set**, `/api/*` requests must include
  `x-api-key: <value>` or get a `401`.

The MCP surface does **not** enforce the header — Foundry's MCP connection
configuration is the auth boundary there.

## Run locally

```bash
npm install
npm start
```

Then:

```bash
curl http://localhost:5000/health
curl 'http://localhost:5000/api/weather?location=Seattle'
curl 'http://localhost:5000/api/time?timezone=America/New_York'
curl http://localhost:5000/openapi.json | jq .
```

For the MCP surface, post a JSON-RPC `initialize`:

```bash
curl -s -X POST http://localhost:5000/mcp \
  -H 'Accept: application/json,text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'
```

## Deploy to Embr

```bash
gh repo create embr-foundry-tool-sample-node --source=. --public --push
embr quickstart deploy <your-user>/embr-foundry-tool-sample-node
# optional:
embr variables set TOOL_API_KEY <secret> -p <projectId> -e <envId> -s
```

Once deployed, the URLs Foundry needs are:

- **OpenAPI**: `https://<your-deploy>/openapi.json`
- **MCP**: `https://<your-deploy>/mcp`

## Notes

- Tool implementations are pure (no external deps), so behavior is fully
  identical between the OpenAPI route and the MCP tool call.
- Stateless MCP: each POST gets a fresh `McpServer` + transport. Keeps the
  surface trivial to reason about behind Embr's ingress.
