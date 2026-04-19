const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');

// Driver: Create a trip
const createTrip = async (req, res) => {
  const { fromLocation, toLocation, totalCapacity, pricePerKg, vehicleType, vehicleNumber, minimumBookingKg, hasReturnTrip } = req.body;
  try {
    const tripData = {
      driver: req.user._id,
      fromLocation: fromLocation.trim(),
      toLocation: toLocation.trim(),
      totalCapacity: Number(totalCapacity),
      availableCapacity: Number(totalCapacity),
      pricePerKg: Number(pricePerKg),
      vehicleType: vehicleType || req.user.vehicleType || '',
      vehicleNumber: vehicleNumber || req.user.vehicleNumber || '',
      minimumBookingKg: Number(minimumBookingKg) || 1,
      hasReturnTrip: !!hasReturnTrip,
    };

    const trip = await Trip.create(tripData);

    // Auto-create return trip if requested
    if (hasReturnTrip) {
      const returnTrip = await Trip.create({
        ...tripData,
        fromLocation: toLocation.trim(),
        toLocation: fromLocation.trim(),
        hasReturnTrip: false,
      });
      trip.returnTrip = returnTrip._id;
      await trip.save();
    }

    await trip.populate('driver', 'name phone rating vehicleType vehicleNumber');
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Shipper: Search trips by route
const searchTrips = async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ message: 'from and to are required' });
  try {
    const trips = await Trip.find({
      fromLocation: { $regex: from.trim(), $options: 'i' },
      toLocation: { $regex: to.trim(), $options: 'i' },
      status: 'ACTIVE',
      availableCapacity: { $gt: 0 },
      isStarted: { $ne: true },
    })
      .populate('driver', 'name phone rating vehicleType vehicleNumber')
      .sort({ pricePerKg: 1 });

    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Shipper: Book capacity — atomic using findOneAndUpdate to prevent overbooking
const bookTrip = async (req, res) => {
  const { tripId, bookedWeight, goodsType, goodsDescription } = req.body;
  const weight = Number(bookedWeight);

  try {
    // Atomically deduct capacity only if enough is available
    const trip = await Trip.findOneAndUpdate(
      {
        _id: tripId,
        status: 'ACTIVE',
        availableCapacity: { $gte: weight },
      },
      [
        {
          $set: {
            availableCapacity: { $subtract: ['$availableCapacity', weight] },
            status: {
              $cond: {
                if: { $lte: [{ $subtract: ['$availableCapacity', weight] }, 0] },
                then: 'FULL',
                else: '$status',
              },
            },
          },
        },
      ],
      { new: true }
    );

    if (!trip) {
      // Check why it failed
      const existing = await Trip.findById(tripId);
      if (!existing) return res.status(404).json({ message: 'Trip not found' });
      if (existing.status !== 'ACTIVE') return res.status(400).json({ message: `Trip is ${existing.status}` });
      return res.status(400).json({
        message: `Only ${existing.availableCapacity} kg available. You requested ${weight} kg.`,
      });
    }

    if (weight < trip.minimumBookingKg) {
      // Rollback
      await Trip.findByIdAndUpdate(tripId, { $inc: { availableCapacity: weight }, status: 'ACTIVE' });
      return res.status(400).json({ message: `Minimum booking is ${trip.minimumBookingKg} kg` });
    }

    // Calculate effective price with discount
    const pctUsed = Math.round(((trip.totalCapacity - trip.availableCapacity) / trip.totalCapacity) * 100);
    let effectivePrice = trip.pricePerKg;
    if (pctUsed >= 80) effectivePrice = Math.round(trip.pricePerKg * 0.85);
    else if (pctUsed >= 50) effectivePrice = Math.round(trip.pricePerKg * 0.95);

    const booking = await Booking.create({
      trip: trip._id,
      shipper: req.user._id,
      bookedWeight: weight,
      pricePerKg: effectivePrice,
      totalPrice: effectivePrice * weight,
      goodsType: goodsType || '',
      goodsDescription: goodsDescription || '',
    });

    await booking.populate([
      { path: 'trip', populate: { path: 'driver', select: 'name phone' } },
      { path: 'shipper', select: 'name businessName' },
    ]);

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all trips for a driver
const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ driver: req.user._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all bookings for a shipper
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ shipper: req.user._id })
      .populate({ path: 'trip', populate: { path: 'driver', select: 'name phone rating vehicleType vehicleNumber' } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get bookings on a specific trip (driver view)
const getTripBookings = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, driver: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    const bookings = await Booking.find({ trip: req.params.id })
      .populate('shipper', 'name businessName phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver: Update trip status
const updateTripStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const trip = await Trip.findOne({ _id: req.params.id, driver: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    trip.status = status;
    await trip.save();
    if (status === 'COMPLETED') await Booking.updateMany({ trip: trip._id }, { status: 'DELIVERED' });
    if (status === 'CANCELLED') await Booking.updateMany({ trip: trip._id }, { status: 'CANCELLED' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver trip stats
const getDriverTripStats = async (req, res) => {
  try {
    const total = await Trip.countDocuments({ driver: req.user._id });
    const active = await Trip.countDocuments({ driver: req.user._id, status: 'ACTIVE' });
    const completed = await Trip.countDocuments({ driver: req.user._id, status: 'COMPLETED' });
    const bookings = await Booking.find({ status: 'DELIVERED' })
      .populate('trip', 'driver');
    const totalEarned = bookings
      .filter(b => b.trip?.driver?.toString() === req.user._id.toString())
      .reduce((sum, b) => sum + b.totalPrice, 0);
    res.json({ total, active, completed, totalEarned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all unique locations from existing trips
const getLocations = async (req, res) => {
  try {
    const froms = await Trip.distinct('fromLocation');
    const tos = await Trip.distinct('toLocation');
    const all = [...new Set([...froms, ...tos])].sort();
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver: Accept one booking, auto-reject others on same trip
const acceptBooking = async (req, res) => {
  const { bookingId } = req.body;
  try {
    const booking = await Booking.findById(bookingId).populate('trip');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.trip.driver.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your trip' });

    // Accept this booking
    booking.status = 'CONFIRMED';
    await booking.save();

    // Auto-reject all other PENDING bookings on same trip
    await Booking.updateMany(
      { trip: booking.trip._id, _id: { $ne: bookingId }, status: 'CONFIRMED' },
      { status: 'CANCELLED' }
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver: Update current location of a trip
const updateLocation = async (req, res) => {
  const { currentLocation } = req.body;
  try {
    const trip = await Trip.findOne({ _id: req.params.id, driver: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (currentLocation) trip.currentLocation = currentLocation;
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver: Start a trip — hides it from shipper marketplace
const startTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, driver: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    trip.isStarted = true;
    trip.startedAt = new Date();
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver: Update individual booking delivery status
const updateBookingStatus = async (req, res) => {
  const { deliveryStatus } = req.body;
  try {
    const booking = await Booking.findById(req.params.id).populate('trip');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.trip.driver.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your trip' });
    booking.status = deliveryStatus;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTrip, searchTrips, bookTrip, getMyTrips, getMyBookings, getTripBookings, updateTripStatus, getDriverTripStats, getLocations, acceptBooking, updateLocation, startTrip, updateBookingStatus };
