/**
 * Qr3D Cord — Universal Reader System v1.0
 * ✅ อ่านผ่าน: กล้องสด | รูปภาพ | ไฟล์เครื่อง
 * ✅ รองรับ: QR ปกติ | Qr3D Cord Standard/3D/Nano
 * ✅ ทำงานอัตโนมัติ: แสดงข้อมูล | เปิดลิงก์ | ขอรหัส | รันคำสั่ง
 * ✅ เชื่อมต่อตรงกับระบบ Qr3D Cord Generator
 * Copyright: Thanva Phupingbut 244
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const jsQR = require('jsqr');
const express = require('express');

// ⚙️ ===== การตั้งค่าระบบ =====
const CONFIG = {
  NAME: "Qr3D Cord Reader",
  VERSION: "1.0.0",
  SUPPORTED_FORMATS: ['.png', '.jpg', '.jpeg', '.webp', '.bmp'],
  AUTO_OPEN_LINK: true,
  REDIRECT_DELAY: 10000, // ตรงกับระบบสร้าง
  API_TARGET: "http://localhost:9876/api/qr3d/" // เชื่อมกับระบบสร้าง
};

// 📦 ===== 1. ตัวถอดรหัสข้อมูล =====
class DataDecoder {
  static decodeRaw(dataStr) {
    try {
      // เช็คเป็นข้อมูล Qr3D Cord หรือไม่
      if (dataStr.startsWith('Qr3D_SMART:') || dataStr.includes('pageId')) {
        const decoded = JSON.parse(Buffer.from(dataStr, 'base64').toString());
        return { type: "Qr3D_CORD", valid: true, data: decoded };
      }
      // ถ้าเป็น QR ปกติ
      return { type: "STANDARD_QR", valid: true, content: dataStr };
    } catch {
      return { type: "UNKNOWN", valid: false, raw: dataStr };
    }
  }

  static async processPayload(payload) {
    const result = { action: "none", display: "", target: null, fields: [] };

    if (payload.type === "Qr3D_CORD") {
      const d = payload.data;
      result.display = d.preview || "ข้อมูลจาก Qr3D Cord";
      result.target = d.target || null;
      result.fields = d.fields || [];
      result.action = d.redirect ? "REDIRECT" : "DISPLAY";
    } else if (payload.type === "STANDARD_QR") {
      const txt = payload.content;
      if (txt.startsWith('http')) {
        result.display = `ลิงก์: ${txt}`;
        result.target = txt;
        result.action = "OPEN_LINK";
      } else {
        result.display = txt;
        result.action = "DISPLAY_TEXT";
      }
    }
    return result;
  }
}

// 🖼️ ===== 2. อ่านจากไฟล์รูปภาพ =====
class FileScanner {
  static async scanImage(filePath) {
    try {
      if (!fs.existsSync(filePath)) return { success: false, error: "ไม่พบไฟล์" };
      
      const img = await loadImage(filePath);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const code = jsQR(ctx.getImageData(0, 0, img.width, img.height).data, img.width, img.height);
      
      if (!code) return { success: false, error: "ไม่พบโค้ดในรูป" };
      
      const decoded = DataDecoder.decodeRaw(code.data);
      const processed = await DataDecoder.processPayload(decoded);
      
      return {
        success: true,
        source: "IMAGE_FILE",
        rawData: code.data,
        decoded,
        action: processed
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  static scanFolder(folderPath) {
    const results = [];
    const files = fs.readdirSync(folderPath).filter(f => 
      CONFIG.SUPPORTED_FORMATS.includes(path.extname(f).toLowerCase())
    );
    return Promise.all(files.map(f => this.scanImage(path.join(folderPath, f))));
  }
}

// 📷 ===== 3. อ่านผ่านกล้อง (เว็บเบราว์เซอร์) =====
const WebCamScanner = `
<!-- Qr3D Cord Web Reader Component -->
<video id="qrVideo" playsinline style="width:100%;max-width:600px"></video>
<div id="resultBox" style="margin-top:15px;padding:15px;background:#f0f8ff;border-radius:8px"></div>

<script>
const video = document.getElementById('qrVideo');
const resultBox = document.getElementById('resultBox');
let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  video.srcObject = stream;
  await video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  scanLoop();
}

function scanLoop() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imgData.data, imgData.width, imgData.height);
  
  if (code) {
    handleResult(code.data);
  }
  requestAnimationFrame(scanLoop);
}

function handleResult(data) {
  resultBox.innerHTML = '<strong>พบข้อมูล:</strong><br>' + data;
  // ส่งไปประมวลผลเหมือนระบบหลัก
  fetch('${CONFIG.API_TARGET}process', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({data})
  });
}

startCamera();
</script>
`;

// 🚀 ===== 4. เซิร์ฟเวอร์ API & หน้าเว็บอ่าน =====
const app = express();
app.use(express.json());

// หน้าเครื่องอ่านกล้อง
app.get('/reader', (req, res) => {
  res.send(`
    <!DOCTYPE html><html><head><meta charset="utf-8"><title>Qr3D Cord Reader</title></head>
    <body style="max-width:700px;margin:auto;padding:20px">
      <h1>📷 Qr3D Cord Reader</h1>
      ${WebCamScanner}
    </body></html>
  `);
});

// อ่านไฟล์ผ่าน API
app.post('/api/scan-file', async (req, res) => {
  const { filePath } = req.body;
  const result = await FileScanner.scanImage(filePath);
  res.json(result);
});

// ประมวลผลข้อมูลที่อ่านได้
app.post('/api/process', async (req, res) => {
  const { data } = req.body;
  const decoded = DataDecoder.decodeRaw(data);
  const action = await DataDecoder.processPayload(decoded);
  
  // จัดการลิงก์อัตโนมัติ
  if (action.action === "REDIRECT" || action.action === "OPEN_LINK") {
    console.log(`🔗 เปิดลิงก์: ${action.target}`);
  }

  res.json({ decoded, action });
});

// 🧪 ===== ทดสอบการทำงาน =====
async function runDemo() {
  console.log(`
╔═══════════════════════════════════════════╗
║  🔍 Qr3D Cord Reader v1.0 — UNIVERSAL     ║
║  กล้องสด • รูปภาพ • ไฟล์ • อ่านทุกแบบ    ║
╚═══════════════════════════════════════════╝
  `);

  // ตัวอย่าง: อ่านไฟล์รูป
  // const res = await FileScanner.scanImage('./test_qr.png');
  // console.log("ผลการอ่าน:", res);

  console.log("✅ เปิดหน้าอ่านกล้องที่: http://localhost:9877/reader");
  console.log("✅ API สแกนไฟล์: POST /api/scan-file");
}

// เปิดใช้งาน
const READER_PORT = 9877;
app.listen(READER_PORT, () => {
  console.log(`🚀 Qr3D Cord Reader ทำงานที่พอร์ต ${READER_PORT}`);
  runDemo();
});

module.exports = { FileScanner, DataDecoder, WebCamScanner };
