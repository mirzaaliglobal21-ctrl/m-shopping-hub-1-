import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import { Product, CommentItem, AppUser } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || firebaseConfigData.apiKey,
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfigData.authDomain,
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfigData.projectId,
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfigData.storageBucket,
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfigData.messagingSenderId,
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || firebaseConfigData.appId,
  firestoreDatabaseId: (import.meta.env?.VITE_FIREBASE_DATABASE_ID as string) || firebaseConfigData.firestoreDatabaseId,
};

// Official Google OAuth Client ID for external setups or deployments
export const GOOGLE_OAUTH_CLIENT_ID = firebaseConfigData.oAuthClientId || '1079456419306-j0f9njo2ml5q7s43beu2na7b6jmft39e.apps.googleusercontent.com';

// Initialize Firebase App
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with dedicated Database ID
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Mandatory Connection Test from Skill Guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check configuration or network.');
    } else {
      console.log('Firestore initial test doc pinged:', error);
    }
    return false;
  }
}

// Test connection on boot
testFirestoreConnection();

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle(): Promise<AppUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const user: AppUser = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Shopper',
      email: fbUser.email || 'user@mshoppinghub.com',
      avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: fbUser.email === 'mirzaaliglobal21@gmail.com' ? 'admin' : 'user',
    };

    // Save profile to Firestore
    await setDoc(
      doc(db, 'users', user.id),
      {
        uid: user.id,
        displayName: user.name,
        email: user.email,
        photoURL: user.avatar,
        role: user.role,
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    ).catch((e) => console.warn('Could not sync user profile to Firestore:', e));

    return user;
  } catch (err: any) {
    console.error('Google Sign-In error:', err);
    throw err;
  }
}

/**
 * Guest / Anonymous Login fallback (for users when popups are blocked or for instant access)
 */
export async function loginAsGuest(guestName?: string): Promise<AppUser> {
  try {
    const cred = await signInAnonymously(auth);
    const fbUser = cred.user;
    const displayName = guestName?.trim() || `Shopper #${fbUser.uid.substring(0, 5)}`;
    
    await updateProfile(fbUser, {
      displayName,
    }).catch(() => {});

    const user: AppUser = {
      id: fbUser.uid,
      name: displayName,
      email: `${fbUser.uid.substring(0, 6)}@shopper.hub`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: 'user',
    };

    await setDoc(
      doc(db, 'users', user.id),
      {
        uid: user.id,
        displayName: user.name,
        email: user.email,
        role: 'user',
        isGuest: true,
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    ).catch(() => {});

    return user;
  } catch (err) {
    console.error('Guest sign-in error:', err);
    throw err;
  }
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Firebase Auth State Changes
 */
export function subscribeToAuth(callback: (user: AppUser | null) => void) {
  return onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      const user: AppUser = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Shopper',
        email: fbUser.email || 'shopper@mshoppinghub.com',
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        role: fbUser.email === 'mirzaaliglobal21@gmail.com' ? 'admin' : 'user',
      };
      callback(user);
    } else {
      callback(null);
    }
  });
}

// -------------------------------------------------------------
// FIRESTORE PRODUCTS REPOSITORY
// -------------------------------------------------------------

/**
 * Fetch all products from Firestore
 */
export async function fetchProductsFromFirestore(): Promise<Product[]> {
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const items: Product[] = [];
      snap.forEach((d) => {
        const data = d.data() as Product;
        items.push({
          ...data,
          id: d.id,
        });
      });
      // Sort by createdAt descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items;
    }
  } catch (err) {
    console.warn('Error fetching products from Firestore:', err);
  }
  return [];
}

/**
 * Save product to Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, product, { merge: true });
    console.log('Saved product to Firestore:', product.id);
  } catch (err) {
    console.error('Failed to save product to Firestore:', err);
  }
}

/**
 * Update product in Firestore
 */
export async function updateProductInFirestore(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, updates);
    console.log('Updated product in Firestore:', id);
  } catch (err) {
    console.error('Failed to update product in Firestore:', err);
  }
}

/**
 * Delete product from Firestore
 */
export async function deleteProductFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
    console.log('Deleted product from Firestore:', id);
  } catch (err) {
    console.error('Failed to delete product from Firestore:', err);
  }
}

// -------------------------------------------------------------
// FIRESTORE COMMENTS REPOSITORY
// -------------------------------------------------------------

/**
 * Fetch all comments from Firestore
 */
export async function fetchCommentsFromFirestore(): Promise<CommentItem[]> {
  try {
    const colRef = collection(db, 'comments');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: CommentItem[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as CommentItem), id: d.id });
      });
      return list;
    }
  } catch (err) {
    console.warn('Error fetching comments from Firestore:', err);
  }
  return [];
}

/**
 * Add comment to Firestore
 */
export async function addCommentToFirestore(comment: CommentItem): Promise<void> {
  try {
    const docRef = doc(db, 'comments', comment.id);
    await setDoc(docRef, comment);
  } catch (err) {
    console.error('Failed to save comment to Firestore:', err);
  }
}
