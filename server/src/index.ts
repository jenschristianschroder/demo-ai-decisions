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
import { financeAiRouter } from './routes/financeAi.js';
import { rndAiRouter } from './routes/rndAi.js';
import { rndAgentsRouter } from './routes/rndAgents.js';
import { rfpAgentsRouter } from './routes/rfpAgents.js';
import { contractAgentsRouter } from './routes/contractAgents.js';
import { ndaAgentsRouter } from './routes/ndaAgents.js';
import { onboardingAgentsRouter } from './routes/onboardingAgents.js';
import { musicAgentsRouter } from './routes/musicAgents.js';
import { backfillStatusRouter } from './routes/backfillStatus.js';
import { DEFAULT_DEPLOYMENT } from './aiClient.js';
import { isPgAvailable, closePool } from './db/pgClient.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Body parsing (increased limit for large RFP payloads)
app.use(express.json({ limit: '10mb' }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  limit: 30,        // 30 requests per minute per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api/ai', apiLimiter, aiRouter);
app.use('/api/ai/finance', apiLimiter, financeAiRouter);
app.use('/api/ai/rnd', apiLimiter, rndAiRouter);
app.use('/api/ai/rnd', apiLimiter, rndAgentsRouter);
app.use('/api/ai', apiLimiter, rfpAgentsRouter);
app.use('/api/ai', apiLimiter, contractAgentsRouter);
app.use('/api/ai', apiLimiter, ndaAgentsRouter);
app.use('/api/ai', apiLimiter, onboardingAgentsRouter);
app.use('/api/ai', apiLimiter, musicAgentsRouter);
app.use('/api', apiLimiter, backfillStatusRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Static SPA ──────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../public');

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
  console.log(`  PostgreSQL: ${isPgAvailable() ? '✓ configured (' + process.env.PGHOST + ')' : '✗ not set (AI-only mode)'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down');
  await closePool();
  process.exit(0);
});
