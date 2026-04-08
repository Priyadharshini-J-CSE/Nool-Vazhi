const express = require('express');
const router = express.Router();
const { registerOrg, registerDriver, loginOrg, loginDriver, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register/organization', registerOrg);
router.post('/register/driver', registerDriver);
router.post('/login/organization', loginOrg);
router.post('/login/driver', loginDriver);
router.get('/profile', protect, getProfile);

module.exports = router;
