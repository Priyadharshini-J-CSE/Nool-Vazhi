const express = require('express');
const router = express.Router();
const {
  createShipment,
  getMyShipments,
  getShipmentById,
  updateShipmentStatus,
  getDashboardStats,
  getAvailableShipments,
  acceptShipment,
  getDriverStats,
} = require('../controllers/shipmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/driver-stats', getDriverStats);
router.get('/available', getAvailableShipments);
router.put('/:id/accept', acceptShipment);
router.route('/').get(getMyShipments).post(createShipment);
router.route('/:id').get(getShipmentById).put(updateShipmentStatus);

module.exports = router;
