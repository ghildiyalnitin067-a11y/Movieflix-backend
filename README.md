# Movieflix Backend 🚀

A powerful Node.js backend for the Movieflix streaming application. This backend handles user authentication, movie management, watch history, and more using Firebase for auth and MongoDB for data storage.

## ✨ Features

- 🔐 **User Authentication** - Sign up, login, and Google authentication via Firebase
- 👤 **User Management** - Profile management with roles (user/admin)
- 📋 **My List** - Save movies to your personal watchlist
- 📺 **Watch History** - Track your viewing history
- 💳 **Subscription Plans** - Manage subscription tiers (Basic, Standard, Premium)
- ⭐ **Testimonials** - User reviews and feedback
- 🔒 **Secure API** - Protected routes with Firebase token verification

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: Firebase Admin SDK
- **API Documentation**: RESTful JSON API

## 📋 Prerequisites

Before you begin, make sure you have installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB Atlas Account](https://www.mongodb.com/atlas) (for database)
- [Firebase Project](https://console.firebase.google.com/) (for authentication)

## 🚀 Quick Start

### 1. Clone the Repository

```
bash
git clone <your-repo-url>
cd Movieflix/backend
```

### 2. Install Dependencies

```
bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory and add the following:

```
env
# Required for Production
PORT=5001
NODE_ENV=development

# MongoDB Connection String
# Get this from MongoDB Atlas > Connect > Connect your application
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/movieflix

# Firebase Configuration
# Get these from Firebase Console > Project Settings > General > Your apps
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# Optional: Custom Frontend URL (for production CORS)
FRONTEND_URL=https://your-frontend.vercel.app
```

> 💡 **Where to get Firebase credentials:**
> 1. Go to [Firebase Console](https://console.firebase.google.com/)
> 2. Select your project
> 3. Go to **Project Settings** (gear icon)
> 4. Scroll to **Your apps** and click the web icon (</>)
> 5. Copy the `apiKey` value for FIREBASE_API_KEY
> 6. Copy the `projectId` value for FIREBASE_PROJECT_ID
> 7. Go to **Service Accounts** > **Generate new private key** for FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL

### 4. Run the Server

**Development Mode (with auto-restart):**
```
bash
npm run dev
```

**Production Mode:**
```
bash
npm start
```

The server will start at `http://localhost:5001`

## 📚 API Endpoints

### Health Check
- `GET /` - Server status
- `GET /api/health` - Detailed health check

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google-login` - Login with Google
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Plans
- `GET /api/plans` - Get all subscription plans
- `POST /api/plans` - Create plan (admin only)
- `PUT /api/plans/:id` - Update plan (admin only)
- `DELETE /api/plans/:id` - Delete plan (admin only)

### My List
- `GET /api/my-list` - Get user's watchlist
- `POST /api/my-list` - Add movie to watchlist
- `DELETE /api/my-list/:id` - Remove from watchlist

### Watch History
- `GET /api/history` - Get watch history
- `POST /api/history` - Add to watch history
- `DELETE /api/history` - Clear watch history

### Testimonials
- `GET /api/testimonials` - Get all testimonials
- `POST /api/testimonials` - Create testimonial
- `PUT /api/testimonials/:id` - Update testimonial
- `DELETE /api/testimonials/:id` - Delete testimonial

## 🔧 Deployment

### Deploy to Render

1. **Push your code to GitHub**
2. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" > "Web Service"
   - Connect your GitHub repository
3. **Configure the service**
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add Environment Variables**
   - Add all the variables from your `.env` file
   - Make sure to set `NODE_ENV=production`
5. **Deploy** - Click "Create Web Service"

### Deploy to Vercel (Frontend)

Your frontend is already deployed at: https://movieflix-a11111-ui.vercel.app/

The backend CORS is configured to allow requests from this URL.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify your environment variables are correct
3. Make sure MongoDB Atlas cluster is running
4. Check Firebase project settings

---

<p align="center">Made with ❤️ for Movieflix</p>
