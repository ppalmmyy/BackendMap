import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filePath = path.resolve('Database/api.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    console.log('📦 RESULT:', data); // DEBUG
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ message: 'ไม่สามารถโหลดข้อมูล JSON ได้' });
  }
});

export default router;
