/* ─────────────────────────────────────────────────────────────
   /api/write  —  real AI message writing (Groq — free & fast)
   Active once you set GROQ_API_KEY in your env (.env locally,
   or Vercel env vars in production).
   If the key is missing or the call fails, this returns an error
   and the website falls back to its built-in templates — so the
   "Write it for me" button always works either way.

   Get a free key at: console.groq.com/keys
   ───────────────────────────────────────────────────────────── */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const key = process.env.GROQ_API_KEY;
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

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type':  'application/json',
        'authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        // If this model is ever retired, swap it for another from console.groq.com/docs/models
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        temperature: 0.9,
        messages: [
          { role: 'system', content: 'You write short, heartfelt Father\'s Day messages. Output only the message text, nothing else.' },
          { role: 'user',   content: prompt }
        ]
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ ok: false, error: 'AI upstream error', detail: t.slice(0, 200) });
    }
    const data = await r.json();
    const text = ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
    if (!text) return res.status(502).json({ ok: false, error: 'empty response' });
    return res.status(200).json({ ok: true, message: text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
