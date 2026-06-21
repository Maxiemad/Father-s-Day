/* ─────────────────────────────────────────────────────────────
   /api/collect  —  serverless function (works on Vercel)
   Saves one record to MongoDB every time someone generates a
   shareable link (i.e. completes the "pay" step).

   SETUP (see SETUP.md):
     1. Make a free MongoDB Atlas cluster.
     2. Deploy this repo to Vercel.
     3. In Vercel → Settings → Environment Variables, add:
          MONGODB_URI = your Atlas connection string
          MONGODB_DB  = fathersday          (optional)
   The connection string is read from the environment — it is
   NEVER stored in this file or committed to the repo.
   ───────────────────────────────────────────────────────────── */

const { MongoClient } = require('mongodb');

const uri        = process.env.MONGODB_URI;
const DB_NAME    = process.env.MONGODB_DB || 'fathersday';
const COLLECTION = 'orders';

// Reuse the connection across warm serverless invocations.
let cached = global._mongo || (global._mongo = { promise: null });

async function getDb() {
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (!cached.promise) {
    cached.promise = new MongoClient(uri, { maxPoolSize: 5 }).connect();
  }
  const client = await cached.promise;
  return client.db(DB_NAME);
}

module.exports = async (req, res) => {
  // Allow the page to call this even if hosted on another domain.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    const doc = {
      relation:    String(b.relation    || '').slice(0, 60),
      senderName:  String(b.senderName   || '').slice(0, 120),
      mainMessage: String(b.mainMessage  || '').slice(0, 2000),
      promise:     String(b.promise      || '').slice(0, 200),
      papaYears:   Number(b.papaYears) || 0,
      msgs:        Array.isArray(b.msgs) ? b.msgs.slice(0, 8).map(m => String(m).slice(0, 200)) : [],
      userAgent:   String(req.headers['user-agent'] || '').slice(0, 300),
      createdAt:   new Date()
    };

    const db = await getDb();
    const r  = await db.collection(COLLECTION).insertOne(doc);
    return res.status(200).json({ ok: true, id: r.insertedId });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
