const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  getUserProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage
} = require('../controllers/profileController');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get user profile
router.get('/me', protect, getUserProfile);

// Update profile
router.put('/update', protect, updateProfile);

// Upload profile image
router.post('/upload-image', protect, upload.single('file'), uploadProfileImage);

// Delete profile image
router.delete('/image', protect, deleteProfileImage);

module.exports = router; 