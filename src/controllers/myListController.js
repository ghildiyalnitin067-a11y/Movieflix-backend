const User = require('../models/User');

/**
 * Get user's My List
 * GET /api/mylist
 */
const getMyList = async (req, res) => {
  try {
    const user = req.userData;
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Please sign in to access your list'
      });
    }
    
    const myList = user.getMyList();
    
    res.json({
      success: true,
      count: myList.length,
      data: myList
    });
  } catch (error) {
    console.error('Error getting my list:', error);
    res.status(500).json({ 
      error: 'Failed to get my list',
      message: error.message 
    });
  }
};

/**
 * Add movie to My List
 * POST /api/mylist
 */
const addToMyList = async (req, res) => {
  try {
    const { movieId, title, posterPath, mediaType } = req.body;
    
    // Validate required fields
    if (!movieId || !title) {
      return res.status(400).json({ 
        error: 'movieId and title are required' 
      });
    }
    
    const user = req.userData;
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Please sign in to add movies to your list'
      });
    }
    
    // Check if already in list
    if (user.isInMyList(movieId)) {
      return res.status(409).json({ 
        error: 'Movie already in list',
        message: 'This item is already in your list' 
      });
    }
    
    // Add to list
    await user.addToMyList({
      movieId,
      title,
      posterPath,
      mediaType
    });
    
    res.status(201).json({
      success: true,
      message: 'Added to My List',
      data: {
        movieId,
        title,
        posterPath,
        mediaType: mediaType || 'movie',
        addedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error adding to my list:', error);
    res.status(500).json({ 
      error: 'Failed to add to my list',
      message: error.message 
    });
  }
};

/**
 * Remove movie from My List
 * DELETE /api/mylist/:movieId
 */
const removeFromMyList = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const user = req.userData;
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Please sign in to remove movies from your list'
      });
    }
    
    // Check if in list
    if (!user.isInMyList(movieId)) {
      return res.status(404).json({ 
        error: 'Movie not found in list',
        message: 'This item is not in your list' 
      });
    }
    
    // Remove from list
    await user.removeFromMyList(movieId);
    
    res.json({
      success: true,
      message: 'Removed from My List',
      movieId
    });
  } catch (error) {
    console.error('Error removing from my list:', error);
    res.status(500).json({ 
      error: 'Failed to remove from my list',
      message: error.message 
    });
  }
};

/**
 * Check if movie is in My List
 * GET /api/mylist/check/:movieId
 */
const checkInMyList = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const user = req.userData;
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Please sign in to check your list'
      });
    }
    
    const isInList = user.isInMyList(movieId);
    
    res.json({
      success: true,
      movieId,
      isInList
    });
  } catch (error) {
    console.error('Error checking my list:', error);
    res.status(500).json({ 
      error: 'Failed to check my list',
      message: error.message 
    });
  }
};

/**
 * Clear entire My List
 * DELETE /api/mylist
 */
const clearMyList = async (req, res) => {
  try {
    const user = req.userData;
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Please sign in to clear your list'
      });
    }
    
    user.myList = [];
    await user.save();
    
    res.json({
      success: true,
      message: 'My List cleared',
      count: 0
    });
  } catch (error) {
    console.error('Error clearing my list:', error);
    res.status(500).json({ 
      error: 'Failed to clear my list',
      message: error.message 
    });
  }
};

module.exports = {
  getMyList,
  addToMyList,
  removeFromMyList,
  checkInMyList,
  clearMyList
};
