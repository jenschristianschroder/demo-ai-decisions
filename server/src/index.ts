/**
 * Express server that serves:
 * 1. /api/* — AI endpoints backed by Azure AI Foundry via Managed Identity
 * 2. /*    — Static SPA files (Vite build output)
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiRouter } from './routes/ai.js';
import { DEFAULT_DEPLOYMENT } from './aiClient.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Body parsing
app.use(express.json());

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  limit: 30,        // 30 requests per minute per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api/ai', apiLimiter, aiRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Static SPA ──────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../../public');

app.use(express.static(staticDir));

// SPA fallback — serve index.html for any route not matched above
const spaLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

app.get('/{*splat}', spaLimiter, (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`  AZURE_AI_ENDPOINT: ${process.env.AZURE_AI_ENDPOINT ? '✓ configured' : '✗ not set'}`);
  console.log(`  AZURE_AI_DEPLOYMENT: ${process.env.AZURE_AI_DEPLOYMENT || DEFAULT_DEPLOYMENT + ' (default)'}`);
});
