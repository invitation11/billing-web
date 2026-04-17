require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const cors = require("cors");
const FormData = require("form-data");

// 🔥 FIREBASE
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 ENV
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// 📄 PDF
function createPDF(bill){
  const file = `bill-${Date.now()}.pdf`;
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(file));

  doc.text("Invoice");
  doc.text(`Customer: ${bill.customerName}`);
  doc.text(`Mobile: ${bill.customerMobile}`);
  doc.text("----------------");

  bill.products.forEach(p=>{
    doc.text(`${p.name} x${p.qty} = ₹${p.price}`);
  });

  doc.text("----------------");
  doc.text(`Total: ₹${bill.total}`);
  doc.end();

  return file;
}

// 🤖 TELEGRAM
async function sendTelegram(file){
  const form = new FormData();
  form.append("chat_id", CHAT_ID);
  form.append("document", fs.createReadStream(file));

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, {
    method: "POST",
    body: form
  });
}

// 🚀 MAIN API
app.post("/create-bill", async (req,res)=>{
  try{
    const bill = req.body;

    let total = 0;
    bill.products.forEach(p=>{
      total += Number(p.price) * Number(p.qty);
    });
    bill.total = total;

    // 🔥 SAVE FIREBASE
    await db.ref("bills").push(bill);

    // PDF
    const pdf = createPDF(bill);

    // Telegram
    await sendTelegram(pdf);

    res.json({ success:true });

  }catch(err){
    console.log(err);
    res.json({ success:false });
  }
});

// 📊 DASHBOARD
app.get("/dashboard", async (req,res)=>{
  const snap = await db.ref("bills").once("value");
  const data = snap.val() || {};

  let total = 0;
  let count = 0;

  Object.values(data).forEach(b=>{
    total += b.total || 0;
    count++;
  });

  res.json({
    totalSales: total,
    totalBills: count
  });
});

app.listen(3001, ()=>console.log("🚀 Firebase Server Running"));