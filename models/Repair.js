const mongoose = require('mongoose');
const historySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now }
}, { _id: false });
const repairSchema = new mongoose.Schema({
  ticketNo: { type: Number, unique: true, index: true },
  room: { type: String, required: true, trim: true, maxlength: 20 },
  category: { type: String, required: true, enum: ['ไฟฟ้า','ประปา','เครื่องปรับอากาศ','เฟอร์นิเจอร์','อินเทอร์เน็ต','อื่น ๆ'] },
  subject: { type: String, required: true, trim: true, maxlength: 120 },
  detail: { type: String, required: true, trim: true, maxlength: 2000 },
  priority: { type: String, enum: ['ปกติ','ด่วน','เร่งด่วนมาก'], default: 'ปกติ' },
  status: { type: String, enum: ['แจ้งซ่อมแล้ว','รับเรื่องแล้ว','กำลังดำเนินการ','ซ่อมเสร็จแล้ว'], default: 'แจ้งซ่อมแล้ว' },
  contact: { type: String, trim: true, maxlength: 80, default: '' },
  photo: { type: String, default: '' },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: String, trim: true, default: '' },
  repairNote: { type: String, trim: true, maxlength: 2000, default: '' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  history: { type: [historySchema], default: [] }
}, { timestamps: true });
repairSchema.index({ room: 1, createdAt: -1 });
repairSchema.index({ status: 1, priority: 1, createdAt: -1 });
module.exports = mongoose.model('Repair', repairSchema);
