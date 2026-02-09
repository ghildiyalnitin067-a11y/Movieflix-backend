const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Firebase UID (primary identifier from Firebase Auth)
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  displayName: {
    type: String,
    trim: true
  },
  
  photoURL: {
    type: String
  },
  
  phoneNumber: {
    type: String
  },
  
  // User roles and permissions
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // User profile data
  profile: {
    firstName: String,
    lastName: String,
    bio: String,
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  
  // My List - Array of movie/show IDs that user has added to their list
  myList: [{
    movieId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    posterPath: {
      type: String
    },
    mediaType: {
      type: String,
      enum: ['movie', 'tv'],
      default: 'movie'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Watch History - Array of movies/shows the user has watched
  watchHistory: [{
    movieId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    posterPath: {
      type: String
    },
    genres: [{
      type: String
    }],
    duration: {
      type: Number,
      default: 120 // Default 2 hours in minutes
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    voteAverage: {
      type: Number
    }
  }],

  
  // Profile management
  maxProfiles: {
    type: Number,
    default: 4 // Default to 4 profiles (standard plan)
  },
  
  activeProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    default: null
  },
  
  // Subscription information
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'trial', 'none'],
      default: 'none'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired', 'trial', 'none'],
      default: 'none'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    trialStart: {
      type: Date
    },
    trialEnd: {
      type: Date
    }
  },
  
  // Metadata
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
  
}, {

  timestamps: true, // Automatically manage createdAt and updatedAt

  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance (email already has unique index from schema)
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware removed - timestamps: true handles createdAt and updatedAt automatically

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile && this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.displayName || this.email;
});

// Instance methods
userSchema.methods.toPublicProfile = function() {
  return {
    id: this._id,
    firebaseUid: this.firebaseUid,
    email: this.email,
    displayName: this.displayName,
    photoURL: this.photoURL,
    phoneNumber: this.phoneNumber,
    role: this.role,
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,
    profile: this.profile,
    fullName: this.fullName,
    myListCount: this.myList ? this.myList.length : 0,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Instance methods for My List
userSchema.methods.addToMyList = function(movieData) {
  const { movieId, title, posterPath, mediaType } = movieData;
  
  // Check if movie already exists in list
  const exists = this.myList.some(item => item.movieId === movieId);
  if (exists) {
    throw new Error('Movie already in list');
  }
  
  this.myList.push({
    movieId,
    title,
    posterPath,
    mediaType: mediaType || 'movie',
    addedAt: new Date()
  });
  
  return this.save();
};

userSchema.methods.removeFromMyList = function(movieId) {
  const initialLength = this.myList.length;
  this.myList = this.myList.filter(item => item.movieId !== movieId);
  
  if (this.myList.length === initialLength) {
    throw new Error('Movie not found in list');
  }
  
  return this.save();
};

userSchema.methods.isInMyList = function(movieId) {
  return this.myList.some(item => item.movieId === movieId);
};

userSchema.methods.getMyList = function() {
  return this.myList.sort((a, b) => b.addedAt - a.addedAt);
};

// Instance methods for Watch History
userSchema.methods.addToWatchHistory = function(movieData) {
  const { movieId, title, posterPath, genres, duration, voteAverage } = movieData;
  
  // Remove if already exists (to move to top)
  this.watchHistory = this.watchHistory.filter(item => item.movieId !== movieId);
  
  // Add to beginning
  this.watchHistory.unshift({
    movieId,
    title,
    posterPath,
    genres: genres || [],
    duration: duration || 120,
    watchedAt: new Date(),
    voteAverage
  });
  
  // Keep only last 50 items
  if (this.watchHistory.length > 50) {
    this.watchHistory = this.watchHistory.slice(0, 50);
  }
  
  return this.save();
};

userSchema.methods.getWatchHistory = function() {
  return this.watchHistory.sort((a, b) => b.watchedAt - a.watchedAt);
};

userSchema.methods.clearWatchHistory = function() {
  this.watchHistory = [];
  return this.save();
};


// Static methods
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
