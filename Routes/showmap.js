import express from 'express';
import {getTypes} from '../Database/db.js';

const router = express.Router();


router.get('/', async (req, res) => {
  const result = await getTypes();
  console.log('📦 RESULT:', result); // DEBUG

  if (!result.success) {
    return res.status(500).json({ message: result.message });
  }

  return res.status(200).json(result.types);

});

export default router;
