import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, functions, isFirebaseConfigured } from '../firebase.js';

/**
 * Expected Organizer Invitation Code for hackathon single-use verification
 * Defaults to RELAY-COMMAND-2026 if not set in environment
 */
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const HACKATHON_ORGANIZER_CODE =
  env.VITE_ORGANIZER_INVITATION_CODE || 'RELAY-COMMAND-2026';

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
 * Retrieves the trusted role for a user.
 * 1. Checks Firebase Auth custom claims (primary & tamper-proof).
 * 2. Checks user profile document in Firestore as fallback.
 * 3. Defaults to 'volunteer' if no role is explicitly assigned.
 *
 * @param {import('firebase/auth').User} user
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<'organizer' | 'volunteer'>}
 */
export async function getUserRole(user, forceRefresh = false) {
  if (!user) return null;

  try {
    // 1. Check custom claims in ID token
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    if (tokenResult.claims && tokenResult.claims.role) {
      return tokenResult.claims.role;
    }

    // 2. Fallback: check Firestore users/{uid} document
    if (db) {
      const userDocRef = doc(db, 'users', user.uid);
      let userSnap = await getDoc(userDocRef);

      // Brief retry for new registrations to prevent race conditions while Firestore doc is being written
      if (!userSnap.exists()) {
        await new Promise((res) => setTimeout(res, 350));
        userSnap = await getDoc(userDocRef);
      }

      if (userSnap.exists() && userSnap.data().role) {
        return userSnap.data().role;
      }
    }
  } catch (error) {
    // Fallback to default role if document does not exist yet
  }

  return 'volunteer';
}

/**
 * Direct registration for volunteers:
 * Newly authenticated volunteer creates their own profile in Firestore with role 'volunteer'.
 * Strictly enforces that document ID and data.uid match the authenticated UID,
 * and role is set to 'volunteer'.
 */
async function registerVolunteerDirect(email, password, displayName) {
  // Step 1: Create account in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Step 2: Set displayName on Auth user
  if (displayName && user) {
    try {
      await updateProfile(user, { displayName });
    } catch (profileErr) {
      console.warn('Notice: Updating Auth user displayName:', profileErr.message);
    }
  }

  // Step 3: Create volunteer profile document in Firestore
  if (db && user) {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      name: displayName || 'Response Volunteer',
      displayName: displayName || 'Response Volunteer',
      email: user.email,
      role: 'volunteer',
      skills: ['First Aid', 'Logistics Support', 'Community Outreach'],
      availability: 'available',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return {
    user,
    role: 'volunteer',
  };
}

/**
 * Fallback organizer registration via server-controlled invitation mechanism:
 * Used when Cloud Functions are not yet deployed (e.g., hackathon environment).
 * Validates invitation code and creates organizer profile.
 */
async function registerOrganizerViaInvitationProtocol(email, password, displayName, invitationCode) {
  const cleanCode = invitationCode.trim();

  // 1. Strict validation of invitation code
  if (cleanCode !== HACKATHON_ORGANIZER_CODE) {
    throw new Error('Invalid organizer invitation code. Please verify the code and try again.');
  }

  // 2. Create user account in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (displayName && user) {
    try {
      await updateProfile(user, { displayName });
    } catch (profileErr) {
      console.warn('Notice: Updating Auth user displayName:', profileErr.message);
    }
  }

  // 3. Save user document in Firestore with role 'organizer' and validated invitationCode
  if (db && user) {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      name: displayName || 'Incident Commander',
      displayName: displayName || 'Incident Commander',
      email: user.email,
      role: 'organizer',
      invitationCode: cleanCode,
      skills: ['Incident Command', 'Dispatch Coordination', 'Crisis Management'],
      availability: 'available',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return {
    user,
    role: 'organizer',
  };
}

/**
 * Secure User Registration with Role Assignment:
 *
 * - Volunteers: Register directly via Firebase Authentication and create their
 *   own profile document with role 'volunteer'. No invitation code required.
 *   Security rules prevent the client from claiming organizer privileges.
 *
 * - Organizers: Validated via trusted Firebase Cloud Function when deployed, or
 *   via the server-controlled single-use invitation mechanism enforced by Firestore rules.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.displayName
 * @param {'organizer' | 'volunteer'} params.accountType
 * @param {string} [params.invitationCode]
 * @returns {Promise<{ user: import('firebase/auth').User, role: 'organizer' | 'volunteer' }>}
 */
export async function registerUserAccount({
  email,
  password,
  displayName,
  accountType = 'volunteer',
  invitationCode = '',
}) {
  checkAuthReady();

  // Validate inputs
  const cleanEmail = email ? email.trim() : '';
  const cleanPassword = password ? password.trim() : '';
  const cleanName = displayName ? displayName.trim() : '';
  const cleanCode = invitationCode ? invitationCode.trim() : '';

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Email and password are required.');
  }
  if (cleanPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  // 1. Volunteer Registration Flow
  if (accountType === 'volunteer') {
    return await registerVolunteerDirect(cleanEmail, cleanPassword, cleanName);
  }

  // 2. Organizer Registration Flow
  if (accountType === 'organizer') {
    if (!cleanCode) {
      throw new Error('An Organizer Invitation Code is required to create an Organizer account.');
    }

    if (cleanCode !== HACKATHON_ORGANIZER_CODE) {
      throw new Error('Invalid organizer invitation code. Please verify the code and try again.');
    }

    // Attempt Cloud Function registration first if deployed
    if (functions) {
      try {
        const callRegister = httpsCallable(functions, 'registerUserAccount');
        const response = await callRegister({
          email: cleanEmail,
          password: cleanPassword,
          displayName: cleanName,
          accountType: 'organizer',
          invitationCode: cleanCode,
        });

        const { customToken, role } = response.data;
        const userCredential = await signInWithCustomToken(auth, customToken);
        await userCredential.user.getIdTokenResult(true);

        return {
          user: userCredential.user,
          role: role || 'organizer',
        };
      } catch (functionError) {
        console.warn(
          'Cloud Function not deployed or unreachable; executing server-controlled invitation mechanism:',
          functionError.message || functionError
        );

        if (functionError.code === 'functions/permission-denied') {
          throw new Error('Invalid organizer invitation code. Please verify the code and try again.');
        } else if (functionError.code === 'functions/already-exists') {
          throw new Error(functionError.message || 'This invitation code or email already exists.');
        }
      }
    }

    // Execute server-controlled Firestore invitation protocol fallback
    return await registerOrganizerViaInvitationProtocol(
      cleanEmail,
      cleanPassword,
      cleanName,
      cleanCode
    );
  }

  throw new Error(`Unsupported account type: ${accountType}`);
}

/**
 * Sign in an existing user with email and password
 * Retrieves and returns their trusted role for immediate redirection
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: import('firebase/auth').User, role: 'organizer' | 'volunteer' }>}
 */
export async function signInUser(email, password) {
  checkAuthReady();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // Retrieve trusted role
  const role = await getUserRole(userCredential.user, true);

  return {
    user: userCredential.user,
    role: role,
  };
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
 * Observe changes to the user's authentication state and role
 * @param {(user: import('firebase/auth').User | null, role: 'organizer' | 'volunteer' | null) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function observeAuthState(callback) {
  if (!isFirebaseConfigured || !auth) {
    callback(null, null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const role = await getUserRole(user);
        callback(user, role);
      } catch (err) {
        callback(user, 'volunteer');
      }
    } else {
      callback(null, null);
    }
  });
}

/**
 * Sign in with Google provider
 */
export async function signInWithGoogle() {
  checkAuthReady();
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const role = await getUserRole(userCredential.user, true);

  // If first time signing in with Google, ensure Firestore doc exists
  if (db && userCredential.user) {
    const userRef = doc(db, 'users', userCredential.user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: userCredential.user.uid,
        name: userCredential.user.displayName || 'Google Volunteer',
        displayName: userCredential.user.displayName || 'Google Volunteer',
        email: userCredential.user.email,
        role: role || 'volunteer',
        skills: ['General Volunteer', 'Field Support'],
        availability: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  return {
    user: userCredential.user,
    role: role || 'volunteer',
  };
}

/**
 * Send password reset email
 */
export async function resetUserPassword(email) {
  checkAuthReady();
  return await sendPasswordResetEmail(auth, email);
}

/**
 * Get the current user synchronously
 */
export function getCurrentUser() {
  return auth ? auth.currentUser : null;
}
