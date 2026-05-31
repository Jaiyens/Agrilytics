import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import { extractRecord, MODEL } from './gemini.js';
import { validateRecord } from './reference.js';
import { BLOCKS, PRODUCTS } from './reference.js';
import { listRecords, addRecord } from './store.js';
import { FARMS, networkStats } from './farms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '25mb' })); // audio can be a few MB as base64

// --- API ---------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: MODEL, hasKey: Boolean(process.env.GEMINI_API_KEY) });
});

app.get('/api/reference', (_req, res) => {
  res.json({ blocks: BLOCKS, products: PRODUCTS });
});

app.get('/api/farms', (_req, res) => {
  res.json({ farms: FARMS, stats: networkStats() });
});

app.get('/api/records', (_req, res) => {
  res.json({ records: listRecords() });
});

// Turn a voice note (or sample text) into a validated, reviewable record.
app.post('/api/extract', async (req, res) => {
  try {
    const { audioBase64, mimeType, text } = req.body || {};
    const raw = await extractRecord({ audioBase64, mimeType, text });
    const validated = validateRecord(raw);
    res.json({ record: validated });
  } catch (err) {
    console.error('extract error:', err);
    res.status(500).json({ error: err.message || 'Extraction failed.' });
  }
});

// Save an approved record.
app.post('/api/records', (req, res) => {
  try {
    const rec = req.body || {};
    if (!rec.block || !rec.product) {
      return res.status(400).json({ error: 'A record needs at least a block and a product before logging.' });
    }
    const saved = addRecord(rec);
    res.json({ record: saved });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not save record.' });
  }
});

// --- Static client (production) ---------------------------------------

const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Agrilytics running on http://localhost:${PORT}  (model: ${MODEL})`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠  GEMINI_API_KEY not set — /api/extract will error until you add it.');
  }
});
