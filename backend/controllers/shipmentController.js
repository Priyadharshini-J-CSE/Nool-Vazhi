const Shipment = require('../models/Shipment');

const calculateCost = (bundles, pickup, drop) => {
  const baseCost = 1500;
  const perBundle = 200;
  const poolDiscount = bundles >= 5 ? 0.15 : bundles >= 3 ? 0.10 : 0.05;
  const subtotal = baseCost + perBundle * bundles;
  const discount = subtotal * poolDiscount;
  return {
    baseCost,
    perBundle: perBundle * bundles,
    poolDiscount: Math.round(discount),
    total: Math.round(subtotal - discount),
  };
};

const createShipment = async (req, res) => {
  const { pickup, drop, goodsType, bundles, weight, estimatedDelivery } = req.body;
  try {
    const cost = calculateCost(Number(bundles), pickup, drop);
    const shipment = await Shipment.create({
      shipper: req.user._id,
      pickup,
      drop,
      goodsType,
      bundles,
      weight,
      cost,
      estimatedDelivery,
      timeline: [{ status: 'Pending', note: 'Shipment booked' }],
    });
    res.status(201).json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyShipments = async (req, res) => {
  try {
    let shipments;
    if (req.user.role === 'driver') {
      shipments = await Shipment.find({ driver: req.user._id.toString() })
        .populate('shipper', 'businessName name phone')
        .sort({ createdAt: -1 });
      // fallback: also try ObjectId match
      if (!shipments.length) {
        const mongoose = require('mongoose');
        shipments = await Shipment.find({ driver: new mongoose.Types.ObjectId(req.user._id) })
          .populate('shipper', 'businessName name phone')
          .sort({ createdAt: -1 });
      }
    } else {
      shipments = await Shipment.find({ shipper: req.user._id })
        .populate('driver', 'name phone')
        .sort({ createdAt: -1 });
    }
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('shipper', 'businessName email phone')
      .populate('driver', 'contactPerson phone rating');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateShipmentStatus = async (req, res) => {
  const { status, currentLocation, note } = req.body;
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Not found' });
    shipment.status = status;
    if (currentLocation) shipment.currentLocation = currentLocation;
    shipment.timeline.push({ status, note: note || status });
    await shipment.save();
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const total = await Shipment.countDocuments({ shipper: req.user._id });
    const active = await Shipment.countDocuments({ shipper: req.user._id, status: 'In Transit' });
    const completed = await Shipment.countDocuments({ shipper: req.user._id, status: 'Delivered' });
    const spent = await Shipment.aggregate([
      { $match: { shipper: req.user._id, status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$cost.total' } } },
    ]);
    res.json({
      total,
      active,
      completed,
      totalSpent: spent[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAvailableShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({ status: 'Pending', $or: [{ driver: null }, { driver: { $exists: false } }] })
      .populate('shipper', 'businessName name')
      .sort({ createdAt: -1 });
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const acceptShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    if (shipment.driver) return res.status(400).json({ message: 'Shipment already accepted' });
    shipment.driver = req.user._id;
    shipment.status = 'Pickup Confirmed';
    shipment.timeline.push({ status: 'Pickup Confirmed', note: 'Driver accepted the shipment' });
    await shipment.save();
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDriverStats = async (req, res) => {
  try {
    const total = await Shipment.countDocuments({ driver: req.user._id });
    const active = await Shipment.countDocuments({ driver: req.user._id, status: { $in: ['Pickup Confirmed', 'In Transit', 'Out for Delivery'] } });
    const completed = await Shipment.countDocuments({ driver: req.user._id, status: 'Delivered' });
    const earned = await Shipment.aggregate([
      { $match: { driver: req.user._id, status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$cost.total' } } },
    ]);
    res.json({ total, active, completed, totalSpent: earned[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateLocation = async (req, res) => {
  const { currentLocation, status } = req.body;
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, driver: req.user._id });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found or not assigned to you' });
    if (currentLocation) shipment.currentLocation = currentLocation;
    if (status) {
      shipment.status = status;
      shipment.timeline.push({ status, note: `Driver updated: ${currentLocation || status}` });
    }
    await shipment.save();
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createShipment, getMyShipments, getShipmentById, updateShipmentStatus, getDashboardStats, getAvailableShipments, acceptShipment, getDriverStats, updateLocation };
