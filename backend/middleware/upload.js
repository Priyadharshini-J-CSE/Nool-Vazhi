const multer = require('multer');

// Store files in memory as buffer, we'll convert to base64 and save in MongoDB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB max per file
});

module.exports = { upload };
