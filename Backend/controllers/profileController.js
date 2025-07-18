const UserProfile = require('../models/userProfileModel');
const { put } = require('@vercel/blob');
const path = require('path');

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    console.log('Starting uploadProfileImage...');
    console.log('Request headers:', req.headers);
    console.log('Request user:', req.user);

    // Check if user exists in request
    if (!req.user || !req.user._id) {
      console.error('No user found in request');
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Get raw body data
    let chunks = [];
    let fileData;
    
    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Parse multipart form data
        const boundary = req.headers['content-type'].split('boundary=')[1];
        const parts = buffer.toString().split(boundary);
        
        // Find the file part
        const filePart = parts.find(part => part.includes('filename='));
        if (!filePart) {
          return res.status(400).json({
            success: false,
            message: 'No file found in request'
          });
        }

        // Extract file data
        const fileContentStart = filePart.indexOf('\r\n\r\n') + 4;
        const fileContentEnd = filePart.lastIndexOf('\r\n');
        fileData = filePart.slice(fileContentStart, fileContentEnd);

        // Generate filename
        const filename = `profile-${req.user._id}-${Date.now()}.jpg`;

        // Upload to Vercel Blob
        console.log('Uploading to Vercel Blob...');
        const blob = await put(filename, Buffer.from(fileData, 'binary'), {
          access: 'public',
          addRandomSuffix: true,
          contentType: 'image/jpeg'
        });
        console.log('Blob upload successful:', blob);

        // Update profile
        let profile = await UserProfile.findOne({ user: req.user._id });
        if (!profile) {
          profile = new UserProfile({ user: req.user._id });
        }

        profile.profileImage = blob.url;
        await profile.save();

        res.status(200).json({
          success: true,
          message: 'Profile image uploaded successfully',
          data: {
            imagePath: blob.url,
            profile: profile
          }
        });
      } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({
          success: false,
          message: 'Error processing file',
          error: error.message
        });
      }
    });
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