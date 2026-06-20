# Collecting orders in MongoDB — setup (≈10 min)

The website is a static site. To save data when someone completes the "pay"
step, it calls `/api/collect`, a tiny serverless function that writes to
**MongoDB Atlas**. Until you deploy it, the call simply does nothing (the page
still works perfectly — the data save is fire-and-forget).

## 1. MongoDB Atlas (free)
1. Sign up at mongodb.com/atlas → create a **free M0 cluster**.
2. **Database Access** → add a user (username + password).
3. **Network Access** → Allow access from anywhere (`0.0.0.0/0`).
4. **Connect → Drivers** → copy the connection string. It looks like:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## 2. Deploy to Vercel (free)
1. Go to vercel.com → **Add New → Project** → import the GitHub repo
   `Maxiemad/Father-s-Day`.
2. Framework preset: **Other** (it's a static site + `api/`). Click Deploy.
3. After it deploys: **Settings → Environment Variables** → add:
   - `MONGODB_URI` = the string from step 1
   - `MONGODB_DB`  = `fathersday` (optional)
4. **Redeploy** so the variable takes effect.

That's it. Your live site is now `https://<your-project>.vercel.app`.

## 3. Where the data lands
Every completed link creates one document in the **`orders`** collection:

```json
{
  "relation": "Papa",
  "senderName": "Akanksha",
  "mainMessage": "Happy Father's Day Papa...",
  "promise": "More Sunday calls",
  "papaYears": 30,
  "amount": 20,
  "coupon": "",
  "paid": true,
  "paymentRef": "upi_xyz",
  "userAgent": "...",
  "createdAt": "2026-06-21T..."
}
```

View them in Atlas → **Browse Collections → fathersday → orders**.

## Optional: real AI for "Write it for me"
The message writer uses built-in templates by default. To make it **real AI**
(writes a fresh message every time): add a `GROQ_API_KEY` env var (get a free key
at console.groq.com/keys). The `/api/write` function then calls Groq; if the key
is missing or the call fails, the site automatically falls back to the templates,
so the button always works.

## Required payment with Razorpay (verified)
By default (no Razorpay keys) the site uses a simple UPI flow that **can't
verify** payment — the link is handed over on trust. To make payment actually
**required** (link unlocks only after a confirmed ₹20):

1. Sign up at **dashboard.razorpay.com** (free).
2. **Settings → API Keys → Generate** → copy the **Key ID** and **Key Secret**.
   (Use **Test Mode** keys first to try it without real money. Live keys need KYC.)
3. Add both as env vars (Vercel → Settings → Environment Variables, or local `.env`):
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
4. Redeploy.

Now clicking **Pay** opens Razorpay Checkout (UPI + cards). `/api/create-order`
makes the order, `/api/verify` checks the signature server-side, and the link
appears **only** if the payment is genuinely confirmed. Cancelling = no link.

💰 **Where the money goes:** Razorpay settles payments to the **bank account**
you link in your Razorpay dashboard (not directly to a personal `@ybl` VPA).
The payer can still pay by UPI — that's just the rail.
