// Firestore Service
// Manages all Firestore operations for user data, achievements, chat history, and recipes
import { getFirestore } from '../config/firebase.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

export class FirestoreService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    try {
      this.db = getFirestore();
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Firestore:', error);
    }
  }

  getDb() {
    if (!this.db) {
      this.db = getFirestore();
    }

    return this.db;
  }

  getUserRef(uid) {
    return doc(this.getDb(), 'users', uid);
  }

  getUserSubcollectionRef(uid, subcollectionName) {
    return collection(this.getDb(), 'users', uid, subcollectionName);
  }

  /**
   * USERS COLLECTION
   * Stores user profile information
   */

  /**
   * Get user profile
   * @param {string} uid - User ID
   */
  async getUserProfile(uid) {
    try {
      const userSnapshot = await getDoc(this.getUserRef(uid));
      return userSnapshot.exists() ? userSnapshot.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Create or update user profile
   * @param {string} uid - User ID
   * @param {Object} profileData - User profile data
   */
  async saveUserProfile(uid, profileData) {
    try {
      const dataToSave = {
        ...profileData,
        updatedAt: serverTimestamp(),
      };

      const existingSnapshot = await getDoc(this.getUserRef(uid));
      if (!existingSnapshot.exists()) {
        dataToSave.createdAt = serverTimestamp();
      }

      await setDoc(this.getUserRef(uid), dataToSave, { merge: true });
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  }

  /**
   * ONBOARDING DATA
   * Stores onboarding form responses
   */

  /**
   * Save onboarding data (steps 1-4)
   * @param {string} uid - User ID
   * @param {Object} onboardingData - Onboarding form data
   */
  async saveOnboardingData(uid, onboardingData) {
    try {
      const onboardingRef = doc(this.getDb(), 'users', uid, 'onboarding', 'data');

      await setDoc(onboardingRef, {
        ...onboardingData,
        completedAt: serverTimestamp(),
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      return false;
    }
  }

  /**
   * Get onboarding data
   * @param {string} uid - User ID
   */
  async getOnboardingData(uid) {
    try {
      const onboardingRef = doc(this.getDb(), 'users', uid, 'onboarding', 'data');
      const snapshot = await getDoc(onboardingRef);
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return null;
    }
  }

  /**
   * CHAT HISTORY
   * Stores conversation history with AI
   */

  /**
   * Add message to chat history
   * @param {string} uid - User ID
   * @param {Object} message - Message object {role, content, timestamp}
   */
  async addChatMessage(uid, message) {
    try {
      const chatRef = this.getUserSubcollectionRef(uid, 'chatHistory');

      const messageToSave = {
        ...message,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(chatRef, messageToSave);
      return docRef.id;
    } catch (error) {
      console.error('Error adding chat message:', error);
      return null;
    }
  }

  /**
   * Get chat history
   * @param {string} uid - User ID
   * @param {number} limit - Number of messages to retrieve (default: 50)
   */
  async getChatHistory(uid, maxResults = 50) {
    try {
      const chatRef = this.getUserSubcollectionRef(uid, 'chatHistory');
      const snapshot = await getDocs(query(chatRef, orderBy('timestamp', 'desc'), limit(maxResults)));

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
      })).reverse();
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  /**
   * Listen to chat history in real-time
   * @param {string} uid - User ID
   * @param {Function} callback - Function to call when data changes
   */
  onChatHistoryChange(uid, callback) {
    try {
      const chatRef = this.getUserSubcollectionRef(uid, 'chatHistory');

      return onSnapshot(query(chatRef, orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
          const messages = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
            }))
            .reverse();
          callback(messages);
        }, (error) => {
          console.error('Error listening to chat history:', error);
          callback([]);
        });
    } catch (error) {
      console.error('Error setting up chat history listener:', error);
    }
  }

  /**
   * RECIPES
   * Stores personalized recipes for user
   */

  /**
   * Save recipe
   * @param {string} uid - User ID
   * @param {Object} recipe - Recipe object
   */
  async saveRecipe(uid, recipe) {
    try {
      const recipesRef = this.getUserSubcollectionRef(uid, 'recipes');

      const recipeToSave = {
        ...recipe,
        createdAt: recipe.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (recipe.id) {
        // Update existing recipe
        await setDoc(doc(recipesRef, recipe.id), recipeToSave, { merge: true });
        return recipe.id;
      } else {
        // Create new recipe
        const docRef = await addDoc(recipesRef, recipeToSave);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      return null;
    }
  }

  /**
   * Get all recipes for user
   * @param {string} uid - User ID
   */
  async getRecipes(uid) {
    try {
      const recipesRef = this.getUserSubcollectionRef(uid, 'recipes');
      const snapshot = await getDocs(query(recipesRef, orderBy('createdAt', 'desc')));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
      }));
    } catch (error) {
      console.error('Error getting recipes:', error);
      return [];
    }
  }

  /**
   * Listen to recipes in real-time
   * @param {string} uid - User ID
   * @param {Function} callback - Function to call when data changes
   */
  onRecipesChange(uid, callback) {
    try {
      const recipesRef = this.getUserSubcollectionRef(uid, 'recipes');

      return onSnapshot(query(recipesRef, orderBy('createdAt', 'desc')), (snapshot) => {
        const recipes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
        }));
        callback(recipes);
      }, (error) => {
        console.error('Error listening to recipes:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up recipes listener:', error);
    }
  }

  /**
   * ACHIEVEMENTS
   * Stores user achievements and milestones
   */

  /**
   * Add achievement
   * @param {string} uid - User ID
   * @param {Object} achievement - Achievement object
   */
  async addAchievement(uid, achievement) {
    try {
      const achievementsRef = this.getUserSubcollectionRef(uid, 'achievements');

      const achievementToSave = {
        ...achievement,
        unlockedAt: serverTimestamp(),
      };

      const docRef = await addDoc(achievementsRef, achievementToSave);
      return docRef.id;
    } catch (error) {
      console.error('Error adding achievement:', error);
      return null;
    }
  }

  /**
   * Get all achievements for user
   * @param {string} uid - User ID
   */
  async getAchievements(uid) {
    try {
      const achievementsRef = this.getUserSubcollectionRef(uid, 'achievements');
      const snapshot = await getDocs(query(achievementsRef, orderBy('unlockedAt', 'desc')));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        unlockedAt: doc.data().unlockedAt?.toDate?.() || new Date(doc.data().unlockedAt)
      }));
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  /**
   * Listen to achievements in real-time
   * @param {string} uid - User ID
   * @param {Function} callback - Function to call when data changes
   */
  onAchievementsChange(uid, callback) {
    try {
      const achievementsRef = this.getUserSubcollectionRef(uid, 'achievements');

      return onSnapshot(query(achievementsRef, orderBy('unlockedAt', 'desc')), (snapshot) => {
        const achievements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          unlockedAt: doc.data().unlockedAt?.toDate?.() || new Date(doc.data().unlockedAt)
        }));
        callback(achievements);
      }, (error) => {
        console.error('Error listening to achievements:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up achievements listener:', error);
    }
  }

  /**
   * Delete data with error handling
   * @param {string} collectionPath - Path to collection
   * @param {string} docId - Document ID
   */
  async deleteDocument(collectionPath, docId) {
    try {
      await deleteDoc(doc(this.getDb(), collectionPath, docId));
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * Save form progress temporarily
   * @param {string} userId - User ID
   * @param {object} formData - Form data to save
   */
  async saveFormProgress(userId, formData) {
    try {
      const formProgressRef = doc(this.getDb(), 'formProgress', userId);
      await setDoc(formProgressRef, {
        userId,
        ...formData,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error saving form progress:', error);
      return false;
    }
  }

  /**
   * Get saved form progress
   * @param {string} userId - User ID
   */
  async getFormProgress(userId) {
    try {
      const formProgressRef = doc(this.getDb(), 'formProgress', userId);
      const snapshot = await getDoc(formProgressRef);
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      console.error('Error retrieving form progress:', error);
      return null;
    }
  }

  /**
   * Submit completed forms
   * @param {string} userId - User ID
   * @param {object} formData - Complete form data
   */
  async submitFormsComplete(userId, formData) {
    try {
      const userDocRef = doc(this.getDb(), 'users', userId);
      
      // Save to user document
      await setDoc(userDocRef, {
        formData: {
          form1: formData.form1,
          form2: formData.form2,
          form3: formData.form3,
          examUploadedAt: formData.examUpload.uploadedAt,
          completedAt: serverTimestamp(),
          status: 'submitted'
        }
      }, { merge: true });

      // Clear temporary form progress
      const formProgressRef = doc(this.getDb(), 'formProgress', userId);
      await deleteDoc(formProgressRef);

      return true;
    } catch (error) {
      console.error('Error submitting forms:', error);
      return false;
    }
  }

  /**
   * Check if user has completed forms
   * @param {string} userId - User ID
   */
  async checkFormsCompleted(userId) {
    try {
      const userDocRef = doc(this.getDb(), 'users', userId);
      const snapshot = await getDoc(userDocRef);
      
      if (!snapshot.exists()) return false;
      
      const userData = snapshot.data();
      return userData.formData?.status === 'submitted';
    } catch (error) {
      console.error('Error checking forms status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const firestoreService = new FirestoreService();
