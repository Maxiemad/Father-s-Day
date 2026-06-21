/* ─────────────────────────────────────────────────────────────
   Local dev server — runs the FULL site (static pages + /api,
   so MongoDB + AI actually work) on your own machine.

   Usage:
     1) Fill in .env  (MONGODB_URI = your full Atlas string with the
        real password; optional ANTHROPIC_API_KEY for real AI)
     2) npm install
     3) npm run dev    →  open http://localhost:3000

   The SAME api/ files run on Vercel in production — this is just
   for running and testing locally.
   ───────────────────────────────────────────────────────────── */

require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json({ limit: '1mb' }));

// API routes (the exact handler files Vercel uses)
app.all('/api/collect',      require('./api/collect'));
app.all('/api/letter',       require('./api/letter'));
app.all('/api/write',        require('./api/write'));
app.all('/api/create-order', require('./api/create-order'));
app.all('/api/verify',       require('./api/verify'));

// Everything else = the static site (index.html, view.html, assets, ...)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  💌  Father's Day Special  →  http://localhost:${PORT}`);
  console.log(`  MongoDB: ${process.env.MONGODB_URI ? 'configured ✓' : 'NOT set — add MONGODB_URI to .env'}`);
  console.log(`  AI:      ${process.env.GROQ_API_KEY ? 'configured ✓' : 'off (templates) — add GROQ_API_KEY to enable'}\n`);
});
