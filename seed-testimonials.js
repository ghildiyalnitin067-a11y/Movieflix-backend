const mongoose = require('mongoose');
const Testimonial = require('./src/models/Testimonial');
require('dotenv').config();

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Movie Enthusiast",
    rating: 5,
    text: "MovieFlix has completely transformed my movie nights! The collection is incredible and the streaming quality is top-notch. I love the personalized recommendations!",
    isApproved: true
  },
  {
    name: "Michael Chen",
    role: "Film Critic",
    rating: 5,
    text: "As a film critic, I've used many streaming platforms. MovieFlix stands out with its curated selection and seamless user experience. The genre-based recommendations are spot on!",
    isApproved: true
  },
  {
    name: "Emily Rodriguez",
    role: "Binge Watcher",
    rating: 5,
    text: "I can't get enough of MovieFlix! The interface is so intuitive and I always find something new to watch. The 'My List' feature helps me keep track of everything!",
    isApproved: true
  },
  {
    name: "David Kim",
    role: "Tech Reviewer",
    rating: 5,
    text: "The streaming quality and loading speeds are impressive. MovieFlix works flawlessly across all my devices. Best investment for entertainment!",
    isApproved: true
  },
  {
    name: "Jessica Williams",
    role: "Family User",
    rating: 5,
    text: "Perfect for family movie nights! There's something for everyone - from kids' animations to classic dramas. The parental controls give me peace of mind.",
    isApproved: true
  }
];

const seedTestimonials = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ghildiyalnitin2007:nitin2006@movieflix.ddljsh3.mongodb.net/movieflix?retryWrites=true&w=majority&appName=movieflix';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');


    // Clear existing testimonials
    await Testimonial.deleteMany({});
    console.log('🗑️  Cleared existing testimonials');

    // Add new testimonials
    for (const testimonial of testimonials) {
      // Generate avatar URL
      testimonial.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=e50914&color=fff&size=150`;
      
      const newTestimonial = new Testimonial(testimonial);
      await newTestimonial.save();
      console.log(`✅ Added testimonial from ${testimonial.name}`);
    }

    console.log('\n🎉 Successfully seeded testimonials!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding testimonials:', error);
    process.exit(1);
  }
};

seedTestimonials();
