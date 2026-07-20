/**
 * Qr3D Cord — Full Integration System v2.1
 * ✅ รองรับ: QR ปกติ / API / ไฟล์เครื่อง / Server
 * ✅ ทุกฟังก์ชันเป็น API เรียกใช้ได้
 * ✅ ช่องข้อความอัจฉริยะ: รหัส / ข้อความ / ลิงก์
 * ✅ แสดงข้อมูลก่อน → ลิงก์อัตโนมัติภายใน 10 วินาที
 * Copyright: Thanva Phupingbut 244
 */

const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const { createCanvas } = require('canvas');

// ⚙️ ===== การตั้งค่าหลัก =====
const CONFIG = {
  NAME: "Qr3D Cord",
  VERSION: "2.1.0",
  REDIRECT_DELAY: 10000, // 10 วินาที
  MODES: { STANDARD: "standard", D3: "3d", NANO: "nano" },
  SOURCES: ["api", "local_file", "server", "legacy_qr"],
  API_BASE: "/api/qr3d/",
  STORAGE_PATH: path.join(__dirname, 'qr3d_storage')
};

// 📂 ===== เตรียมพื้นที่จัดเก็บ =====
if (!fs.existsSync(CONFIG.STORAGE_PATH)) fs.mkdirSync(CONFIG.STORAGE_PATH, { recursive: true });

// 📥 ===== 1. รับข้อมูลจากทุกแหล่ง =====
class DataImporter {
  static async fromAPI(apiUrl, options = {}) {
    try {
      const res = await fetch(apiUrl, { method: 'GET', ...options });
      return { source: "api", data: await res.json(), success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  static fromLocalFile(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { source: "local_file", data, success: true };
    } catch (e) { return { success: false, error: "ไฟล์ไม่ถูกต้อง" }; }
  }

  static fromServer(serverId) {
    const file = path.join(CONFIG.STORAGE_PATH, `${serverId}.json`);
    return this.fromLocalFile(file);
  }

  static fromLegacyQR(qrText) {
    return { source: "legacy_qr", data: { content: qrText }, success: true };
  }
}

// 📝 ===== 2. ระบบช่องข้อความ & คำสั่งอัจฉริยะ =====
class SmartInput {
  static parseCommand(text) {
    const cmd = text.trim().toLowerCase();
    const payload = { raw: text, type: "text", fields: [] };

    // ✅ คำสั่ง: ใส่รหัส → เพิ่มช่องกรอกรหัส
    if (cmd.includes("รหัส") || cmd.includes("pin") || cmd.includes("password")) {
      payload.type = "secure";
      payload.fields.push({ name: "รหัสยืนยัน", type: "password", required: true });
    }

    // ✅ คำสั่ง: ลิงก์ + แสดงข้อความก่อน
    if (cmd.startsWith("link:") || cmd.startsWith("ลิงก์:")) {
      const [_, url, ...msgParts] = text.split(":");
      payload.type = "smart_link";
      payload.targetUrl = url.trim();
      payload.previewText = msgParts.join(":").trim() || "กำลังนำไปยังหน้าเป้าหมาย...";
      payload.autoRedirect = true;
      payload.delay = CONFIG.REDIRECT_DELAY;
    }

    // ✅ คำสั่ง: ข้อความธรรมดา
    if (payload.type === "text") {
      payload.displayText = text;
    }

    return payload;
  }

  static generateDisplayPage(payload) {
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Qr3D Cord</title>
<style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f8f9fa}
.box{max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;box-shadow:0 4px 20px #0002}
h2{color:#0A2463} .info{color:#333;margin:20px 0} .countdown{font-size:22px;color:#D8315B;font-weight:bold}</style></head>
<body><div class="box">
<h2>📌 ${payload.previewText || payload.displayText || 'ข้อมูลจาก Qr3D Cord'}</h2>
${payload.fields.length ? `<p>กรอกข้อมูลเพื่อดำเนินการต่อ</p>` : ''}
${payload.fields.map(f => `<input type="${f.type}" placeholder="${f.name}" required style="padding:8px;width:80%;margin:10px">`).join('')}
${payload.autoRedirect ? `<div class="countdown">จะเปลี่ยนหน้าใน <span id="timer">10</span> วินาที</div>` : ''}
</div>
${payload.autoRedirect ? `<script>let t=10;setInterval(()=>{t--;document.getElementById('timer').innerText=t;if(t<=0)window.location='${payload.targetUrl}'},1000)</script>` : ''}
</body></html>`;
    return html;
  }
}

// 🧩 ===== 3. สร้าง QR ทุกรูปแบบ (เชื่อมข้อมูลอัจฉริยะ) =====
class Qr3DGenerator {
  static async createSmartQR(payload, mode = "standard", options = {}) {
    const smartData = SmartInput.parseCommand(payload);
    const pageHtml = SmartInput.generateDisplayPage(smartData);
    
    // บันทึกหน้าแสดงผล
    const pageId = `page_${Date.now()}`;
    const pagePath = path.join(CONFIG.STORAGE_PATH, `${pageId}.html`);
    fs.writeFileSync(pagePath, pageHtml);

    // ข้อมูลที่ฝังใน QR
    const embedData = {
      type: "Qr3D_SMART",
      pageId,
      preview: smartData.previewText || smartData.displayText,
      redirect: smartData.autoRedirect,
      target: smartData.targetUrl || null,
      fields: smartData.fields
    };

    // สร้างรูปตามโหมด
    let qrImage;
    const encoded = Buffer.from(JSON.stringify(embedData)).toString('base64');
    
    if (mode === "standard") {
      qrImage = await qrcode.toDataURL(encoded, { width: 512 });
    } else if (mode === "3d") {
      qrImage = await this.make3DStyle(encoded, options);
    } else {
      qrImage = await this.makeNano(encoded);
    }

    return {
      success: true,
      pageId,
      mode,
      image: qrImage,
      api_endpoints: {
        getPage: `${CONFIG.API_BASE}page/${pageId}`,
        getData: `${CONFIG.API_BASE}data/${pageId}`,
        update: `${CONFIG.API_BASE}update/${pageId}`
      },
      instruction: "สแกนแล้วจะแสดงข้อมูลก่อน แล้วไปยังลิงก์อัตโนมัติภายใน 10 วินาที"
    };
  }

  static async make3DStyle(data, options) {
    // ใช้โค้ดส่วน D3Generator จากเวอร์ชันก่อน
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#F8F9FA";
    ctx.fillRect(0,0,512,512);
    const base = await qrcode.toDataURL(data, { width: 432 });
    const img = new (require('canvas').Image)();
    img.src = base;
    ctx.drawImage(img, 40, 40, 432, 432);
    ctx.fillStyle = "#0A246344";
    ctx.drawImage(img, 45, 45, 432, 432);
    return canvas.toDataURL();
  }

  static async makeNano(data) {
    return await qrcode.toDataURL(data, { width: 128, margin: 1 });
  }
}

// 🔌 ===== 4. ระบบ API ทุกฟังก์ชัน =====
const express = require('express');
const app = express();
app.use(express.json());

// 📥 รับข้อมูลสร้าง
app.post(CONFIG.API_BASE + "generate", async (req, res) => {
  const { content, mode = "standard", options = {} } = req.body;
  const result = await Qr3DGenerator.createSmartQR(content, mode, options);
  res.json(result);
});

// 📄 ดึงหน้าแสดงผล
app.get(CONFIG.API_BASE + "page/:id", (req, res) => {
  const file = path.join(CONFIG.STORAGE_PATH, `page_${req.params.id}.html`);
  if (fs.existsSync(file)) res.sendFile(file);
  else res.status(404).json({ error: "ไม่พบข้อมูล" });
});

// 📊 ดึงข้อมูลดิบ
app.get(CONFIG.API_BASE + "data/:id", (req, res) => {
  const file = path.join(CONFIG.STORAGE_PATH, `page_${req.params.id}.html`);
  res.json({ exists: fs.existsSync(file), size: fs.statSync(file).size });
});

// 🧪 ===== ทดสอบระบบ =====
async function runDemo() {
  console.log(`
╔═══════════════════════════════════════════════╗
║  🧩 Qr3D Cord v2.1 — SMART & UNIVERSAL ║
║  รองรับทุกแหล่ง • ทุกปุ่มเป็น API • อัจฉริยะ ║
╚═══════════════════════════════════════════════╝
  `);

  // 1. ทดสอบคำสั่งลิงก์พร้อมข้อความ
  const res1 = await Qr3DGenerator.createSmartQR(
    "ลิงก์: https://vider-agi.com ระบบกำลังเตรียมข้อมูลให้คุณ...",
    "3d"
  );
  console.log("✅ สร้างลิงก์อัจฉริยะ:", res1.api_endpoints);

  // 2. ทดสอบขอให้ใส่รหัส
  const res2 = await Qr3DGenerator.createSmartQR(
    "กรุณาใส่รหัสเพื่อเข้าถึงข้อมูล",
    "standard"
  );
  console.log("✅ สร้างแบบขอรหัส:", res2.api_endpoints);

  // 3. นำ QR ปกติมาใช้
  const legacy = DataImporter.fromLegacyQR("https://example.com");
  console.log("✅ รับ QR ปกติเข้ามาใช้:", legacy.success);
}

// เปิดระบบ
if (require.main === module) runDemo();
app.listen(9876, () => console.log(`🚀 API ทำงานที่พอร์ต 9876`));

module.exports = { Qr3DGenerator, DataImporter, SmartInput, CONFIG };
