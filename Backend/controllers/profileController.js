const UserProfile = require('../models/userProfileModel');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxqhpxjmx',
  api_key: process.env.CLOUDINARY_API_KEY || '944123168276773',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Ry_yvFDEZbXBZEPtGPWGXJcQPSo'
});

// Configure multer for temporary storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    console.log('Starting image upload...');
    console.log('User:', req.user?._id);
    console.log('File:', req.file ? 'Present' : 'Not present');
    console.log('Cloudinary Config:', {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key ? 'Present' : 'Not present',
      api_secret: cloudinary.config().api_secret ? 'Present' : 'Not present'
    });

    // Check if user exists in request
    if (!req.user || !req.user._id) {
      console.log('No user found in request');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Check if file exists
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided' 
      });
    }

    try {
      console.log('Converting file to base64...');
      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      console.log('Uploading to Cloudinary...');
      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'profile-images',
        public_id: `profile-${req.user._id}-${Date.now()}`,
        overwrite: true
      });
      console.log('Cloudinary upload successful:', uploadResponse.secure_url);

      console.log('Finding/creating user profile...');
      // Find or create user profile
      let profile = await UserProfile.findOne({ user: req.user._id });
      if (!profile) {
        console.log('Creating new profile...');
        profile = new UserProfile({ user: req.user._id });
      }

      // Update profile with new image URL
      profile.profileImage = uploadResponse.secure_url;
      await profile.save();
      console.log('Profile updated successfully');

      res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          imagePath: uploadResponse.secure_url,
          profile: profile
        }
      });
    } catch (uploadError) {
      console.error('Error in try block:', uploadError);
      console.error('Full error details:', JSON.stringify(uploadError, null, 2));
      return res.status(500).json({
        success: false,
        message: 'Error uploading image',
        error: uploadError.message,
        details: uploadError.stack
      });
    }
  } catch (error) {
    console.error('Error in outer try block:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      details: error.stack
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