/* ─────────────────────────────────────────────────────────────
   /api/letter?id=...  —  fetch a saved letter (for short links)
   Returns { ok, letter } so view.html can render a shared letter
   from a short URL (?id=...) instead of a giant ?d=... blob.
   ───────────────────────────────────────────────────────────── */

const { MongoClient, ObjectId } = require('mongodb');

const uri        = process.env.MONGODB_URI;
const DB_NAME    = process.env.MONGODB_DB || 'fathersday';
const COLLECTION = 'orders';

let cached = global._mongo || (global._mongo = { promise: null });

async function getDb() {
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (!cached.promise) cached.promise = new MongoClient(uri, { maxPoolSize: 5 }).connect();
  const client = await cached.promise;
  return client.db(DB_NAME);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });

  try {
    const id = (req.query && req.query.id) ||
               new URL(req.url, 'http://x').searchParams.get('id');
    if (!id) return res.status(400).json({ ok: false, error: 'missing id' });

    let _id;
    try { _id = new ObjectId(String(id)); }
    catch (e) { return res.status(404).json({ ok: false, error: 'not found' }); }

    const db  = await getDb();
    const row = await db.collection(COLLECTION).findOne({ _id });
    if (!row) return res.status(404).json({ ok: false, error: 'not found' });

    return res.status(200).json({
      ok: true,
      letter: {
        relation:    row.relation,
        senderName:  row.senderName,
        mainMessage: row.mainMessage,
        promise:     row.promise || '',
        papaYears:   row.papaYears || 0,
        msgs:        Array.isArray(row.msgs) && row.msgs.length ? row.msgs : undefined
      }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
