import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase.js';

/**
 * Validates that Firestore is initialized before performing queries
 */
function checkDatabaseReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      'Cloud Firestore is not configured. Please supply your credentials in the .env file.'
    );
  }
}

/**
 * Create a new document in a collection.
 * Generates an automatic ID or uses a specified custom ID.
 * Automatically appends server timestamps (createdAt, updatedAt).
 *
 * @param {string} collectionName - Target Firestore collection
 * @param {object} data - Document data
 * @param {string} [customId] - Optional custom document ID
 * @returns {Promise<{id: string, [key: string]: any}>} Created document with ID
 */
export async function createDocument(collectionName, data, customId = null) {
  checkDatabaseReady();

  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (customId) {
    const docRef = doc(db, collectionName, customId);
    await setDoc(docRef, payload);
    return { id: customId, ...data };
  } else {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, payload);
    return { id: docRef.id, ...data };
  }
}

/**
 * Retrieve a single document by its ID
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<{id: string, [key: string]: any} | null>}
 */
export async function getDocument(collectionName, docId) {
  checkDatabaseReady();

  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() };
}

/**
 * Retrieve all documents or queried documents from a collection
 * @param {string} collectionName
 * @param {Array} [queryConstraints=[]] - Optional Firestore constraints (where, orderBy, limit)
 * @returns {Promise<Array<{id: string, [key: string]: any}>>}
 */
export async function getDocuments(collectionName, queryConstraints = []) {
  checkDatabaseReady();

  const colRef = collection(db, collectionName);
  const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Update an existing document by its ID.
 * Automatically updates the updatedAt timestamp.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data - Fields to update
 * @returns {Promise<void>}
 */
export async function updateDocument(collectionName, docId, data) {
  checkDatabaseReady();

  const docRef = doc(db, collectionName, docId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  return await updateDoc(docRef, payload);
}

/**
 * Delete a document from a collection
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
  checkDatabaseReady();

  const docRef = doc(db, collectionName, docId);
  return await deleteDoc(docRef);
}

/**
 * Subscribe to real-time changes on a collection or filtered query.
 * Useful for real-time task updates and volunteer roster tracking.
 *
 * @param {string} collectionName
 * @param {(data: Array<{id: string, [key: string]: any}>) => void} onNext - Snapshot callback
 * @param {Array} [queryConstraints=[]] - Optional Firestore constraints
 * @param {(error: Error) => void} [onError] - Optional error handler
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToCollection(collectionName, onNext, queryConstraints = [], onError) {
  if (!isFirebaseConfigured || !db) {
    onNext([]);
    return () => {};
  }

  const colRef = collection(db, collectionName);
  const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onNext(items);
    },
    (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to real-time changes on a single document
 *
 * @param {string} collectionName
 * @param {string} docId
 * @param {(data: {id: string, [key: string]: any} | null) => void} onNext
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToDocument(collectionName, docId, onNext, onError) {
  if (!isFirebaseConfigured || !db) {
    onNext(null);
    return () => {};
  }

  const docRef = doc(db, collectionName, docId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onNext(null);
      } else {
        onNext({ id: snapshot.id, ...snapshot.data() });
      }
    },
    (error) => {
      console.error(`Error subscribing to document ${collectionName}/${docId}:`, error);
      if (onError) onError(error);
    }
  );
}
