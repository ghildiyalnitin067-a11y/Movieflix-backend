const { getAuth, getFirestore, getStorage } = require('../config/firebase');

/**
 * Firebase Service
 * Provides utility functions for Firebase Auth, Firestore, and Storage
 */

class FirebaseService {
  
  // ==================== AUTH SERVICES ====================
  
  /**
   * Get user by UID
   */
  async getUserByUid(uid) {
    try {
      const auth = getAuth();
      const userRecord = await auth.getUser(uid);
      return userRecord;
    } catch (error) {
      console.error('Error getting user by UID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      const auth = getAuth();
      const userRecord = await auth.getUserByEmail(email);
      return userRecord;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    try {
      const auth = getAuth();
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        phoneNumber: userData.phoneNumber,
        emailVerified: userData.emailVerified || false,
        disabled: userData.disabled || false
      });
      return userRecord;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(uid, updates) {
    try {
      const auth = getAuth();
      const userRecord = await auth.updateUser(uid, updates);
      return userRecord;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid) {
    try {
      const auth = getAuth();
      await auth.deleteUser(uid);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Set custom user claims (roles/permissions)
   */
  async setCustomUserClaims(uid, claims) {
    try {
      const auth = getAuth();
      await auth.setCustomUserClaims(uid, claims);
      return { success: true, claims };
    } catch (error) {
      console.error('Error setting custom claims:', error);
      throw error;
    }
  }

  /**
   * Generate password reset link
   */
  async generatePasswordResetLink(email, actionCodeSettings) {
    try {
      const auth = getAuth();
      const link = await auth.generatePasswordResetLink(email, actionCodeSettings);
      return link;
    } catch (error) {
      console.error('Error generating password reset link:', error);
      throw error;
    }
  }

  /**
   * Generate email verification link
   */
  async generateEmailVerificationLink(email, actionCodeSettings) {
    try {
      const auth = getAuth();
      const link = await auth.generateEmailVerificationLink(email, actionCodeSettings);
      return link;
    } catch (error) {
      console.error('Error generating email verification link:', error);
      throw error;
    }
  }

  /**
   * Revoke refresh tokens
   */
  async revokeRefreshTokens(uid) {
    try {
      const auth = getAuth();
      await auth.revokeRefreshTokens(uid);
      return { success: true, message: 'Tokens revoked successfully' };
    } catch (error) {
      console.error('Error revoking tokens:', error);
      throw error;
    }
  }

  // ==================== FIRESTORE SERVICES ====================

  /**
   * Add document to Firestore
   */
  async addDocument(collection, data) {
    try {
      const db = getFirestore();
      const docRef = await db.collection(collection).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  /**
   * Get document from Firestore
   */
  async getDocument(collection, docId) {
    try {
      const db = getFirestore();
      const doc = await db.collection(collection).doc(docId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * Update document in Firestore
   */
  async updateDocument(collection, docId, data) {
    try {
      const db = getFirestore();
      await db.collection(collection).doc(docId).update({
        ...data,
        updatedAt: new Date()
      });
      return { id: docId, ...data };
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete document from Firestore
   */
  async deleteDocument(collection, docId) {
    try {
      const db = getFirestore();
      await db.collection(collection).doc(docId).delete();
      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Query documents from Firestore
   */
  async queryDocuments(collection, conditions = [], orderBy = null, limit = null) {
    try {
      const db = getFirestore();
      let query = db.collection(collection);
      
      // Apply conditions
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
      
      // Apply ordering
      if (orderBy) {
        query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
      }
      
      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      const documents = [];
      
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  // ==================== STORAGE SERVICES ====================

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(filePath, destination, metadata = {}) {
    try {
      const bucket = getStorage().bucket();
      await bucket.upload(filePath, {
        destination: destination,
        metadata: {
          metadata: metadata
        }
      });
      
      // Get public URL
      const file = bucket.file(destination);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Long expiration
      });
      
      return {
        success: true,
        path: destination,
        url: url
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(filePath) {
    try {
      const bucket = getStorage().bucket();
      await bucket.file(filePath).delete();
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get file URL
   */
  async getFileUrl(filePath) {
    try {
      const bucket = getStorage().bucket();
      const file = bucket.file(filePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500'
      });
      return url;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseService();
