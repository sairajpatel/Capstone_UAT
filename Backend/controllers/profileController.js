const UserProfile = require('../models/userProfileModel');
const { put } = require('@vercel/blob');
const path = require('path');

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    console.log('Starting uploadProfileImage...');
    console.log('Request user:', req.user);
    console.log('Request file:', req.file);

    // Check if user exists in request
    if (!req.user || !req.user._id) {
      console.error('No user found in request');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Check if file exists
    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided' 
      });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload an image file' 
      });
    }

    // Check if BLOB token exists
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      console.error('BLOB_READ_WRITE_TOKEN not found in environment');
      return res.status(500).json({ 
        success: false,
        message: 'Storage configuration error. Please contact support.' 
      });
    }

    try {
      // Find or create user profile
      let profile = await UserProfile.findOne({ user: req.user._id });
      if (!profile) {
        profile = new UserProfile({ user: req.user._id });
      }
      console.log('Profile found/created:', profile);

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const filename = `profile-${req.user._id}-${timestamp}-${randomString}${path.extname(req.file.originalname)}`;
      console.log('Generated filename:', filename);

      // Upload to Vercel Blob with explicit token
      console.log('Uploading to Vercel Blob...');
      const blob = await put(filename, req.file.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: req.file.mimetype,
        token: blobToken // Explicitly pass the token
      });
      console.log('Blob upload response:', {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        size: blob.size
      });

      // Update profile with new image URL
      profile.profileImage = blob.url;
      await profile.save();
      console.log('Profile updated with new image URL');

      res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          imagePath: blob.url,
          profile: profile
        }
      });
    } catch (uploadError) {
      console.error('Error in profile update/blob upload:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Error uploading image',
        error: uploadError.message
      });
    }
  } catch (error) {
    console.error('Error in uploadProfileImage:', error);
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