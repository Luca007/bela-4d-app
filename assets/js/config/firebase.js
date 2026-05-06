// Firebase Configuration and Initialization
// This module initializes Firebase through ES module imports from the Firebase CDN.

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAuth as getAuthInstance } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getFirestore as getFirestoreInstance } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { getFunctions as getFunctionsInstance } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js';
import { getAnalytics as getAnalyticsInstance, isSupported as isAnalyticsSupported } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js';

export const firebaseConfig = {
  apiKey: "AIzaSyBPIZCJq9DVn8MT4hjkRRIuktOfUgW97yw",
  authDomain: "bela-4d-app.firebaseapp.com",
  projectId: "bela-4d-app",
  storageBucket: "bela-4d-app.firebasestorage.app",
  messagingSenderId: "391056456533",
  appId: "1:391056456533:web:7bf4c8eadcf53540bb4ddc",
  measurementId: "G-PY77TBB6H9"
};

// These will be initialized when Firebase SDK loads from CDN
let app = null;
let auth = null;
let db = null;
let functions = null;
let analytics = null;

// Initialize Firebase - called after DOM is ready and Firebase SDK is loaded
export async function initializeFirebase() {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuthInstance(app);
    db = getFirestoreInstance(app);
    functions = getFunctionsInstance(app);

    if (await isAnalyticsSupported()) {
      analytics = getAnalyticsInstance(app);
    }

    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
}

// Get Firebase instances
export function getAuth() {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
}

export function getFirestore() {
  if (!db) {
    throw new Error('Firebase Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
}

export function getFunctions() {
  if (!functions) {
    throw new Error('Firebase Functions not initialized. Call initializeFirebase() first.');
  }
  return functions;
}

export function getAnalytics() {
  if (!analytics) {
    throw new Error('Firebase Analytics not initialized. Call initializeFirebase() first.');
  }
  return analytics;
}

export function getApp() {
  if (!app) {
    throw new Error('Firebase App not initialized. Call initializeFirebase() first.');
  }
  return app;
}
