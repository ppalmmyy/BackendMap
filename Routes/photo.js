import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get('/', (req, res) => {
  const filePath = path.resolve('./Database/Photo'); // ใส่ ./ นำหน้า path ถ้าเป็น relative path
  res.sendFile(filePath, err => {
    if (err) {
      console.error(err);
      res.status(500).send('เกิดข้อผิดพลาดในการส่งไฟล์');
    }
  });
});


export default router;