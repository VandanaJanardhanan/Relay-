import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Safely extract environment variables (compatible with Vite and test runners)
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

// Firebase configuration using Vite environment variables
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// Check if valid Firebase configuration values are present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.trim() !== ''
);

let app = null;
let auth = null;
let db = null;
let functions = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.warn(
    'RELAY: Firebase credentials have not been configured in .env yet. ' +
    'Please paste your Firebase configuration keys into .env to enable live backend services.'
  );
}

export { app, auth, db, functions };
export default app;
