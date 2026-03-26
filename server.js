const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const puppeteer = require("puppeteer");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let browser, page;

// 🔥 WhatsApp Web START (FAST + STABLE)
async function startWhatsApp() {
  browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./chrome-data",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  page = await browser.newPage();
  await page.goto("https://web.whatsapp.com");

  console.log("👉 QR scan karo (sirf 1 baar)");

  await page.waitForSelector('div[title="Search input textbox"]', {
    timeout: 0
  });

  console.log("✅ WhatsApp Connected");
}
// startWhatsApp();

// 🔴 HOME
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// 🔴 WHATSAPP FUNCTION (BACKGROUND)
async function sendWhatsApp() {
  try {
    const number = "88016202726666";

    console.log("👉 Opening chat...");

    await page.goto(`https://web.whatsapp.com/send?phone=${number}&text=New Lead`, {
      waitUntil: "networkidle2"
    });

    // 👉 wait for message box
    await page.waitForSelector("footer", { timeout: 60000 });

    console.log("👉 Chat opened");

    // 👉 attach button
    await page.waitForSelector("span[data-icon='clip']", { timeout: 60000 });
    const attachBtn = await page.$("span[data-icon='clip']");
    await attachBtn.click();

    console.log("👉 Attach clicked");

    // 👉 file upload
    await page.waitForSelector("input[type='file']", { timeout: 60000 });
    const input = await page.$("input[type='file']");
    await input.uploadFile("D:\\whatsapp-system\\leads.pdf");

    console.log("👉 File uploaded");

    // 👉 wait preview load
    await page.waitForTimeout(4000);

    // 👉 send button
    await page.waitForSelector("span[data-icon='send']", { timeout: 60000 });
    const sendBtn = await page.$("span[data-icon='send']");
    await sendBtn.click();

    console.log("✅ WhatsApp pe PDF send ho gaya");
  } catch (err) {
    console.log("❌ WhatsApp FULL ERROR:", err);
  }
}

// 🔴 SUBMIT (FAST FIX)
app.post("/submit", async (req, res) => {
  const { firstName, middleName, lastName, mobile, email, dob, pan, message } = req.body;

  const fullName = `${firstName} ${middleName || ""} ${lastName}`;

  // Save
  fs.appendFileSync("leads.txt",
    `${fullName}|${mobile}|${email}|${dob}|${pan}|${message}\n`
  );

  const allLeads = fs.readFileSync("leads.txt", "utf-8")
    .split("\n")
    .filter(l => l);

  // 🔥 PDF SAME DESIGN (NO CHANGE)
  const doc = new PDFDocument({ margin: 30 });
  doc.pipe(fs.createWriteStream("leads.pdf"));

  doc.rect(0, 0, 600, 50).fill("#2c3e50");
  doc.fillColor("#fff")
     .fontSize(16)
     .text("LEADS REPORT", 0, 15, { align: "center" });

  doc.moveDown(2);

  const startX = 40;
  let startY = doc.y;

  const colWidth = [90, 80, 120, 80, 90, 100];
  const headers = ["Full Name", "Mobile", "Email", "DOB", "PAN", "Details"];

  let x = startX;

  headers.forEach((header, i) => {
    doc.rect(x, startY, colWidth[i], 25)
       .fillAndStroke("#3498db", "#000");

    doc.fillColor("#fff")
       .fontSize(10)
       .text(header, x + 5, startY + 7, {
         width: colWidth[i] - 10
       });

    x += colWidth[i];
  });

  startY += 25;

  allLeads.forEach((lead, rowIndex) => {
    const [name, mobile, email, dob, pan, message] = lead.split("|");

    const values = [name, mobile, email, dob, pan, message];

    let maxHeight = 0;

    values.forEach((val, i) => {
      const height = doc.heightOfString(val, {
        width: colWidth[i] - 10
      });
      if (height > maxHeight) maxHeight = height;
    });

    const rowHeight = maxHeight + 10;

    let x = startX;
    const bgColor = rowIndex % 2 === 0 ? "#ecf0f1" : "#ffffff";

    values.forEach((val, i) => {
      doc.rect(x, startY, colWidth[i], rowHeight)
         .fillAndStroke(bgColor, "#ccc");

      doc.fillColor("#000")
         .fontSize(10)
         .text(val, x + 5, startY + 5, {
           width: colWidth[i] - 10
         });

      x += colWidth[i];
    });

    startY += rowHeight;

    if (startY > 750) {
      doc.addPage();
      startY = 50;
    }
  });

  doc.end();

  // ✅ FAST RESPONSE (NO LAG)
  res.send("Submitted Successfully ✅ (Sending WhatsApp...)");

  // 🔥 BACKGROUND SEND
  setTimeout(() => {
    sendWhatsApp();
  }, 2000);
});

app.listen(3000, () => {
  console.log("Server running http://localhost:3000");
});