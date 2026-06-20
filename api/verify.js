/* ─────────────────────────────────────────────────────────────
   /api/verify  —  verifies a Razorpay payment signature (server-side)
   The page calls this after checkout succeeds. Only if the signature
   is valid does the website unlock the shareable link. This is what
   makes payment actually REQUIRED (can't be faked client-side).
   ───────────────────────────────────────────────────────────── */

const crypto     = require('crypto');
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  if (!KEY_SECRET) return res.status(503).json({ ok: false, error: 'gateway not configured' });

  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = b;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ ok: false, error: 'missing fields' });
    }
    const expected = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const a = Buffer.from(expected);
    const b2 = Buffer.from(String(razorpay_signature));
    const ok = a.length === b2.length && crypto.timingSafeEqual(a, b2);
    return res.status(ok ? 200 : 400).json({ ok });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
