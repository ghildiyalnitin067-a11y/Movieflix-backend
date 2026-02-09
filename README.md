# Node.js Backend with MongoDB & Firebase

A Node.js backend API built with Express.js, MongoDB, and Firebase for React frontend integration.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Firebase project

### Installation

```bash
npm install
```

### Environment Setup

1. **Copy the environment file:**
```bash
cp .env.example .env
```

2. **Configure MongoDB:**
   - For MongoDB Atlas: Get your connection string from MongoDB Atlas dashboard
   - For local MongoDB: Use `mongodb://localhost:27017/your_database_name`

3. **Configure Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase-service-account.json` in the config folder
   - Or use environment variables from the downloaded JSON

4. **Update .env file with your credentials:**
```env
MONGODB_URI=your_mongodb_connection_string
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
# OR use individual Firebase env variables
```

### Initialize Permanent Admin

The system has a built-in permanent admin that cannot be deleted or have their role changed:

```bash
npm run init-admin
```

**Default Permanent Admin:**
- Email: `ghildiyalnitin2007@gmail.com`
- Role: `admin` (cannot be changed)
- Status: Always active

To add more permanent admins, edit `src/config/admin.js`:
```javascript
const ADMIN_EMAILS = [
  'ghildiyalnitin2007@gmail.com',
  'another-admin@example.com'  // Add more here
];
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── admin.js           # Permanent admin configuration
│   │   ├── db.js              # MongoDB connection
│   │   └── firebase.js        # Firebase configuration
│   ├── controllers/
│   │   ├── mainController.js  # Main API endpoints
│   │   └── userController.js  # User management
│   ├── middleware/
│   │   └── auth.js            # Firebase auth middleware
│   ├── models/
│   │   └── User.js            # MongoDB User model
│   ├── routes/
│   │   ├── index.js           # Main routes
│   │   └── userRoutes.js      # User routes
│   ├── services/
│   │   └── firebaseService.js # Firebase utilities
│   └── utils/
├── .env                       # Environment variables
├── .env.example               # Example environment file
├── init-admin.js              # Admin initialization script
├── server.js                  # Main entry point
└── package.json
```

## 🔗 API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message & server info |
| GET | `/api/status` | Server status & uptime |
| GET | `/api/health` | Health check |
| POST | `/api/data` | Example data submission |

### Protected Endpoints (Firebase Authentication Required)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users/me` | Get current user profile | Any authenticated user |
| PUT | `/api/users/me` | Update current user profile | Any authenticated user |
| GET | `/api/users/search?q=query` | Search users | Any authenticated user |
| GET | `/api/users` | Get all users | Admin, Moderator |
| GET | `/api/users/:id` | Get user by ID | Admin, Moderator |
| PUT | `/api/users/:id/role` | Update user role | Admin only |
| DELETE | `/api/users/:id` | Delete user | Admin only |

## 👑 Permanent Admin System

The backend includes a **permanent admin** system for critical administrative access:

### Features:
- ✅ **Automatic Admin Assignment**: When `ghildiyalnitin2007@gmail.com` logs in, they automatically get `admin` role
- ✅ **Role Protection**: Permanent admins cannot have their role changed to `user` or `moderator`
- ✅ **Deletion Protection**: Permanent admins cannot be deleted from the system
- ✅ **Access Override**: Permanent admins bypass role checks and always have full access

### How It Works:
1. When a user with the permanent admin email signs in via Firebase
2. The auth middleware automatically assigns/ensures `admin` role
3. Any attempt to change their role or delete them is blocked with a 403 error
4. They have unrestricted access to all admin endpoints

### Configuration:
Edit `src/config/admin.js` to manage permanent admins:
```javascript
const ADMIN_EMAILS = [
  'ghildiyalnitin2007@gmail.com'  // Add more emails as needed
];
```

## 🔐 Authentication

This backend uses Firebase Authentication. To access protected endpoints:

1. **Get Firebase ID Token** from your React frontend:
```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
const idToken = await user.getIdToken();
```

2. **Include token in API requests:**
```javascript
fetch('http://localhost:5000/api/users/me', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});
```

## 🌐 Connecting React Frontend

### 1. Install Firebase in your React app:
```bash
npm install firebase
```

### 2. Initialize Firebase in React:
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 3. Make authenticated API calls:
```javascript
import { auth } from './firebase';

const fetchUserProfile = async () => {
  const user = auth.currentUser;
  if (!user) return;
  
  const idToken = await user.getIdToken();
  
  const response = await fetch('http://localhost:5000/api/users/me', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  const data = await response.json();
  return data;
};
```

## 🗄️ Database Models

### User Model
- `firebaseUid` (String, unique) - Firebase user ID
- `email` (String, unique) - User email
- `displayName` (String) - Display name
- `photoURL` (String) - Profile photo URL
- `role` (String) - User role: 'user', 'admin', 'moderator'
- `isActive` (Boolean) - Account status
- `profile` (Object) - Extended profile data
- `lastLoginAt` (Date) - Last login timestamp
- `createdAt` (Date) - Account creation timestamp

## 🔥 Firebase Services

The backend includes utilities for:
- **Authentication**: Verify tokens, manage users, custom claims
- **Firestore**: Database operations (add, get, update, delete, query)
- **Storage**: File upload, download, delete operations

## 🛠️ Next Steps

You can now add:
- Additional MongoDB models and controllers
- More Firebase features (Cloud Messaging, Analytics)
- File upload endpoints
- Email services
- Payment integration
- Real-time features with Socket.io
- API rate limiting
- Input validation with Joi or express-validator

## 📦 Installed Packages

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **firebase-admin**: Firebase Admin SDK
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **morgan**: HTTP request logging
- **nodemon**: Development auto-reload

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Check your MongoDB URI in .env
- Ensure MongoDB is running (if local)
- Whitelist your IP in MongoDB Atlas (if using Atlas)

### Firebase Authentication Issues
- Verify your service account credentials
- Check if Firebase project is properly configured
- Ensure token is not expired in frontend

### CORS Issues
- The backend is configured to allow all origins in development
- For production, update CORS settings in server.js

### Admin Initialization Issues
- Run `npm run init-admin` to ensure admin is in database
- Check MongoDB connection in .env file
- Verify admin email in `src/config/admin.js`
