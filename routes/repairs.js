const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Repair = require('../models/Repair');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();
const statuses = ['แจ้งซ่อมแล้ว','รับเรื่องแล้ว','กำลังดำเนินการ','ซ่อมเสร็จแล้ว'];
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({ destination: (_, __, cb) => cb(null, uploadDir), filename: (_, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname).toLowerCase()}`) });
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 }, fileFilter: (_, file, cb) => cb(null, ['image/jpeg','image/png','image/webp'].includes(file.mimetype)) });
async function nextTicketNo() { const last = await Repair.findOne().sort({ ticketNo: -1 }).select('ticketNo'); return (last?.ticketNo || 1000) + 1; }
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') filter.resident = req.user._id;
    if (req.query.status && statuses.includes(req.query.status)) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.q) { const q = String(req.query.q).slice(0, 100); filter.$or = [{ subject: { $regex: q, $options: 'i' } }, { room: { $regex: q, $options: 'i' } }, { category: { $regex: q, $options: 'i' } }, { ticketNo: Number(q) || -1 }]; }
    const rows = await Repair.find(filter).populate('resident', 'name email room').sort({ priority: -1, createdAt: -1 }).limit(300);
    res.json({ repairs: rows });
  } catch (e) { next(e); }
});
router.post('/', protect, upload.single('photo'), async (req, res, next) => {
  try {
    const { room, category, subject, detail, priority, contact } = req.body;
    const allowed = ['ไฟฟ้า','ประปา','เครื่องปรับอากาศ','เฟอร์นิเจอร์','อินเทอร์เน็ต','อื่น ๆ'];
    if (!room || !category || !subject || !detail) return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ' });
    if (!allowed.includes(category)) return res.status(400).json({ message: 'ประเภทปัญหาไม่ถูกต้อง' });
    const ticketNo = await nextTicketNo();
    const repair = await Repair.create({ ticketNo, room: String(room).trim(), category, subject: String(subject).trim(), detail: String(detail).trim(), priority: ['ปกติ','ด่วน','เร่งด่วนมาก'].includes(priority) ? priority : 'ปกติ', contact: contact || req.user.name, photo: req.file ? `/uploads/${req.file.filename}` : '', resident: req.user._id, history: [{ status: 'แจ้งซ่อมแล้ว', note: 'สร้างรายการแจ้งซ่อม', changedBy: req.user._id }] });
    res.status(201).json({ repair, message: `แจ้งซ่อมสำเร็จ (#${ticketNo})` });
  } catch (e) { next(e); }
});
router.get('/:id', protect, async (req, res, next) => {
  try { const r = await Repair.findById(req.params.id).populate('resident', 'name email room').populate('history.changedBy', 'name role'); if (!r) return res.status(404).json({ message: 'ไม่พบรายการ' }); if (req.user.role !== 'admin' && String(r.resident._id) !== String(req.user._id)) return res.status(403).json({ message: 'ไม่มีสิทธิ์ดูรายการนี้' }); res.json({ repair: r }); } catch (e) { next(e); }
});
router.patch('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, note, assignedTo, repairNote } = req.body;
    if (!statuses.includes(status)) return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    const r = await Repair.findById(req.params.id); if (!r) return res.status(404).json({ message: 'ไม่พบรายการ' });
    r.status = status; if (assignedTo !== undefined) r.assignedTo = String(assignedTo).slice(0, 80); if (repairNote !== undefined) r.repairNote = String(repairNote).slice(0, 2000);
    r.completedAt = status === 'ซ่อมเสร็จแล้ว' ? new Date() : null;
    r.history.push({ status, note: String(note || repairNote || '').slice(0, 500), changedBy: req.user._id });
    await r.save(); res.json({ repair: r, message: 'อัปเดตสถานะเรียบร้อยแล้ว' });
  } catch (e) { next(e); }
});
router.delete('/:id', protect, async (req, res, next) => {
  try { const r = await Repair.findById(req.params.id); if (!r) return res.status(404).json({ message: 'ไม่พบรายการ' }); if (req.user.role !== 'admin' && String(r.resident) !== String(req.user._id)) return res.status(403).json({ message: 'ไม่มีสิทธิ์ลบรายการนี้' }); if (r.status !== 'แจ้งซ่อมแล้ว' && req.user.role !== 'admin') return res.status(400).json({ message: 'ลบได้เฉพาะรายการที่ยังไม่ได้รับเรื่อง' }); await r.deleteOne(); res.json({ message: 'ลบรายการเรียบร้อยแล้ว' }); } catch (e) { next(e); }
});
module.exports = router;
