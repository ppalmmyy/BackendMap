import express from 'express';
import { checkUserLogin } from '../Database/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  console.log('Received login data:', req.body);  // เพิ่มตรงนี้เช็คข้อมูลที่ได้รับ

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบ' });
  }

  try {
    const result = await checkUserLogin(email, password);
    if (result.success) {
      return res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ', user: result.user });
    } else {
      return res.status(400).json({ message: result.message });
    }
  } catch (err) {
    console.error('Login route error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});


export default router;