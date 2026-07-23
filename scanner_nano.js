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

/**
 * QR3D Cord Nano v2.2 — SCANNER + FILE RECOVERY
 * ✅ อ่านข้อมูลครบถ้วน
 * ✅ แปลงกลับเป็นไฟล์ต้นฉบับได้ทุกประเภท
 * ✅ บันทึกไฟล์ได้ตรงสกุล
 * Copyright: Thanva Phupingbut 244 | Vider AGI
 */

const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class QR3DCordScanner {
  constructor() {
    this.version = "2.2.0_FILE_RECOVERY";
    // 📌 ตารางจับคู่ประเภทไฟล์กับสกุล
    this.fileTypeMap = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/zip': 'zip',
      'application/json': 'json',
      'text/csv': 'csv',
      'file': 'bin' // กรณีไม่ระบุ
    };
  }

  async scanImage(filePath, saveFolder = './recovered_files') {
    const image = await loadImage(filePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height), canvas.width, canvas.height);
    if (!code) throw new Error("ไม่พบข้อมูล QR3D Cord");

    const fullData = JSON.parse(Buffer.from(code.data, 'base64url').toString('utf8'));
    console.log(`\n✅ อ่านสำเร็จ | เวอร์ชัน: ${fullData.meta.ver}`);
    console.log(`📦 จำนวนส่วน: ${fullData.parts.length}`);

    // สร้างโฟลเดอร์เก็บไฟล์ถ้ายังไม่มี
    if (!fs.existsSync(saveFolder)) fs.mkdirSync(saveFolder, { recursive: true });

    // 📋 แสดงรายการและประมวลผลแต่ละส่วน
    for (let i = 0; i < fullData.parts.length; i++) {
      const part = fullData.parts[i];
      console.log(`\n${i+1}. ${part.name} [${part.type}] ${part.locked ? '🔒 ล็อก' : '✅ พร้อมใช้งาน'}`);
      console.log(`   คำสั่ง: ${part.command || "-"}`);

      // ปลดล็อกถ้าจำเป็น
      if (part.locked) {
        const unlocked = await this._unlockPartInteractive(part, fullData.ui);
        if (!unlocked) {
          console.log(`   ⏭️ ข้ามส่วนนี้ (รหัสไม่ถูกต้อง)`);
          continue;
        }
        part.locked = false;
      }

      // 📂 แปลงกลับเป็นไฟล์ต้นฉบับ
      if (part.type === 'image' || part.type === 'file' || part.type === 'document') {
        const savedPath = await this._recoverFile(part, saveFolder);
        console.log(`💾 บันทึกไฟล์สำเร็จ: ${savedPath}`);
      } else if (part.type === 'text') {
        const textContent = Buffer.from(part.content, 'base64').toString('utf8');
        console.log(`📄 เนื้อหา: ${textContent.substring(0, 200)}...`);
      } else if (part.type === 'link') {
        const link = Buffer.from(part.content, 'base64').toString('utf8');
        console.log(`🔗 ลิงก์: ${link}`);
      }
    }

    return fullData;
  }

  // 🔐 ปลดล็อกแบบโต้ตอบ
  async _unlockPartInteractive(part, uiConfig) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let attempt = 0;
    while (attempt < 3) {
      const pass = await new Promise(res => rl.question(`👉 ส่วน "${part.name}" → ป้อนรหัส: `, res));
      const hash = crypto.createHash('sha256').update(pass).digest('hex');
      if (hash === part.passHash) {
        part.content = Buffer.from(part.content, 'base64').toString('utf8');
        rl.close();
        return true;
      }
      console.log(uiConfig?.wrongPassMsg || "❌ รหัสผิด");
      attempt++;
    }
    rl.close();
    return false;
  }

  // 🧠 ✨ ฟังก์ชันหลัก: แปลงกลับเป็นไฟล์ต้นฉบับ
  async _recoverFile(part, saveFolder) {
    // ถอดข้อมูลออกจาก Base64
    const rawData = Buffer.from(part.content, 'base64');
    
    // ตรวจสอบประเภทไฟล์อัตโนมัติ
    let fileExt = 'bin';
    let mimeType = part.mimeType || this._detectMimeType(rawData);
    
    // หาสกุลไฟล์ที่ถูกต้อง
    fileExt = this.fileTypeMap[mimeType] || fileExt;

    // ตั้งชื่อไฟล์
    const baseName = part.name.replace(/[^a-zA-Z0-9ก-๙_]/g, '_') || `file_${Date.now()}`;
    const fileName = `${baseName}.${fileExt}`;
    const fullPath = path.join(saveFolder, fileName);

    // บันทึกไฟล์
    fs.writeFileSync(fullPath, rawData);
    return fullPath;
  }

  // 🔍 ตรวจสอบประเภทไฟล์จากข้อมูลดิบ
  _detectMimeType(buffer) {
    const header = buffer.slice(0, 8).toString('hex');
    if (header.startsWith('89504e47')) return 'image/png';
    if (header.startsWith('ffd8ff')) return 'image/jpeg';
    if (header.startsWith('52494646')) return 'image/webp';
    if (header.startsWith('47494638')) return 'image/gif';
    if (header.startsWith('25504446')) return 'application/pdf';
    if (header.startsWith('504b0304')) return 'application/zip';
    return 'application/octet-stream';
  }
}

// 📌 ตัวอย่างการใช้งาน
if (require.main === module) {
  const scanner = new QR3DCordScanner();
  
  console.log("🔍 กำลังอ่านและกู้คืนไฟล์...");
  scanner.scanImage('multi_section_qr.png', './my_files')
    .then(() => console.log("\n✅ เสร็จสิ้น — ไฟล์ทั้งหมดถูกกู้คืนเรียบร้อย"))
    .catch(err => console.error("❌ ผิดพลาด:", err));
}

module.exports = QR3DCordScanner;
