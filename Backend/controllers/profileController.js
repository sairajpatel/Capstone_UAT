const UserProfile = require('../models/userProfileModel');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dxqhpxjmx',
  api_key: '944123168276773',
  api_secret: 'Ry_yvFDEZbXBZEPtGPWGXJcQPSo'
});

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    // Check user authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    try {
      // Convert buffer to base64 for Cloudinary
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'profile-images',
        resource_type: 'auto',
        public_id: `profile-${req.user._id}-${Date.now()}`,
        overwrite: true
      });

      // Find or create user profile
      let profile = await UserProfile.findOne({ user: req.user._id });
      if (!profile) {
        profile = new UserProfile({ user: req.user._id });
      }

      // Update profile with new image URL
      profile.profileImage = uploadResult.secure_url;
      await profile.save();

      return res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          imagePath: uploadResult.secure_url,
          profile: profile
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading image',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Server error:', error);
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

// Update profile
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

    // If there's an existing image, delete it from Cloudinary
    if (profile.profileImage) {
      const publicId = profile.profileImage.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(`profile-images/${publicId}`);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }
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