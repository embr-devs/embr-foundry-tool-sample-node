/**
 * MCP server surface — exposes the same tools as the OpenAPI routes via
 * MCP streamable-HTTP.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { getTime, getWeather } from './tools.js';

export function buildMcpServer() {
  const server = new McpServer(
    { name: 'Embr Tool Sample', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    'get_weather',
    {
      description: 'Get the current weather for a city.',
      inputSchema: { location: z.string().describe("City name, e.g. 'Seattle'.") },
    },
    async ({ location }) => {
      const result = getWeather(location);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  );

  server.registerTool(
    'get_time',
    {
      description: "Get the current time in an IANA timezone (e.g. 'America/New_York').",
      inputSchema: {
        timezone: z.string().default('UTC')
          .describe("IANA timezone name, e.g. 'UTC' or 'America/New_York'."),
      },
    },
    async ({ timezone }) => {
      try {
        const result = getTime(timezone ?? 'UTC');
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: err.message }] };
      }
    },
  );

  return server;
}

export function createMcpRequestHandler() {
  return async (req, res) => {
    // Stateless: new server + transport per request, like the Python sample's
    // streamable_http_path config and the .NET sample's stateless option.
    const server = buildMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };
}
