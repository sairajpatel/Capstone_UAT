const UserProfile = require('../models/userProfileModel');
const { put } = require('@vercel/blob');
const path = require('path');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
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
      // Update existing profile
      profile = await UserProfile.findOneAndUpdate(
        { user: req.user._id },
        profileData,
        { new: true }
      );
    } else {
      // Create new profile
      profile = await UserProfile.create(profileData);
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const profile = await UserProfile.findOne({ user: req.user._id });
    
    try {
      // Upload to Vercel Blob with a unique filename
      const filename = `${Date.now()}-${req.file.originalname}`;
      const blob = await put(filename, req.file.buffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: req.file.mimetype
      });

      // Update profile with new image URL
      const imagePath = blob.url;
      
      if (profile) {
        profile.profileImage = imagePath;
        await profile.save();
      } else {
        await UserProfile.create({
          user: req.user._id,
          profileImage: imagePath
        });
      }

      res.json({ message: 'Profile image uploaded successfully', imagePath });
    } catch (uploadError) {
      console.error('Error uploading to Vercel Blob:', uploadError);
      res.status(500).json({ message: 'Error uploading profile image', error: uploadError.message });
    }
  } catch (error) {
    console.error('Error in uploadProfileImage:', error);
    res.status(500).json({ message: 'Error uploading profile image', error: error.message });
  }
};

// Delete profile image
const deleteProfileImage = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });
    
    if (!profile || !profile.profileImage) {
      return res.status(404).json({ message: 'No profile image found' });
    }

    // Clear image path in profile
    profile.profileImage = '';
    await profile.save();

    res.json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting profile image', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage
}; 