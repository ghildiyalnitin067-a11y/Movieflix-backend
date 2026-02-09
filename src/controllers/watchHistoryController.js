const WatchHistory = require('../models/WatchHistory');

/**
 * Watch History Controller
 * Handles watch history operations with separate collection per user
 */

// Get watch history for current user
const getWatchHistory = async (req, res) => {
  try {
    const userId = req.user.uid;
    const userEmail = req.user.email || 'unknown@example.com';
    
    console.log('Getting watch history for user:', userId, userEmail);
    
    // Get or create watch history document
    const watchHistory = await WatchHistory.getOrCreate(userId, userEmail);
    const history = watchHistory.getHistory();

    res.json({
      status: 'success',
      data: {
        watchHistory: history,
        total: history.length
      }
    });
  } catch (error) {
    console.error('Get watch history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching watch history'
    });
  }
};

// Add to watch history
const addToWatchHistory = async (req, res) => {
  try {
    const userId = req.user.uid;
    const userEmail = req.user.email || 'unknown@example.com';
    const { movieId, title, posterPath, genres, duration, voteAverage } = req.body;

    if (!movieId || !title) {
      return res.status(400).json({
        status: 'error',
        message: 'Movie ID and title are required'
      });
    }

    console.log('Adding to watch history:', { userId, userEmail, movieId, title });

    // Get or create watch history document
    const watchHistory = await WatchHistory.getOrCreate(userId, userEmail);
    
    // Add movie to history
    await watchHistory.addMovie({
      movieId,
      title,
      posterPath,
      genres,
      duration,
      voteAverage
    });

    const updatedHistory = watchHistory.getHistory();

    res.json({
      status: 'success',
      message: 'Added to watch history',
      data: {
        watchHistory: updatedHistory,
        total: updatedHistory.length
      }
    });
  } catch (error) {
    console.error('Add to watch history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding to watch history'
    });
  }
};

// Clear watch history
const clearWatchHistory = async (req, res) => {
  try {
    const userId = req.user.uid;
    const userEmail = req.user.email || 'unknown@example.com';
    
    console.log('Clearing watch history for user:', userId);

    // Get or create watch history document
    const watchHistory = await WatchHistory.getOrCreate(userId, userEmail);
    
    // Clear history
    await watchHistory.clearHistory();

    res.json({
      status: 'success',
      message: 'Watch history cleared successfully',
      data: {
        watchHistory: [],
        total: 0
      }
    });
  } catch (error) {
    console.error('Clear watch history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error clearing watch history'
    });
  }
};

// Get watch history by user ID (admin only)
const getUserWatchHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const watchHistory = await WatchHistory.findOne({ userId });
    
    if (!watchHistory) {
      return res.json({
        status: 'success',
        data: {
          watchHistory: [],
          total: 0
        }
      });
    }

    const history = watchHistory.getHistory();

    res.json({
      status: 'success',
      data: {
        watchHistory: history,
        total: history.length,
        userEmail: watchHistory.userEmail
      }
    });
  } catch (error) {
    console.error('Get user watch history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user watch history'
    });
  }
};

module.exports = {
  getWatchHistory,
  addToWatchHistory,
  clearWatchHistory,
  getUserWatchHistory
};
