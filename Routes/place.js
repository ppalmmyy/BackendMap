import express from 'express';
import {getPlaces} from '../Database/db.js';

const router = express.Router();


router.get('/', async (req, res) => {
  const result = await getPlaces();
  console.log('📦 RESULT:', result); // DEBUG

  if (!result.success) {
    return res.status(500).json({ message: result.message });
  }

  return res.status(200).json(result.places);

});

export default router;
