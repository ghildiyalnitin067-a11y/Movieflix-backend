const Profile = require('../models/Profile');
const User = require('../models/User');

// Get all profiles for the current user
const getProfiles = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const profiles = await Profile.find({ userId })
      .select('-pin -watchHistory -myList') // Exclude sensitive/large data
      .sort({ createdAt: 1 });
    
    res.json({
      success: true,
      count: profiles.length,
      profiles: profiles.map(profile => ({
        id: profile._id,
        name: profile.name,
        avatar: profile.avatar,
        type: profile.type,
        isActive: profile.isActive,
        preferences: profile.preferences,
        watchHistoryCount: profile.watchHistoryCount,
        myListCount: profile.myListCount,
        totalWatchTime: profile.totalWatchTime,
        lastActivityAt: profile.lastActivityAt,
        createdAt: profile.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profiles',
      error: error.message
    });
  }
};

// Get a single profile by ID
const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      profile: {
        id: profile._id,
        name: profile.name,
        avatar: profile.avatar,
        type: profile.type,
        isActive: profile.isActive,
        preferences: profile.preferences,
        watchHistoryCount: profile.watchHistoryCount,
        myListCount: profile.myListCount,
        totalWatchTime: profile.totalWatchTime,
        lastActivityAt: profile.lastActivityAt,
        createdAt: profile.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Create a new profile
const createProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, avatar, type, preferences, pin } = req.body;
    
    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Profile name is required'
      });
    }
    
    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Profile name must be less than 50 characters'
      });
    }
    
    // Get user to check plan limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has reached profile limit
    const existingProfilesCount = await Profile.countDocuments({ userId });
    const maxProfiles = user.maxProfiles || Profile.getMaxProfiles('standard');
    
    if (existingProfilesCount >= maxProfiles) {
      return res.status(403).json({
        success: false,
        message: `You have reached the maximum limit of ${maxProfiles} profiles for your plan`,
        currentCount: existingProfilesCount,
        maxAllowed: maxProfiles
      });
    }
    
    // Check if profile name already exists for this user
    const existingProfile = await Profile.findOne({ userId, name: name.trim() });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'A profile with this name already exists'
      });
    }
    
    // Create profile data
    const profileData = {
      userId,
      name: name.trim(),
      type: type || 'adult',
      isActive: existingProfilesCount === 0 // First profile is active by default
    };
    
    // Add avatar if provided, otherwise use default
    if (avatar) {
      profileData.avatar = avatar;
    }
    
    // Add preferences if provided
    if (preferences) {
      profileData.preferences = {
        ...profileData.preferences,
        ...preferences
      };
    }
    
    // Create the profile
    const profile = new Profile(profileData);
    
    // Set PIN if provided (for kids profiles or PIN protection)
    if (pin && pin.length >= 4) {
      await profile.setPin(pin);
    } else {
      await profile.save();
    }
    
    // If this is the first profile, set it as active in user
    if (existingProfilesCount === 0) {
      user.activeProfile = profile._id;
      await user.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile: {
        id: profile._id,
        name: profile.name,
        avatar: profile.avatar,
        type: profile.type,
        isActive: profile.isActive,
        preferences: profile.preferences,
        createdAt: profile.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create profile',
      error: error.message
    });
  }
};

// Update a profile
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { name, avatar, type, preferences, pin } = req.body;
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // Update name if provided
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Profile name cannot be empty'
        });
      }
      
      if (name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Profile name must be less than 50 characters'
        });
      }
      
      // Check if name already exists (excluding current profile)
      const existingProfile = await Profile.findOne({
        userId,
        name: name.trim(),
        _id: { $ne: id }
      });
      
      if (existingProfile) {
        return res.status(409).json({
          success: false,
          message: 'Another profile with this name already exists'
        });
      }
      
      profile.name = name.trim();
    }
    
    // Update avatar if provided
    if (avatar !== undefined) {
      profile.avatar = avatar;
    }
    
    // Update type if provided
    if (type !== undefined && ['adult', 'kids'].includes(type)) {
      profile.type = type;
      // Update maturity rating based on type
      if (type === 'kids' && (!profile.preferences.maturityRating || profile.preferences.maturityRating === '18+')) {
        profile.preferences.maturityRating = '7+';
      }
    }
    
    // Update preferences if provided
    if (preferences !== undefined) {
      profile.preferences = {
        ...profile.preferences,
        ...preferences
      };
    }
    
    // Update PIN if provided
    if (pin !== undefined) {
      if (pin === null || pin === '') {
        profile.pin = null; // Remove PIN
      } else {
        await profile.setPin(pin);
      }
    }
    
    await profile.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: profile._id,
        name: profile.name,
        avatar: profile.avatar,
        type: profile.type,
        isActive: profile.isActive,
        preferences: profile.preferences,
        updatedAt: profile.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Delete a profile
const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Check if this is the last profile
    const profileCount = await Profile.countDocuments({ userId });
    
    if (profileCount <= 1) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete the last profile. You must have at least one profile.'
      });
    }
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // If deleting the active profile, activate another one
    if (profile.isActive) {
      const anotherProfile = await Profile.findOne({
        userId,
        _id: { $ne: id }
      }).sort({ createdAt: 1 });
      
      if (anotherProfile) {
        anotherProfile.isActive = true;
        await anotherProfile.save();
        
        // Update user's active profile
        await User.findByIdAndUpdate(userId, {
          activeProfile: anotherProfile._id
        });
      }
    }
    
    await Profile.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile',
      error: error.message
    });
  }
};

// Switch to a different profile
const switchProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { pin } = req.body; // Optional PIN for verification
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // Verify PIN if set
    if (profile.pin && !profile.verifyPin(pin)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }
    
    // Switch active profile
    const updatedProfile = await Profile.switchActiveProfile(userId, id);
    
    // Update user's active profile reference
    await User.findByIdAndUpdate(userId, {
      activeProfile: id
    });
    
    res.json({
      success: true,
      message: 'Profile switched successfully',
      profile: {
        id: updatedProfile._id,
        name: updatedProfile.name,
        avatar: updatedProfile.avatar,
        type: updatedProfile.type,
        isActive: updatedProfile.isActive
      }
    });
  } catch (error) {
    console.error('Error switching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to switch profile',
      error: error.message
    });
  }
};

// Get current active profile
const getActiveProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const profile = await Profile.findOne({ userId, isActive: true })
      .select('-pin');
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'No active profile found'
      });
    }
    
    res.json({
      success: true,
      profile: {
        id: profile._id,
        name: profile.name,
        avatar: profile.avatar,
        type: profile.type,
        isActive: profile.isActive,
        preferences: profile.preferences,
        watchHistoryCount: profile.watchHistoryCount,
        myListCount: profile.myListCount,
        totalWatchTime: profile.totalWatchTime,
        lastActivityAt: profile.lastActivityAt
      }
    });
  } catch (error) {
    console.error('Error fetching active profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active profile',
      error: error.message
    });
  }
};

// Get profile's watch history
const getWatchHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { limit = 20, page = 1 } = req.query;
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // Sort by watchedAt descending and paginate
    const sortedHistory = profile.watchHistory
      .sort((a, b) => b.watchedAt - a.watchedAt);
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = sortedHistory.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      profileId: id,
      history: paginatedHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(sortedHistory.length / limit),
        totalItems: sortedHistory.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch watch history',
      error: error.message
    });
  }
};

// Add to watch history
const addToWatchHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const watchData = req.body;
    
    // Validate required fields
    if (!watchData.contentId || !watchData.contentType || !watchData.title) {
      return res.status(400).json({
        success: false,
        message: 'contentId, contentType, and title are required'
      });
    }
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    await profile.addToWatchHistory(watchData);
    
    res.json({
      success: true,
      message: 'Added to watch history',
      completed: watchData.progress >= (watchData.duration || 0) * 0.9
    });
  } catch (error) {
    console.error('Error adding to watch history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to watch history',
      error: error.message
    });
  }
};

// Get continue watching list
const getContinueWatching = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    const continueWatching = profile.getContinueWatching();
    
    res.json({
      success: true,
      profileId: id,
      items: continueWatching,
      count: continueWatching.length
    });
  } catch (error) {
    console.error('Error fetching continue watching:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch continue watching list',
      error: error.message
    });
  }
};

// Get profile's my list
const getMyList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { limit = 50, page = 1 } = req.query;
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // Sort by addedAt descending and paginate
    const sortedList = profile.myList
      .sort((a, b) => b.addedAt - a.addedAt);
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedList = sortedList.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      profileId: id,
      myList: paginatedList,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(sortedList.length / limit),
        totalItems: sortedList.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching my list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch my list',
      error: error.message
    });
  }
};

// Add to my list
const addToMyList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const itemData = req.body;
    
    // Validate required fields
    if (!itemData.contentId || !itemData.contentType || !itemData.title) {
      return res.status(400).json({
        success: false,
        message: 'contentId, contentType, and title are required'
      });
    }
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    await profile.addToMyList(itemData);
    
    res.status(201).json({
      success: true,
      message: 'Added to My List'
    });
  } catch (error) {
    if (error.message === 'Content already in list') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Error adding to my list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to my list',
      error: error.message
    });
  }
};

// Remove from my list
const removeFromMyList = async (req, res) => {
  try {
    const { id, contentId } = req.params;
    const userId = req.user._id;
    
    const profile = await Profile.findOne({ _id: id, userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    await profile.removeFromMyList(contentId);
    
    res.json({
      success: true,
      message: 'Removed from My List'
    });
  } catch (error) {
    if (error.message === 'Content not found in list') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Error removing from my list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from my list',
      error: error.message
    });
  }
};

// Get default avatars
const getDefaultAvatars = async (req, res) => {
  try {
    const { type = 'adult' } = req.query;
    
    const avatars = Profile.getDefaultAvatars(type);
    
    res.json({
      success: true,
      type,
      avatars
    });
  } catch (error) {
    console.error('Error fetching avatars:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch avatars',
      error: error.message
    });
  }
};

// Get profile limits
const getProfileLimits = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    const currentCount = await Profile.countDocuments({ userId });
    const maxAllowed = user.maxProfiles || Profile.getMaxProfiles('standard');
    
    res.json({
      success: true,
      currentCount,
      maxAllowed,
      canCreate: currentCount < maxAllowed,
      remaining: Math.max(0, maxAllowed - currentCount)
    });
  } catch (error) {
    console.error('Error fetching profile limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile limits',
      error: error.message
    });
  }
};

module.exports = {
  getProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  switchProfile,
  getActiveProfile,
  getWatchHistory,
  addToWatchHistory,
  getContinueWatching,
  getMyList,
  addToMyList,
  removeFromMyList,
  getDefaultAvatars,
  getProfileLimits
};
