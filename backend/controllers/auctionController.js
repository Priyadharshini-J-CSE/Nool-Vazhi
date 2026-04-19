const AuctionRequest = require('../models/AuctionRequest');
const Bid = require('../models/Bid');
const User = require('../models/User');

// ─── SHIPPER ────────────────────────────────────────────

// Create auction request
const createAuction = async (req, res) => {
  const { fromLocation, toLocation, weight, goodsType, description, auctionDuration } = req.body;
  try {
    const now = new Date();
    const endTime = new Date(now.getTime() + Number(auctionDuration) * 60 * 1000);
    const auction = await AuctionRequest.create({
      shipper: req.user._id,
      fromLocation: fromLocation.trim(),
      toLocation: toLocation.trim(),
      weight: Number(weight),
      goodsType: goodsType || '',
      description: description || '',
      auctionDuration: Number(auctionDuration),
      auctionStartTime: now,
      auctionEndTime: endTime,
      status: 'OPEN',
    });
    res.status(201).json(auction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Shipper: get my auctions
const getMyAuctions = async (req, res) => {
  try {
    const auctions = await AuctionRequest.find({ shipper: req.user._id })
      .sort({ createdAt: -1 });

    // Auto-close expired OPEN auctions
    for (const a of auctions) {
      if (a.status === 'OPEN' && new Date() >= a.auctionEndTime) {
        a.status = 'CLOSED';
        await a.save();
      }
    }
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Shipper: get bids for an auction
const getAuctionBids = async (req, res) => {
  try {
    const auction = await AuctionRequest.findOne({ _id: req.params.id, shipper: req.user._id });
    if (!auction) return res.status(404).json({ message: 'Auction not found' });

    // Auto-close if expired
    if (auction.status === 'OPEN' && new Date() >= auction.auctionEndTime) {
      auction.status = 'CLOSED';
      await auction.save();
    }

    const bids = await Bid.find({ auction: req.params.id, status: { $in: ['ACTIVE', 'SELECTED', 'ACCEPTED', 'REJECTED'] } })
      .populate('driver', 'name phone rating vehicleType vehicleNumber capacity')
      .sort({ pricePerKg: 1 });

    res.json({ auction, bids });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Shipper: select drivers with weight assignments
const selectDrivers = async (req, res) => {
  // selections: [{ bidId, driverId, assignedWeight }]
  const { selections } = req.body;
  try {
    const auction = await AuctionRequest.findOne({ _id: req.params.id, shipper: req.user._id });
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    if (auction.status !== 'CLOSED') return res.status(400).json({ message: 'Auction must be CLOSED before selecting drivers' });

    // Validate total weight
    const totalAssigned = selections.reduce((s, sel) => s + Number(sel.assignedWeight), 0);
    if (totalAssigned > auction.weight) {
      return res.status(400).json({ message: `Total assigned weight (${totalAssigned}kg) exceeds requested weight (${auction.weight}kg)` });
    }

    // Build selections with price from bids
    const selectionDocs = [];
    for (const sel of selections) {
      const bid = await Bid.findById(sel.bidId);
      if (!bid) continue;
      const assignedWeight = Number(sel.assignedWeight);
      selectionDocs.push({
        driver: bid.driver,
        assignedWeight,
        pricePerKg: bid.pricePerKg,
        totalPrice: bid.pricePerKg * assignedWeight,
        driverStatus: 'PENDING',
      });
      bid.status = 'SELECTED';
      await bid.save();
    }

    auction.selections = selectionDocs;
    auction.status = 'SELECTED';
    await auction.save();

    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DRIVER ─────────────────────────────────────────────

// Driver: view open auctions
const getOpenAuctions = async (req, res) => {
  try {
    const now = new Date();
    // Auto-close expired ones first
    await AuctionRequest.updateMany(
      { status: 'OPEN', auctionEndTime: { $lte: now } },
      { status: 'CLOSED' }
    );

    const auctions = await AuctionRequest.find({ status: 'OPEN', auctionEndTime: { $gt: now } })
      .populate('shipper', 'name businessName')
      .sort({ auctionEndTime: 1 });

    // Attach driver's own bid if exists
    const driverId = req.user._id;
    const auctionsWithBid = await Promise.all(auctions.map(async (a) => {
      const myBid = await Bid.findOne({ auction: a._id, driver: driverId });
      return { ...a.toJSON(), myBid: myBid || null };
    }));

    res.json(auctionsWithBid);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver: place a bid
const placeBid = async (req, res) => {
  const { auctionId, pricePerKg } = req.body;
  try {
    const auction = await AuctionRequest.findById(auctionId);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    if (auction.status !== 'OPEN') return res.status(400).json({ message: 'Auction is no longer open' });
    if (new Date() >= auction.auctionEndTime) return res.status(400).json({ message: 'Auction has ended' });

    // Update existing bid or create new
    const existing = await Bid.findOne({ auction: auctionId, driver: req.user._id });
    if (existing) {
      existing.pricePerKg = Number(pricePerKg);
      existing.totalPrice = Number(pricePerKg) * auction.weight;
      await existing.save();
      return res.json(existing);
    }

    const bid = await Bid.create({
      auction: auctionId,
      driver: req.user._id,
      pricePerKg: Number(pricePerKg),
      totalPrice: Number(pricePerKg) * auction.weight,
    });
    res.status(201).json(bid);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver: get selected shipments (auctions where driver was selected)
const getDriverSelections = async (req, res) => {
  try {
    const auctions = await AuctionRequest.find({
      status: { $in: ['SELECTED', 'CONFIRMED'] },
      'selections.driver': req.user._id,
    }).populate('shipper', 'name businessName phone');

    const result = auctions.map(a => {
      const sel = a.selections.find(s => s.driver.toString() === req.user._id.toString());
      return {
        _id: a._id,
        auctionId: a.auctionId,
        fromLocation: a.fromLocation,
        toLocation: a.toLocation,
        goodsType: a.goodsType,
        shipper: a.shipper,
        assignedWeight: sel.assignedWeight,
        pricePerKg: sel.pricePerKg,
        totalPrice: sel.totalPrice,
        driverStatus: sel.driverStatus,
        auctionStatus: a.status,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver: accept or reject selected shipments
const respondToSelections = async (req, res) => {
  // decisions: [{ auctionId, decision: 'ACCEPTED' | 'REJECTED' }]
  const { decisions } = req.body;
  try {
    const driver = await User.findById(req.user._id);
    let totalAcceptedWeight = 0;

    // First pass: calculate total weight to accept
    for (const d of decisions) {
      if (d.decision === 'ACCEPTED') {
        const auction = await AuctionRequest.findById(d.auctionId);
        if (!auction) continue;
        const sel = auction.selections.find(s => s.driver.toString() === req.user._id.toString());
        if (sel) totalAcceptedWeight += sel.assignedWeight;
      }
    }

    // Validate capacity only if driver has set it (skip if 0 or not set)
    const capVal = parseFloat(driver.capacity);
    const availableCap = (!capVal || isNaN(capVal)) ? Infinity : capVal * 1000;
    if (availableCap !== Infinity && totalAcceptedWeight > availableCap) {
      return res.status(400).json({
        message: `Total accepted weight (${totalAcceptedWeight}kg) exceeds your capacity (${availableCap}kg). Update your capacity in My Profile.`,
      });
    }

    // Second pass: apply decisions
    for (const d of decisions) {
      const auction = await AuctionRequest.findById(d.auctionId);
      if (!auction) continue;

      const selIdx = auction.selections.findIndex(s => s.driver.toString() === req.user._id.toString());
      if (selIdx === -1) continue;

      auction.selections[selIdx].driverStatus = d.decision;

      // If accepted, mark bid as ACCEPTED
      if (d.decision === 'ACCEPTED') {
        await Bid.findOneAndUpdate({ auction: d.auctionId, driver: req.user._id }, { status: 'ACCEPTED' });
      } else {
        await Bid.findOneAndUpdate({ auction: d.auctionId, driver: req.user._id }, { status: 'REJECTED' });
        // Reopen auction if all drivers rejected
        const allRejected = auction.selections.every(s => s.driverStatus === 'REJECTED');
        if (allRejected) auction.status = 'OPEN';
      }

      // Check if all selections responded
      const allResponded = auction.selections.every(s => s.driverStatus !== 'PENDING');
      const anyAccepted = auction.selections.some(s => s.driverStatus === 'ACCEPTED');
      if (allResponded && anyAccepted) auction.status = 'CONFIRMED';

      await auction.save();
    }

    res.json({ message: 'Response recorded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Shipper: manually close an open auction early
const closeAuction = async (req, res) => {
  try {
    const auction = await AuctionRequest.findOne({ _id: req.params.id, shipper: req.user._id });
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    if (auction.status !== 'OPEN') return res.status(400).json({ message: 'Auction is not open' });
    auction.status = 'CLOSED';
    auction.auctionEndTime = new Date();
    await auction.save();
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Driver: update location and status for an accepted auction shipment
const updateAuctionLocation = async (req, res) => {
  const { currentLocation, deliveryStatus } = req.body;
  try {
    const auction = await AuctionRequest.findOne({
      _id: req.params.id,
      'selections.driver': req.user._id,
      'selections.driverStatus': 'ACCEPTED',
    });
    if (!auction) return res.status(404).json({ message: 'Auction not found or not assigned to you' });

    const selIdx = auction.selections.findIndex(
      s => s.driver.toString() === req.user._id.toString() && s.driverStatus === 'ACCEPTED'
    );
    if (selIdx === -1) return res.status(404).json({ message: 'Selection not found' });

    if (currentLocation) auction.selections[selIdx].currentLocation = currentLocation;
    if (deliveryStatus) {
      auction.selections[selIdx].deliveryStatus = deliveryStatus;
      auction.selections[selIdx].timeline.push({
        status: deliveryStatus,
        location: currentLocation || auction.selections[selIdx].currentLocation,
        note: `Driver updated: ${deliveryStatus}`,
      });
      // If all accepted drivers delivered, mark auction as completed
      const allDelivered = auction.selections
        .filter(s => s.driverStatus === 'ACCEPTED')
        .every(s => s.deliveryStatus === 'Delivered');
      if (allDelivered) auction.status = 'CONFIRMED'; // keep CONFIRMED but all delivered
    }

    await auction.save();
    res.json(auction.selections[selIdx]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createAuction, getMyAuctions, getAuctionBids, selectDrivers,
  getOpenAuctions, placeBid, getDriverSelections, respondToSelections,
  closeAuction, updateAuctionLocation,
};
