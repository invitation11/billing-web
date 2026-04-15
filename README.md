# 🧾 ShopBill Pro — Full-Stack Billing System

## 📁 Project Structure

```
shop-billing/
├── frontend/
│   └── index.html         ← Complete frontend (single file, no build needed)
├── backend/
│   ├── server.js          ← Express API server
│   ├── package.json       ← Node dependencies
│   └── bills.json         ← Auto-created JSON database
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm start
# Server runs at http://localhost:3001
```

For development with auto-reload:
```bash
npm run dev
```

### 2. Frontend Setup

Just open `frontend/index.html` in any browser — no build step needed!

Or serve it:
```bash
# Using Python
cd frontend && python -m http.server 8080

# Using Node
npx serve frontend
```

---

## ⚙️ Configuration (In-App Settings)

Click the **⚙️ Settings** button in the top-right corner to configure:

| Setting | Description |
|---------|-------------|
| Shop Name | Your shop/business name |
| Shop Address | Address shown on bills |
| Shop Phone | Contact number |
| GSTIN | GST registration number |
| Backend URL | API server URL (default: `http://localhost:3001`) |
| Telegram Bot Token | From [@BotFather](https://t.me/BotFather) |
| Telegram Chat ID | Your chat/group ID |

---

## 🤖 Telegram Bot Setup

1. Open Telegram, search for **@BotFather**
2. Send `/newbot` and follow instructions
3. Copy the **Bot Token** (looks like `123456789:ABC-...`)
4. To get your Chat ID:
   - Start a chat with your bot
   - Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   - Find the `"id"` field in the response
5. Paste both values in ⚙️ Settings

---

## 📦 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-bill` | Create new bill + send Telegram |
| GET | `/bills` | Fetch all bills (supports `?search=` and `?date=`) |
| GET | `/bill/:id` | Fetch single bill |
| GET | `/dashboard` | Dashboard stats + 7-day chart data |

### POST `/create-bill` Request Body
```json
{
  "customerName": "John Doe",
  "customerMobile": "9876543210",
  "products": [
    { "name": "Product A", "price": 100, "qty": 2 }
  ],
  "gstEnabled": true,
  "gstRate": 18,
  "subtotal": 200,
  "gstAmount": 36,
  "total": 236,
  "telegramToken": "YOUR_BOT_TOKEN",
  "telegramChatId": "YOUR_CHAT_ID"
}
```

---

## 🌐 Deployment

### Deploy Backend to Railway / Render

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

**Render:**
1. Push to GitHub
2. New Web Service → connect repo
3. Build: `npm install`, Start: `node server.js`

### Deploy Frontend to Netlify / Vercel

```bash
# Drag & drop the frontend/ folder to netlify.com/drop
# OR
npx netlify-cli deploy --dir=frontend
```

After deploying, update the **Backend URL** in ⚙️ Settings.

---

## 🖨️ Printing

- Click **🖨️ Print** after generating a bill
- Uses `window.print()` with receipt-formatted CSS (80mm width)
- Works with thermal POS printers set to 80mm paper

---

## 📱 Features Summary

- ✅ Add unlimited products per bill
- ✅ Auto-calculated totals
- ✅ Optional GST (5%, 12%, 18%, 28%)
- ✅ Auto invoice numbering (INV-YEAR-XXXXX)
- ✅ Live bill preview
- ✅ Print receipt (thermal-compatible)
- ✅ Download PDF (A5 size)
- ✅ Telegram auto-notification
- ✅ Dashboard with 7-day chart
- ✅ Search previous bills
- ✅ Offline mode (saves locally)
- ✅ Mobile responsive
- ✅ Zero external frontend dependencies (except jsPDF CDN)

---

## 💡 Offline Mode

If the backend is unreachable, the app **automatically switches to offline mode**:
- Bills are saved in `localStorage`
- Invoice numbers are generated locally
- Telegram messages are sent directly from the browser
- Dashboard reads from local cache

---

## 🔒 Security Notes

- Never expose your Telegram Bot Token in public repos
- For production, use environment variables:
  ```bash
  TELEGRAM_TOKEN=your_token node server.js
  ```
- Consider adding auth middleware for production deployments
