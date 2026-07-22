/**
 * QR3D Cord Nano v2.1 — GENERATOR
 * ✅ เพิ่ม: กล่องรหัสแยกส่วน, หลายคำสั่งใน 1 รูป
 * Copyright: Thanva Phupingbut 244 | Vider AGI
 */

const qrcode = require('qrcode');
const fs = require('fs');
const crypto = require('crypto');

class QR3DCordNano {
  constructor() {
    this.version = "2.1.0_NANO_MULTI";
    this.maxCapacity = 120000;
    this.layers = 5;
  }

  #encodeData(dataParts, lockConfig = {}, uiConfig = {}) {
    const fullData = {
      meta: { ver: this.version, layers: this.layers, created: Date.now() },
      ui: {
        showPasswordBox: true, // ✅ แสดงกล่องรหัสอัตโนมัติ
        boxTitle: uiConfig.boxTitle || "🔐 กรุณาใส่รหัสผ่านเพื่อเข้าถึง",
        buttonText: uiConfig.buttonText || "ปลดล็อก",
        wrongPassMsg: uiConfig.wrongPassMsg || "❌ รหัสผ่านไม่ถูกต้อง ลองอีกครั้ง"
      },
      forwardRules: uiConfig.forwardRules || {},
      parts: dataParts.map((part, idx) => ({
        id: `P${idx}`,
        name: part.name || `ส่วนที่ ${idx+1}`, // ชื่อเรียกส่วนนี้
        type: part.type,
        command: part.command || "", // ✅ คำสั่ง/การทำงานของส่วนนี้
        content: Buffer.from(part.content).toString('base64'),
        locked: !!lockConfig[`P${idx}`],
        passHash: lockConfig[`P${idx}`] 
          ? crypto.createHash('sha256').update(lockConfig[`P${idx}`]).digest('hex')
          : null
      }))
    };

    const jsonStr = JSON.stringify(fullData);
    const compressed = this._nanoCompress(jsonStr);
    return compressed;
  }

  _nanoCompress(str) {
    return Buffer.from(str, 'utf8').toString('base64url');
  }

  async generate(dataParts, lockConfig = {}, uiConfig = {}, outputPath = 'qrcord_nano.png') {
    if (!Array.isArray(dataParts) || dataParts.length === 0) throw new Error("ต้องมีข้อมูลอย่างน้อย 1 ส่วน");
    if (dataParts.length > 10) throw new Error("รองรับสูงสุด 10 ส่วนต่อ 1 รูป");

    const encoded = this.#encodeData(dataParts, lockConfig, uiConfig);
    if (Buffer.byteLength(encoded, 'utf8') > this.maxCapacity) throw new Error("เกินความจุ");

    const options = { width: 256, margin: 2, errorCorrectionLevel: 'H' };
    const canvas = await qrcode.toCanvas(encoded, options);
    this._applyNano3DLayer(canvas);

    fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
    console.log(`✅ สร้างสำเร็จ | จำนวนส่วน: ${dataParts.length}`);
    return outputPath;
  }

  _applyNano3DLayer(canvas) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i + 3] = (imgData.data[i] % 2) * 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

// 📌 ตัวอย่างการสร้าง: มี 3 ส่วน ล็อก 2 ส่วน
if (require.main === module) {
  const qr = new QR3DCordNano();

  // 📦 ข้อมูลหลายส่วน หลายคำสั่ง
  const data = [
    { 
      name: "ข้อมูลทั่วไป", 
      type: "text", 
      command: "แสดงข้อความต้อนรับ",
      content: "ยินดีต้อนรับสู่ระบบ QR3D Cord Nano ของธันวา ภูปิงบุตร 244" 
    },
    { 
      name: "ลิงก์ระบบ", 
      type: "link", 
      command: "เปิดเว็บไซต์",
      content: "https://vider-three.vercel.app" 
    },
    { 
      name: "เอกสารลับ", 
      type: "file", 
      command: "แสดงไฟล์ข้อมูลสำคัญ",
      content: "ข้อมูลสิทธิ์และทรัพย์สินทางปัญญา..." 
    }
  ];

  // 🔐 ล็อกส่วนที่ 2 และ 3 ด้วยรหัสคนละอัน
  const locks = { 
    P1: "link244",    // รหัสส่วนลิงก์
    P2: "secret999"   // รหัสส่วนเอกสารลับ
  };

  // 🎨 ตั้งค่ากล่องรหัส
  const ui = {
    boxTitle: "🔐 เข้าถึงส่วนนี้ต้องใช้รหัส",
    buttonText: "ยืนยันรหัส",
    wrongPassMsg: "❌ รหัสผิด! กรุณาตรวจสอบอีกครั้ง"
  };

  qr.generate(data, locks, ui, 'multi_section_qr.png')
    .then(() => console.log("✅ เสร็จ — มี 3 ส่วน แยกล็อกได้ครบ"))
    .catch(err => console.error("❌", err));
}

module.exports = QR3DCordNano;
