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

## ⚠️ Important: `paid` is trust-based
UPI on a plain website can't be auto-verified, so `paid:true` only means the
person reached the success step — **not** that money actually arrived. To
*truly* gate the link behind a confirmed payment, you need a payment gateway
(Razorpay/Cashfree/PhonePe PG) with a webhook that verifies the payment
server-side before issuing the link. Ask and I'll wire that next.
