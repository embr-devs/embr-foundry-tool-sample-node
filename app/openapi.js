/**
 * Hand-rolled OpenAPI 3.1 spec for the /api/* routes. We don't use a generator
 * (too heavy for a single-file demo) — Foundry just needs a valid spec it can
 * import with at least one auth scheme declared.
 */
export function buildOpenApiDoc(serverUrl) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Embr Foundry Tool Sample',
      description:
        'Demo tools exposed over both an OpenAPI skill surface (/api/*) and ' +
        'an MCP streamable-HTTP server (/mcp). Built for the Embr × Foundry POC.',
      version: '0.1.0',
    },
    servers: serverUrl ? [{ url: serverUrl }] : [],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
      },
      schemas: {
        WeatherResponse: {
          type: 'object',
          required: ['location', 'condition', 'temperature_c'],
          properties: {
            location: { type: 'string' },
            condition: { type: 'string' },
            temperature_c: { type: 'number' },
          },
        },
        TimeResponse: {
          type: 'object',
          required: ['timezone', 'iso', 'pretty'],
          properties: {
            timezone: { type: 'string' },
            iso: { type: 'string' },
            pretty: { type: 'string' },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      '/api/weather': {
        get: {
          tags: ['tools'],
          operationId: 'getWeather',
          summary: 'Get the current weather for a city',
          parameters: [
            {
              name: 'location', in: 'query', required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/WeatherResponse' } },
              },
            },
          },
        },
      },
      '/api/time': {
        get: {
          tags: ['tools'],
          operationId: 'getTime',
          summary: 'Get the current time in an IANA timezone',
          parameters: [
            {
              name: 'timezone', in: 'query', required: false,
              schema: { type: 'string', default: 'UTC' },
            },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/TimeResponse' } },
              },
            },
            400: { description: 'Unknown timezone' },
          },
        },
      },
    },
  };
}
