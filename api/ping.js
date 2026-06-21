/* Tiny health-check function to verify /api/* deploys on Vercel. */
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ ok: true, pong: true, build: 'fnfix2' });
};
