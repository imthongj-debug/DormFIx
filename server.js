require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const repairRoutes = require('./routes/repairs');
const app = express();
const PORT = process.env.PORT || 3000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_this_with_a_long_random_secret') console.warn('WARNING: Set a unique JWT_SECRET in .env before using this app outside local development.');
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-7', legacyHeaders: false }), authRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/health', (_, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'รูปภาพต้องมีขนาดไม่เกิน 4 MB' : 'อัปโหลดรูปภาพไม่สำเร็จ' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map(x => x.message).join(', ') });
  if (err.code === 11000) return res.status(409).json({ message: 'ข้อมูลนี้มีอยู่แล้ว กรุณาลองใหม่' });
  console.error(err); res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
});
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dormfix')
  .then(() => app.listen(PORT, () => console.log(`DormFix is running at http://localhost:${PORT}`)))
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
