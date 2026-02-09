const mongoose = require('mongoose');

const watchHistoryItemSchema = new mongoose.Schema({
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
    default: 120
  },
  voteAverage: {
    type: Number
  },
  watchedAt: {
    type: Date,
    default: Date.now
  }
});

const watchHistorySchema = new mongoose.Schema({
  // User reference - can be Firebase UID or email-based
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // User email for easy identification
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  
  // Array of watched movies
  history: [watchHistoryItemSchema],
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
watchHistorySchema.index({ userId: 1, 'history.watchedAt': -1 });

// Static method to get or create watch history for a user
watchHistorySchema.statics.getOrCreate = async function(userId, userEmail) {
  let watchHistory = await this.findOne({ userId });
  
  if (!watchHistory) {
    watchHistory = new this({
      userId,
      userEmail,
      history: []
    });
    await watchHistory.save();
  }
  
  return watchHistory;
};

// Instance method to add movie to history
watchHistorySchema.methods.addMovie = async function(movieData) {
  const { movieId, title, posterPath, genres, duration, voteAverage } = movieData;
  
  // Remove if already exists (to move to top)
  this.history = this.history.filter(item => item.movieId !== movieId);
  
  // Add to beginning
  this.history.unshift({
    movieId,
    title,
    posterPath,
    genres: genres || [],
    duration: duration || 120,
    voteAverage,
    watchedAt: new Date()
  });
  
  // Keep only last 50 items
  if (this.history.length > 50) {
    this.history = this.history.slice(0, 50);
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to get sorted history
watchHistorySchema.methods.getHistory = function() {
  return this.history.sort((a, b) => b.watchedAt - a.watchedAt);
};

// Instance method to clear history
watchHistorySchema.methods.clearHistory = async function() {
  this.history = [];
  this.lastUpdated = new Date();
  return this.save();
};

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

module.exports = WatchHistory;
