const express = require('express');
const router = express.Router();
const {
  createAuction, getMyAuctions, getAuctionBids, selectDrivers,
  getOpenAuctions, placeBid, getDriverSelections, respondToSelections,
  closeAuction, updateAuctionLocation,
} = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Static routes FIRST
router.get('/my', getMyAuctions);
router.get('/open', getOpenAuctions);
router.post('/bid', placeBid);
router.get('/driver/selections', getDriverSelections);
router.post('/driver/respond', respondToSelections);
router.post('/', createAuction);

// Param routes LAST
router.get('/:id/bids', getAuctionBids);
router.post('/:id/select', selectDrivers);
router.put('/:id/close', closeAuction);
router.put('/:id/update-location', updateAuctionLocation);

module.exports = router;
