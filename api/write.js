/* ─────────────────────────────────────────────────────────────
   /api/write  —  real AI message writing (Anthropic / Claude)
   Active once you set ANTHROPIC_API_KEY in Vercel env vars.
   If the key is missing or the call fails, this returns an error
   and the website falls back to its built-in templates — so the
   "Write it for me" button always works either way.
   ───────────────────────────────────────────────────────────── */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'AI not configured' });

  try {
    const b        = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const relation = String(b.relation || 'Papa').slice(0, 40);
    const tone     = String(b.tone || 'warm').slice(0, 20);
    const name     = String(b.senderName || '').slice(0, 60);
    const years    = Number(b.papaYears) || 0;

    const toneGuide = {
      warm:   'warm, sincere and heartfelt — real, not cheesy',
      funny:  'playful and funny, affectionate teasing, light dad-joke energy',
      hype:   'high-energy and hyped, celebratory, big proud-of-him energy',
      poetic: 'gentle and poetic, tender, quietly emotional'
    }[tone] || 'warm and sincere';

    const prompt =
`Write a short Father's Day message (45-75 words), from a child to their father.
Tone: ${toneGuide}.
They call him "${relation}".${name ? ` It is from ${name}.` : ''}${years ? ` He has been a dad for about ${years} years.` : ''}
Write ONLY the message text — no preamble, no surrounding quotes, no sign-off line. Sound like a real person, specific and from the heart. You may end with one tasteful emoji.`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ ok: false, error: 'AI upstream error', detail: t.slice(0, 200) });
    }
    const data = await r.json();
    const text = ((data.content && data.content[0] && data.content[0].text) || '').trim();
    if (!text) return res.status(502).json({ ok: false, error: 'empty response' });
    return res.status(200).json({ ok: true, message: text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
