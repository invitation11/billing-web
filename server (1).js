const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DB_FILE = path.join(__dirname, "bills.json");

// Initialize DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ bills: [], counter: 1000 }));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function generateInvoiceNumber(counter) {
  return `INV-${new Date().getFullYear()}-${String(counter).padStart(5, "0")}`;
}

async function sendTelegramMessage(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" });
    const options = {
      hostname: "api.telegram.org",
      path: `/bot${token}/sendMessage`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function formatTelegramMessage(bill) {
  const lines = [
    `🧾 <b>NEW BILL GENERATED</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 Invoice: <b>${bill.invoiceNumber}</b>`,
    `👤 Customer: <b>${bill.customerName}</b>`,
    `📱 Mobile: ${bill.customerMobile}`,
    `📅 Date: ${new Date(bill.createdAt).toLocaleString("en-IN")}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🛒 <b>ITEMS:</b>`,
    ...bill.products.map(
      (p, i) =>
        `${i + 1}. ${p.name}\n   ${p.qty} × ₹${p.price} = <b>₹${(p.qty * p.price).toFixed(2)}</b>`
    ),
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 Subtotal: ₹${bill.subtotal.toFixed(2)}`,
    bill.gstEnabled ? `📊 GST (${bill.gstRate}%): ₹${bill.gstAmount.toFixed(2)}` : "",
    `✅ <b>TOTAL: ₹${bill.total.toFixed(2)}</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
  ]
    .filter(Boolean)
    .join("\n");
  return lines;
}

// POST /create-bill
app.post("/create-bill", async (req, res) => {
  try {
    const db = readDB();
    db.counter++;
    const invoiceNumber = generateInvoiceNumber(db.counter);

    const { customerName, customerMobile, products, gstEnabled, gstRate, subtotal, gstAmount, total, telegramToken, telegramChatId } = req.body;

    const bill = {
      id: db.counter,
      invoiceNumber,
      customerName,
      customerMobile,
      products,
      gstEnabled: !!gstEnabled,
      gstRate: gstRate || 0,
      subtotal,
      gstAmount: gstAmount || 0,
      total,
      createdAt: new Date().toISOString(),
    };

    db.bills.push(bill);
    writeDB(db);

    // Send Telegram
    let telegramStatus = "skipped";
    if (telegramToken && telegramChatId) {
      try {
        const msg = formatTelegramMessage(bill);
        await sendTelegramMessage(telegramToken, telegramChatId, msg);
        telegramStatus = "sent";
      } catch (e) {
        telegramStatus = "failed: " + e.message;
      }
    }

    res.json({ success: true, bill, telegramStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /bills - all bills
app.get("/bills", (req, res) => {
  const db = readDB();
  const { search, date } = req.query;
  let bills = [...db.bills].reverse();

  if (search) {
    const q = search.toLowerCase();
    bills = bills.filter(
      (b) =>
        b.customerName.toLowerCase().includes(q) ||
        b.customerMobile.includes(q) ||
        b.invoiceNumber.toLowerCase().includes(q)
    );
  }
  if (date) {
    bills = bills.filter((b) => b.createdAt.startsWith(date));
  }
  res.json({ success: true, bills });
});

// GET /dashboard
app.get("/dashboard", (req, res) => {
  const db = readDB();
  const today = new Date().toISOString().split("T")[0];
  const todayBills = db.bills.filter((b) => b.createdAt.startsWith(today));
  const totalSalesToday = todayBills.reduce((sum, b) => sum + b.total, 0);
  const totalBillsToday = todayBills.length;
  const allTimeSales = db.bills.reduce((sum, b) => sum + b.total, 0);
  const totalBills = db.bills.length;

  // Last 7 days chart data
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const dayBills = db.bills.filter((b) => b.createdAt.startsWith(ds));
    last7.push({ date: ds, total: dayBills.reduce((s, b) => s + b.total, 0), count: dayBills.length });
  }

  res.json({ success: true, totalSalesToday, totalBillsToday, allTimeSales, totalBills, last7 });
});

// GET /bill/:id
app.get("/bill/:id", (req, res) => {
  const db = readDB();
  const bill = db.bills.find((b) => b.id == req.params.id || b.invoiceNumber === req.params.id);
  if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
  res.json({ success: true, bill });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
