const express = require('express');
const router = express.Router();
const {
  createTrip, searchTrips, bookTrip, getMyTrips,
  getMyBookings, getTripBookings, updateTripStatus, getDriverTripStats, getLocations,
} = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/locations', getLocations);                // All unique locations
router.get('/search', searchTrips);
router.post('/book', bookTrip);
router.get('/my-bookings', getMyBookings);
router.get('/my-trips', getMyTrips);
router.get('/driver-stats', getDriverTripStats);
router.post('/', createTrip);
router.get('/:id/bookings', getTripBookings);
router.put('/:id/status', updateTripStatus);

module.exports = router;
