const jwt = require('jsonwebtoken');
const User = require('../models/User');
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้' });
    req.user = user;
    next();
  } catch { return res.status(401).json({ message: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' }); }
}
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'สำหรับผู้ดูแลหอพักเท่านั้น' });
  next();
}
module.exports = { protect, adminOnly };
