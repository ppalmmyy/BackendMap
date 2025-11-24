import express from 'express';
import { createTrip, addTripStops, getTripWithStops } from '../Database/db.js';

const router = express.Router();

/**
 * POST /api/trip
 * สร้างทริปใหม่
 */
router.post('/', async (req, res) => {
  const { user_id, name, startLat, startLng, endLat, endLng } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'ต้องมี user_id' });
  }

  const result = await createTrip({ user_id, name, startLat, startLng, endLat, endLng });

  if (!result.success) {
    return res.status(500).json({ message: result.message });
  }

  return res.status(201).json(result.trip);
});

/**
 * POST /api/trip/:tripId/stops
 * เพิ่มจุดแวะให้ทริป
 */
router.post('/:tripId/stops', async (req, res) => {
  const { tripId } = req.params;
  const { stops } = req.body;

  const result = await addTripStops(tripId, stops);

  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }

  return res.status(201).json({ message: result.message });
});

/**
 * GET /api/trip/:tripId
 * ดึงทริป + จุดแวะ
 */
router.get('/:tripId', async (req, res) => {
  const { tripId } = req.params;

  const result = await getTripWithStops(tripId);

  if (!result.success) {
    return res.status(404).json({ message: result.message });
  }

  return res.status(200).json(result.trip);
});

export default router;
