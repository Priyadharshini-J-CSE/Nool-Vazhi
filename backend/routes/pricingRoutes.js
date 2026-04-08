const express = require('express');
const router = express.Router();
const { getPricingEstimate } = require('../controllers/pricingController');

router.get('/estimate', getPricingEstimate);

module.exports = router;
