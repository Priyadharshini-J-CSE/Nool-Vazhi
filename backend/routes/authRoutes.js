const express = require('express');
const router = express.Router();
const { registerOrg, registerDriver, loginOrg, loginDriver, getProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

router.post('/register/organization',
  upload.fields([
    { name: 'orgProof', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'aadharDoc', maxCount: 1 },
  ]),
  registerOrg
);

router.post('/register/driver',
  upload.fields([
    { name: 'licenseDoc', maxCount: 1 },
    { name: 'insuranceDoc', maxCount: 1 },
    { name: 'aadharDoc', maxCount: 1 },
  ]),
  registerDriver
);

router.post('/login/organization', loginOrg);
router.post('/login/driver', loginDriver);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:userId/:token', resetPassword);
router.get('/profile', protect, getProfile);

module.exports = router;
