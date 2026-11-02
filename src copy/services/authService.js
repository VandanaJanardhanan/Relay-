import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase.js';

/**
 * Ensures Firebase Auth is initialized before executing operations
 */
function checkAuthReady() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      'Firebase Authentication is not configured. Please supply your credentials in the .env file.'
    );
  }
}

/**
 * Register a new user with email, password, and optional display name
 * @param {string} email
 * @param {string} password
 * @param {string} [displayName]
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function registerUser(email, password, displayName = '') {
  checkAuthReady();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential;
}

/**
 * Sign in an existing user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signInUser(email, password) {
  checkAuthReady();
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the currently authenticated user
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  if (!auth) return Promise.resolve();
  return await signOut(auth);
}

/**
 * Observe changes to the user's authentication state
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function observeAuthState(callback) {
  if (!isFirebaseConfigured || !auth) {
    // If Firebase is not configured, deliver null user and return a no-op
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign in with Google provider
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signInWithGoogle() {
  checkAuthReady();
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function resetUserPassword(email) {
  checkAuthReady();
  return await sendPasswordResetEmail(auth, email);
}

/**
 * Get the current user synchronously
 * @returns {import('firebase/auth').User | null}
 */
export function getCurrentUser() {
  return auth ? auth.currentUser : null;
}
