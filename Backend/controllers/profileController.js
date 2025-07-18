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
    console.error('Error in getUserProfile:', error);
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
    console.error('Error in updateProfile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    console.log('Starting uploadProfileImage...');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);

    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({ message: 'No image file provided' });
    }

    try {
      console.log('Finding user profile...');
      const profile = await UserProfile.findOne({ user: req.user._id });
      console.log('Profile found:', profile);

      console.log('Preparing to upload to Vercel Blob...');
      // Upload to Vercel Blob with a unique filename
      const filename = `${Date.now()}-${req.file.originalname}`;
      console.log('Generated filename:', filename);

      console.log('Uploading to Vercel Blob...');
      console.log('BLOB_READ_WRITE_TOKEN exists:', !!process.env.BLOB_READ_WRITE_TOKEN);
      
      const blob = await put(filename, req.file.buffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: req.file.mimetype
      });

      console.log('Blob upload successful:', blob);

      // Update profile with new image URL
      const imagePath = blob.url;
      console.log('Image path to save:', imagePath);
      
      if (profile) {
        profile.profileImage = imagePath;
        await profile.save();
        console.log('Profile updated with new image');
      } else {
        console.log('Creating new profile with image');
        await UserProfile.create({
          user: req.user._id,
          profileImage: imagePath
        });
      }

      console.log('Successfully completed image upload');
      res.json({ message: 'Profile image uploaded successfully', imagePath });
    } catch (uploadError) {
      console.error('Error in Vercel Blob upload:', uploadError);
      console.error('Full error details:', JSON.stringify(uploadError, null, 2));
      res.status(500).json({ 
        message: 'Error uploading profile image', 
        error: uploadError.message,
        details: uploadError.stack 
      });
    }
  } catch (error) {
    console.error('Error in uploadProfileImage outer try-catch:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      message: 'Error uploading profile image', 
      error: error.message,
      details: error.stack
    });
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
    console.error('Error in deleteProfileImage:', error);
    res.status(500).json({ message: 'Error deleting profile image', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage
}; 