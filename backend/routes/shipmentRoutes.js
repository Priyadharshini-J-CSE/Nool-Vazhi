const express = require('express');
const router = express.Router();
const {
  createShipment, getMyShipments, getShipmentById, updateShipmentStatus,
  getDashboardStats, getAvailableShipments, acceptShipment, getDriverStats, updateLocation,
} = require('../controllers/shipmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/driver-stats', getDriverStats);
router.get('/available', getAvailableShipments);
router.put('/:id/accept', acceptShipment);
router.put('/:id/location', updateLocation);
router.route('/').get(getMyShipments).post(createShipment);
router.route('/:id').get(getShipmentById).put(updateShipmentStatus);

module.exports = router;
