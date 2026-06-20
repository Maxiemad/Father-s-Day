/* ─────────────────────────────────────────────────────────────
   /api/create-order  —  creates a Razorpay order (server-side)
   Active once you set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in
   your env (Vercel env vars / local .env).
   Returns { ok, orderId, amount, currency, keyId } so the page
   can open Razorpay Checkout. If keys aren't set, returns 503 and
   the site falls back to the simple UPI flow.
   ───────────────────────────────────────────────────────────── */

const KEY_ID     = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  if (!KEY_ID || !KEY_SECRET) return res.status(503).json({ ok: false, error: 'gateway not configured' });

  try {
    const b     = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const rupees = Math.max(1, Math.round(Number(b.amount) || 0));
    const auth  = 'Basic ' + Buffer.from(KEY_ID + ':' + KEY_SECRET).toString('base64');

    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method:  'POST',
      headers: { 'content-type': 'application/json', authorization: auth },
      body: JSON.stringify({ amount: rupees * 100, currency: 'INR', receipt: 'fds_' + Date.now() })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ ok: false, error: 'order failed', detail: t.slice(0, 200) });
    }
    const o = await r.json();
    return res.status(200).json({
      ok: true, orderId: o.id, amount: o.amount, currency: o.currency, keyId: KEY_ID
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
