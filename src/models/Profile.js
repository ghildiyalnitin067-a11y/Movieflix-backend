const mongoose = require('mongoose');

// Default avatar options
const DEFAULT_AVATARS = {
  adult: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bandit',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe'
  ],
  kids: [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Baby1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Baby2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Baby3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Baby4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Baby5',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Baby6'
  ]
};

const profileSchema = new mongoose.Schema({
  // Reference to parent user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Profile basic info
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },

  avatar: {
    type: String,
    default: function() {
      // Return first avatar based on profile type
      return this.type === 'kids' ? DEFAULT_AVATARS.kids[0] : DEFAULT_AVATARS.adult[0];
    }
  },

  type: {
    type: String,
    enum: ['adult', 'kids'],
    default: 'adult'
  },

  // Is this the currently active profile?
  isActive: {
    type: Boolean,
    default: false
  },

  // Profile preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    maturityRating: {
      type: String,
      enum: ['all', '7+', '13+', '16+', '18+'],
      default: function() {
        return this.type === 'kids' ? '7+' : '18+';
      }
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    subtitles: {
      type: Boolean,
      default: true
    },
    subtitleLanguage: {
      type: String,
      default: 'en'
    }
  },

  // Watch history for this profile
  watchHistory: [{
    contentId: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      enum: ['movie', 'tv', 'trailer'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    posterPath: {
      type: String
    },
    backdropPath: {
      type: String
    },
    progress: {
      type: Number, // seconds watched
      default: 0
    },
    duration: {
      type: Number, // total duration in seconds
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    season: {
      type: Number // for TV shows
    },
    episode: {
      type: Number // for TV shows
    }
  }],

  // My List for this profile (separate from user's myList)
  myList: [{
    contentId: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      enum: ['movie', 'tv'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    posterPath: {
      type: String
    },
    backdropPath: {
      type: String
    },
    overview: {
      type: String
    },
    voteAverage: {
      type: Number
    },
    releaseDate: {
      type: String
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // PIN protection for kids profiles switching to adult
  pin: {
    type: String, // hashed PIN
    default: null
  },

  // Stats
  totalWatchTime: {
    type: Number, // in minutes
    default: 0
  },

  lastActivityAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
profileSchema.index({ userId: 1, isActive: 1 });
profileSchema.index({ userId: 1, name: 1 });
profileSchema.index({ 'watchHistory.watchedAt': -1 });

// Virtual for watch history count
profileSchema.virtual('watchHistoryCount').get(function() {
  return this.watchHistory ? this.watchHistory.length : 0;
});

// Virtual for my list count
profileSchema.virtual('myListCount').get(function() {
  return this.myList ? this.myList.length : 0;
});

// Virtual for completion rate
profileSchema.virtual('completionRate').get(function() {
  if (!this.watchHistory || this.watchHistory.length === 0) return 0;
  const completed = this.watchHistory.filter(item => item.completed).length;
  return Math.round((completed / this.watchHistory.length) * 100);
});

// Pre-save middleware
profileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update lastActivityAt on significant changes
  if (this.isModified('watchHistory') || this.isModified('myList')) {
    this.lastActivityAt = new Date();
  }
  
  next();
});

// Instance method: Add to watch history
profileSchema.methods.addToWatchHistory = async function(watchData) {
  const { contentId, contentType, title, posterPath, backdropPath, progress, duration, season, episode } = watchData;
  
  // Check if already in history
  const existingIndex = this.watchHistory.findIndex(
    item => item.contentId === contentId && item.contentType === contentType
  );
  
  const completed = progress >= duration * 0.9; // 90% watched = completed
  
  if (existingIndex >= 0) {
    // Update existing entry
    this.watchHistory[existingIndex].progress = progress;
    this.watchHistory[existingIndex].duration = duration;
    this.watchHistory[existingIndex].completed = completed;
    this.watchHistory[existingIndex].watchedAt = new Date();
    if (season) this.watchHistory[existingIndex].season = season;
    if (episode) this.watchHistory[existingIndex].episode = episode;
  } else {
    // Add new entry
    this.watchHistory.push({
      contentId,
      contentType,
      title,
      posterPath,
      backdropPath,
      progress,
      duration,
      completed,
      watchedAt: new Date(),
      season,
      episode
    });
  }
  
  // Update total watch time
  this.totalWatchTime = Math.floor(
    this.watchHistory.reduce((total, item) => total + (item.progress || 0), 0) / 60
  );
  
  // Keep only last 100 entries to prevent document from growing too large
  if (this.watchHistory.length > 100) {
    this.watchHistory = this.watchHistory
      .sort((a, b) => b.watchedAt - a.watchedAt)
      .slice(0, 100);
  }
  
  return this.save();
};

// Instance method: Get continue watching list
profileSchema.methods.getContinueWatching = function() {
  return this.watchHistory
    .filter(item => !item.completed && item.progress > 0)
    .sort((a, b) => b.watchedAt - a.watchedAt)
    .slice(0, 20); // Last 20 items
};

// Instance method: Add to my list
profileSchema.methods.addToMyList = async function(itemData) {
  const { contentId, contentType, title, posterPath, backdropPath, overview, voteAverage, releaseDate } = itemData;
  
  // Check if already exists
  const exists = this.myList.some(item => item.contentId === contentId);
  if (exists) {
    throw new Error('Content already in list');
  }
  
  this.myList.push({
    contentId,
    contentType,
    title,
    posterPath,
    backdropPath,
    overview,
    voteAverage,
    releaseDate,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method: Remove from my list
profileSchema.methods.removeFromMyList = async function(contentId) {
  const initialLength = this.myList.length;
  this.myList = this.myList.filter(item => item.contentId !== contentId);
  
  if (this.myList.length === initialLength) {
    throw new Error('Content not found in list');
  }
  
  return this.save();
};

// Instance method: Check if in my list
profileSchema.methods.isInMyList = function(contentId) {
  return this.myList.some(item => item.contentId === contentId);
};

// Instance method: Set PIN
profileSchema.methods.setPin = async function(pin) {
  if (pin && pin.length >= 4 && pin.length <= 6) {
    // Simple hash - in production use bcrypt
    this.pin = Buffer.from(pin).toString('base64');
    return this.save();
  }
  throw new Error('PIN must be 4-6 digits');
};

// Instance method: Verify PIN
profileSchema.methods.verifyPin = function(pin) {
  if (!this.pin) return true; // No PIN set
  const hashedPin = Buffer.from(pin).toString('base64');
  return this.pin === hashedPin;
};

// Static method: Get default avatars
profileSchema.statics.getDefaultAvatars = function(type = 'adult') {
  return DEFAULT_AVATARS[type] || DEFAULT_AVATARS.adult;
};

// Static method: Get max profiles per plan
profileSchema.statics.getMaxProfiles = function(planName) {
  const limits = {
    'basic': 2,
    'standard': 4,
    'premium': 6,
    'mobile': 1
  };
  return limits[planName?.toLowerCase()] || 4; // Default to 4
};

// Static method: Get all profiles for user
profileSchema.statics.getUserProfiles = function(userId) {
  return this.find({ userId }).sort({ createdAt: 1 });
};

// Static method: Get active profile for user
profileSchema.statics.getActiveProfile = function(userId) {
  return this.findOne({ userId, isActive: true });
};

// Static method: Switch active profile
profileSchema.statics.switchActiveProfile = async function(userId, profileId) {
  // Deactivate all profiles for this user
  await this.updateMany(
    { userId },
    { $set: { isActive: false } }
  );
  
  // Activate the selected profile
  const profile = await this.findOneAndUpdate(
    { _id: profileId, userId },
    { $set: { isActive: true, lastActivityAt: new Date() } },
    { new: true }
  );
  
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  return profile;
};

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
