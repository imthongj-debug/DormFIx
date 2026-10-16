require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Repair = require('./models/Repair');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dormfix');
  const email = 'admin@dormfix.local';
  let admin = await User.findOne({ email });
  if (!admin) admin = await User.create({ name: 'ผู้ดูแลหอพัก', email, passwordHash: await bcrypt.hash('DormFix123!', 12), role: 'admin' });
  const residentEmail = 'resident@dormfix.local';
  let resident = await User.findOne({ email: residentEmail });
  if (!resident) resident = await User.create({ name: 'ผู้พักตัวอย่าง', email: residentEmail, passwordHash: await bcrypt.hash('DormFix123!', 12), role: 'resident', room: '205' });
  if (await Repair.countDocuments() === 0) {
    const examples = [
      { ticketNo: 1001, room: '205', category: 'เครื่องปรับอากาศ', subject: 'เครื่องปรับอากาศไม่เย็น', detail: 'แอร์เปิดติดแต่ไม่เย็น', priority: 'ปกติ', status: 'กำลังดำเนินการ', resident: resident._id, history: [{ status: 'แจ้งซ่อมแล้ว', changedBy: resident._id }, { status: 'รับเรื่องแล้ว', changedBy: admin._id }, { status: 'กำลังดำเนินการ', changedBy: admin._id }] },
      { ticketNo: 1002, room: '101', category: 'ไฟฟ้า', subject: 'ไฟในห้องกะพริบ', detail: 'ไฟกะพริบเป็นระยะ โปรดตรวจสอบ', priority: 'เร่งด่วนมาก', status: 'รับเรื่องแล้ว', resident: resident._id, history: [{ status: 'แจ้งซ่อมแล้ว', changedBy: resident._id }, { status: 'รับเรื่องแล้ว', changedBy: admin._id }] },
      { ticketNo: 1003, room: '312', category: 'ประปา', subject: 'ก๊อกน้ำรั่ว', detail: 'ก๊อกน้ำอ่างล้างหน้ารั่ว', priority: 'ปกติ', status: 'ซ่อมเสร็จแล้ว', resident: resident._id, completedAt: new Date(), history: [{ status: 'แจ้งซ่อมแล้ว', changedBy: resident._id }, { status: 'ซ่อมเสร็จแล้ว', note: 'เปลี่ยนซีลก๊อกน้ำ', changedBy: admin._id }] }
    ];
    await Repair.insertMany(examples);
  }
  console.log('Seed complete. Admin: admin@dormfix.local / DormFix123!');
  console.log('Resident: resident@dormfix.local / DormFix123!');
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
