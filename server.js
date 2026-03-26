const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const axios = require("axios");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// 🔴 HOME
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// 🔴 SUBMIT (ULTRA FAST)
app.post("/submit", async (req, res) => {
  try {
    const { firstName, middleName, lastName, mobile, email, dob, pan, message } = req.body;

    const fullName = `${firstName} ${middleName || ""} ${lastName}`;

    // ✅ FAST RESPONSE FIRST
    res.send("Submitted Successfully ✅");

    // 🔥 BACKGROUND WORK (NO DELAY)
    setTimeout(async () => {
      try {
        // ✅ SAVE TXT
        fs.appendFileSync("leads.txt",
          `${fullName}|${mobile}|${email}|${dob}|${pan}|${message}\n`
        );

        const allLeads = fs.readFileSync("leads.txt", "utf-8")
          .split("\n")
          .filter(l => l);

        // ✅ PDF CREATE
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

        console.log("✅ PDF created");

        // 🔥 GOOGLE SHEET SAVE
        await axios.post("https://script.google.com/macros/s/AKfycbwRk1zl3QMeSRutQPHPCxhN8O2mLQ_8I7UTqvLC0WjxcMvoOPVlPz4BJxlGOhiew8fCew/exec", {
          fullName,
          mobile,
          email,
          dob,
          pan,
          message
        });

        console.log("✅ Sheet saved");

      } catch (err) {
        console.log("❌ Background Error:", err.message);
      }
    }, 0);

  } catch (err) {
    console.log("❌ MAIN ERROR:", err);
    res.send("Error ❌");
  }
});

// 🔥 PORT FIX
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
