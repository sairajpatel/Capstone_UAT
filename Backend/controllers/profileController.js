const UserProfile = require('../models/userProfileModel');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxqhpxjmx',
  api_key: process.env.CLOUDINARY_API_KEY || '944123168276773',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Ry_yvFDEZbXBZEPtGPWGXJcQPSo'
};

console.log('Cloudinary Config:', {
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key ? 'Present' : 'Not present',
  api_secret: cloudinaryConfig.api_secret ? 'Present' : 'Not present'
});

cloudinary.config(cloudinaryConfig);

// Configure multer for temporary storage
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('file');

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    // Log request details
    console.log('Request received:', {
      method: req.method,
      path: req.path,
      headers: req.headers,
      user: req.user?._id
    });

    // Handle multer upload
    upload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        console.error('Unknown upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      try {
        // Check user authentication
        if (!req.user || !req.user._id) {
          console.log('No user found in request');
          return res.status(401).json({
            success: false,
            message: 'User not authenticated'
          });
        }

        // Check file
        if (!req.file) {
          console.log('No file in request');
          return res.status(400).json({
            success: false,
            message: 'No image file provided'
          });
        }

        console.log('File received:', {
          fieldname: req.file.fieldname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });

        // Upload to Cloudinary
        console.log('Preparing Cloudinary upload...');
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: 'profile-images',
          public_id: `profile-${req.user._id}-${Date.now()}`,
          overwrite: true
        });

        console.log('Cloudinary upload successful:', {
          url: uploadResponse.secure_url,
          public_id: uploadResponse.public_id
        });

        // Update user profile
        let profile = await UserProfile.findOne({ user: req.user._id });
        if (!profile) {
          profile = new UserProfile({ user: req.user._id });
        }

        profile.profileImage = uploadResponse.secure_url;
        await profile.save();

        console.log('Profile updated successfully');

        return res.status(200).json({
          success: true,
          message: 'Profile image uploaded successfully',
          data: {
            imagePath: uploadResponse.secure_url,
            profile: profile
          }
        });
      } catch (error) {
        console.error('Error during upload process:', error);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({
          success: false,
          message: 'Error processing upload',
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error('Outer error:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    console.log('Getting user profile for:', req.user._id);
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching profile', 
      error: error.message 
    });
  }
};

// Create or update user profile
const updateProfile = async (req, res) => {
  try {
    const profileData = {
      ...req.body,
      user: req.user._id
    };

    let profile = await UserProfile.findOne({ user: req.user._id });

    if (profile) {
      profile = await UserProfile.findOneAndUpdate(
        { user: req.user._id },
        profileData,
        { new: true }
      );
    } else {
      profile = await UserProfile.create(profileData);
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating profile', 
      error: error.message 
    });
  }
};

// Delete profile image
const deleteProfileImage = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    
    if (!profile || !profile.profileImage) {
      return res.status(404).json({ 
        success: false,
        message: 'No profile image found' 
      });
    }

    // Clear image path in profile
    profile.profileImage = '';
    await profile.save();

    res.json({ 
      success: true,
      message: 'Profile image deleted successfully' 
    });
  } catch (error) {
    console.error('Error in deleteProfileImage:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting profile image', 
      error: error.message 
    });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage
}; 