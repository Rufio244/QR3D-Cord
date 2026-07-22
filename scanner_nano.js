/**
 * QR3D Cord Nano v2.0 — SCANNER
 * ✅ อ่านทุกข้อมูล: ลิงก์, ข้อความ, รูป, ไฟล์
 * ✅ แก้ล็อกแยกส่วนได้
 * ✅ ทำงานได้ทั้งออนไลน์และออฟไลน์
 */

const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');
const crypto = require('crypto');

class QR3DCordScanner {
  constructor() {
    this.version = "2.0.0_NANO";
  }

  // 🔍 อ่านไฟล์ภาพ
  async scanImage(filePath) {
    const image = await loadImage(filePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height), canvas.width, canvas.height);
    if (!code) throw new Error("ไม่พบข้อมูล QR3D Cord");

    // ถอดรหัส + แยกชั้นนาโน
    const decoded = this._decodeNanoData(code.data);
    return this._parseData(decoded);
  }

  // 🧩 ถอดข้อมูลจากชั้น 3D
  _decodeNanoData(raw) {
    return Buffer.from(raw, 'base64url').toString('utf8');
  }

  // 📋 แยกและแสดงผล
  _parseData(jsonStr) {
    const data = JSON.parse(jsonStr);
    const result = { meta: data.meta, accessible: [], locked: [] };

    data.parts.forEach(part => {
      const info = {
        id: part.id,
        type: part.type,
        content: part.content,
        locked: part.locked
      };

      if (part.locked) result.locked.push(info);
      else {
        info.content = Buffer.from(part.content, 'base64').toString('utf8');
        result.accessible.push(info);
      }
    });
    return result;
  }

  // 🔐 ปลดล็อกส่วนที่ซ่อน
  unlockPart(scannedData, partId, password) {
    const part = scannedData.locked.find(p => p.id === partId);
    if (!part) return { ok: false, msg: "ไม่พบส่วนนี้" };

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (hash !== part.passHash) return { ok: false, msg: "รหัสผิด" };

    const content = Buffer.from(part.content, 'base64').toString('utf8');
    return { ok: true, type: part.type, content };
  }
}

// 📌 ตัวอย่างการใช้งาน
if (require.main === module) {
  const scanner = new QR3DCordScanner();

  scanner.scanImage('qr3d_nano_demo.png')
    .then(data => {
      console.log("✅ ข้อมูลที่อ่านได้:");
      console.log("📂 ส่วนเปิด:", data.accessible);
      console.log("🔒 ส่วนล็อก:", data.locked.map(p => p.id));

      // ถ้าต้องการปลดล็อก
      const unlocked = scanner.unlockPart(data, 'P2', 'secret123');
      console.log("🔓 ผลปลดล็อก:", unlocked);
    })
    .catch(err => console.error("❌ อ่านไม่ได้:", err));
}

module.exports = QR3DCordScanner;
