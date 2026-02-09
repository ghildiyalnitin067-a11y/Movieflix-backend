const Testimonial = require('../models/Testimonial');

// Get all approved testimonials
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials'
    });
  }
};

// Create new testimonial
const createTestimonial = async (req, res) => {
  try {
    const { name, role, rating, text } = req.body;

    // Validation
    if (!name || !rating || !text) {
      return res.status(400).json({
        success: false,
        message: 'Name, rating, and review text are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Review text must be less than 500 characters'
      });
    }

    // Generate avatar URL based on name
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e50914&color=fff&size=150`;

    const testimonial = new Testimonial({
      name: name.trim(),
      role: role?.trim() || 'MovieFlix User',
      rating,
      text: text.trim(),
      avatar,
      isApproved: true // Auto-approve for immediate display

    });

    await testimonial.save();

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted for approval.',
      data: {
        id: testimonial._id,
        name: testimonial.name,
        createdAt: testimonial.createdAt
      }
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
};

// Get all testimonials (admin only)
const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    console.error('Get all testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials'
    });
  }
};

// Approve testimonial (admin only)
const approveTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    );

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      message: 'Testimonial approved successfully',
      data: testimonial
    });
  } catch (error) {
    console.error('Approve testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve testimonial'
    });
  }
};

// Delete testimonial (admin only)
const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete testimonial'
    });
  }
};

module.exports = {
  getTestimonials,
  createTestimonial,
  getAllTestimonials,
  approveTestimonial,
  deleteTestimonial
};
