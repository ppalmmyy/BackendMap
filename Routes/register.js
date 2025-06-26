import express from 'express';
import { getAllUsers, insertUser } from '../Database/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    const result = await insertUser({ name, email, password, confirmPassword });

    if (result.success) {
      return res.status(200).json({ message: 'ลงทะเบียนสำเร็จ', user: result.user });
    } else {
      return res.status(400).json({ message: result.message });
    }
  } catch (err) {
    console.error('เกิดข้อผิดพลาด:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
});

router.get('/', async (req, res) => {
  const result = await getAllUsers();

  if (!result.success) {
    return res.status(500).json({ message: result.message });
  }

  return res.status(200).json(result.users);
});



export default router;
