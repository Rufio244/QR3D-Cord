/**
 * QR3D Cord Nano v2.1 — SCANNER
 * ✅ แสดงกล่องรหัสแยกส่วน, เลือกเปิดส่วนใดก็ได้
 * Copyright: Thanva Phupingbut 244 | Vider AGI
 */

const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');
const crypto = require('crypto');
const readline = require('readline');

class QR3DCordScanner {
  constructor() {
    this.version = "2.1.0_MULTI_SECTION";
  }

  async scanImage(filePath) {
    const image = await loadImage(filePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height), canvas.width, canvas.height);
    if (!code) throw new Error("ไม่พบข้อมูล");

    const data = JSON.parse(Buffer.from(code.data, 'base64url').toString('utf8'));
    console.log("\n📦 พบข้อมูลทั้งหมด:", data.parts.length, "ส่วน");
    console.log("🎨 การตั้งค่า:", data.ui);

    // 📋 แสดงรายการส่วนให้เลือก
    data.parts.forEach((part, i) => {
      console.log(`\n${i+1}. ${part.name} [${part.type}] ${part.locked ? '🔒 ล็อก' : '✅ เปิด'}`);
      console.log(`   คำสั่ง: ${part.command || "-"}`);
    });

    // 🔐 ถ้ามีส่วนที่ล็อก ให้แสดงกล่องรหัส
    const lockedParts = data.parts.filter(p => p.locked);
    if (lockedParts.length > 0) {
      console.log(`\n${data.ui.boxTitle}`);
      await this._showPasswordBox(data, data.ui);
    }

    return data;
  }

  // 🧠 กล่องรหัสผ่านแบบโต้ตอบ
  async _showPasswordBox(fullData, uiConfig) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    for (const part of fullData.parts.filter(p => p.locked)) {
      let unlocked = false;
      while (!unlocked) {
        const pass = await new Promise(res => rl.question(`👉 สำหรับ "${part.name}" → ป้อนรหัส: `, res));
        const hash = crypto.createHash('sha256').update(pass).digest('hex');

        if (hash === part.passHash) {
          part.content = Buffer.from(part.content, 'base64').toString('utf8');
          part.locked = false;
          console.log(`✅ ปลดล็อก "${part.name}" สำเร็จ!`);
          console.log(`📄 เนื้อหา: ${part.content.substring(0, 100)}...`);
          unlocked = true;
        } else {
          console.log(uiConfig.wrongPassMsg);
        }
      }
    }
    rl.close();
  }
}

// 📌 ทดสอบการทำงาน
if (require.main === module) {
  new QR3DCordScanner().scanImage('multi_section_qr.png')
    .then(() => console.log("\n✅ อ่านข้อมูลครบถ้วน"))
    .catch(err => console.error("❌", err));
}

module.exports = QR3DCordScanner;

/**
 * QR3D Cord Nano v2.1 — SCANNER
 * ✅ แสดงกล่องรหัสแยกส่วน, เลือกเปิดส่วนใดก็ได้
 * Copyright: Thanva Phupingbut 244 | Vider AGI
 */

const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');
const crypto = require('crypto');
const readline = require('readline');

class QR3DCordScanner {
  constructor() {
    this.version = "2.1.0_MULTI_SECTION";
  }

  async scanImage(filePath) {
    const image = await loadImage(filePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height), canvas.width, canvas.height);
    if (!code) throw new Error("ไม่พบข้อมูล");

    const data = JSON.parse(Buffer.from(code.data, 'base64url').toString('utf8'));
    console.log("\n📦 พบข้อมูลทั้งหมด:", data.parts.length, "ส่วน");
    console.log("🎨 การตั้งค่า:", data.ui);

    // 📋 แสดงรายการส่วนให้เลือก
    data.parts.forEach((part, i) => {
      console.log(`\n${i+1}. ${part.name} [${part.type}] ${part.locked ? '🔒 ล็อก' : '✅ เปิด'}`);
      console.log(`   คำสั่ง: ${part.command || "-"}`);
    });

    // 🔐 ถ้ามีส่วนที่ล็อก ให้แสดงกล่องรหัส
    const lockedParts = data.parts.filter(p => p.locked);
    if (lockedParts.length > 0) {
      console.log(`\n${data.ui.boxTitle}`);
      await this._showPasswordBox(data, data.ui);
    }

    return data;
  }

  // 🧠 กล่องรหัสผ่านแบบโต้ตอบ
  async _showPasswordBox(fullData, uiConfig) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    for (const part of fullData.parts.filter(p => p.locked)) {
      let unlocked = false;
      while (!unlocked) {
        const pass = await new Promise(res => rl.question(`👉 สำหรับ "${part.name}" → ป้อนรหัส: `, res));
        const hash = crypto.createHash('sha256').update(pass).digest('hex');

        if (hash === part.passHash) {
          part.content = Buffer.from(part.content, 'base64').toString('utf8');
          part.locked = false;
          console.log(`✅ ปลดล็อก "${part.name}" สำเร็จ!`);
          console.log(`📄 เนื้อหา: ${part.content.substring(0, 100)}...`);
          unlocked = true;
        } else {
          console.log(uiConfig.wrongPassMsg);
        }
      }
    }
    rl.close();
  }
}

// 📌 ทดสอบการทำงาน
if (require.main === module) {
  new QR3DCordScanner().scanImage('multi_section_qr.png')
    .then(() => console.log("\n✅ อ่านข้อมูลครบถ้วน"))
    .catch(err => console.error("❌", err));
}

module.exports = QR3DCordScanner;
