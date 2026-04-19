const express = require('express');
const router = express.Router();
const {
  createTrip, searchTrips, bookTrip, getMyTrips,
  getMyBookings, getTripBookings, updateTripStatus,
  getDriverTripStats, getLocations, acceptBooking, updateLocation, startTrip, updateBookingStatus,
} = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/locations', getLocations);
router.get('/search', searchTrips);
router.post('/book', bookTrip);
router.post('/accept-booking', acceptBooking);
router.get('/my-bookings', getMyBookings);
router.get('/my-trips', getMyTrips);
router.get('/driver-stats', getDriverTripStats);
router.post('/', createTrip);
router.get('/:id/bookings', getTripBookings);
router.put('/:id/status', updateTripStatus);
router.put('/:id/location', updateLocation);
router.put('/:id/start', startTrip);
router.put('/booking/:id/status', updateBookingStatus);

module.exports = router;
