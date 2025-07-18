const multer = require('multer');

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create multer instance with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload; 