import 'dotenv/config';
import express from 'express';
import { getTime, getWeather } from './tools.js';
import { createMcpRequestHandler } from './mcp.js';
import { buildOpenApiDoc } from './openapi.js';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 5000;
const TOOL_API_KEY = (process.env.TOOL_API_KEY || '').trim();

function requireApiKey(req, res, next) {
  if (!TOOL_API_KEY) return next();
  const provided = req.headers['x-api-key'];
  if (provided !== TOOL_API_KEY) {
    return res.status(401).json({ detail: 'invalid api key' });
  }
  next();
}

// ----- meta ------------------------------------------------------------------

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/', (_req, res) =>
  res.json({
    name: 'Embr Foundry Tool Sample',
    surfaces: { openapi: '/openapi.json', mcp: '/mcp' },
  }),
);

app.get('/openapi.json', (req, res) => {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http')
    .toString().split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  res.json(buildOpenApiDoc(host ? `${proto}://${host}` : ''));
});

// ----- OpenAPI / skill surface -----------------------------------------------

app.get('/api/weather', requireApiKey, (req, res) => {
  const location = String(req.query.location ?? '').trim();
  if (!location) return res.status(400).json({ detail: 'location is required' });
  res.json(getWeather(location));
});

app.get('/api/time', requireApiKey, (req, res) => {
  const timezone = (req.query.timezone ? String(req.query.timezone) : 'UTC').trim() || 'UTC';
  try {
    res.json(getTime(timezone));
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
});

// ----- MCP surface -----------------------------------------------------------

const mcpHandler = createMcpRequestHandler();
app.post('/mcp', mcpHandler);
app.post('/mcp/', mcpHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Embr Foundry Tool Sample listening on :${PORT}`);
});
