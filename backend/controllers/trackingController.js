const Shipment = require('../models/Shipment');

const trackShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ shipmentId: req.params.trackingId })
      .populate('driver', 'contactPerson phone rating')
      .select('shipmentId pickup drop status currentLocation timeline driver estimatedDelivery');
    if (!shipment) return res.status(404).json({ message: 'Tracking ID not found' });
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { trackShipment };
