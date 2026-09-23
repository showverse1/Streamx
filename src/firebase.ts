import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Series, UserProfile, WatchHistoryItem } from './types';

// Initial series catalog (Clean - no AI generated dummy items)
export const INITIAL_SERIES_DATA: Series[] = [];

// Firebase App & Services Initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Save or update a single Series/Movie in Firestore
export async function saveSeriesToFirestore(series: Series): Promise<void> {
  const docRef = doc(db, 'series', series.id);
  await setDoc(docRef, series, { merge: true });
}

// Bulk Save Series/Movies in Firestore (one click batch write)
export async function bulkSaveSeriesToFirestore(seriesList: Series[]): Promise<void> {
  const batch = writeBatch(db);
  for (const s of seriesList) {
    const docRef = doc(db, 'series', s.id);
    batch.set(docRef, s, { merge: true });
  }
  await batch.commit();
}

// Delete a single Series from Firestore
export async function deleteSeriesFromFirestore(seriesId: string): Promise<void> {
  const docRef = doc(db, 'series', seriesId);
  await deleteDoc(docRef);
}

// Clear all Series in Firestore (to clean out previous AI dummy videos)
export async function clearAllSeriesInFirestore(): Promise<void> {
  try {
    const seriesCol = collection(db, 'series');
    const snapshot = await getDocs(seriesCol);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to clear series in Firestore:', err);
  }
}

const DUMMY_AI_IDS = new Set([
  'cyber-ronin',
  'seoul-midnight-cafe',
  'chronos-vanguard',
  'shadow-alchemist',
  'gangnam-noir',
  'orbital-strike',
  'tokyo-drift-ghost',
  'jeju-island-blue',
  'sample-movie-1',
  'sample-series-1'
]);

// Fetch Series from Firestore (Strictly only real uploaded content)
export async function fetchSeriesData(): Promise<Series[]> {
  try {
    const seriesCol = collection(db, 'series');
    const q = query(seriesCol, orderBy('uploadTimestamp', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const list: Series[] = [];
      const toDeleteDocs: string[] = [];
      snapshot.forEach((docSnap) => {
        const id = docSnap.id;
        if (DUMMY_AI_IDS.has(id)) {
          toDeleteDocs.push(id);
        } else {
          list.push({ id, ...(docSnap.data() as Omit<Series, 'id'>) });
        }
      });

      // Background cleanup of any old AI dummy records
      if (toDeleteDocs.length > 0) {
        toDeleteDocs.forEach((id) => {
          deleteDoc(doc(db, 'series', id)).catch(() => {});
        });
      }

      return list;
    }
  } catch (error) {
    console.warn('Firestore series fetch notice:', error);
  }
  return [];
}

// Firebase Auth: Register with Email & Password
export async function registerWithFirebase(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;

    const displayName = name?.trim() || email.split('@')[0];
    await updateProfile(fbUser, {
      displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1)
    });

    const userProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || email,
      name: fbUser.displayName || displayName,
      isLoggedIn: true,
      joinedDate: Date.now(),
      role: 'user'
    };

    // Save user profile document in Firestore
    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        userId: fbUser.uid,
        email: userProfile.email,
        displayName: userProfile.name,
        photoURL: fbUser.photoURL || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        role: 'user'
      });
    } catch (saveErr) {
      console.warn('User profile firestore write warning:', saveErr);
    }

    return { success: true, user: userProfile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return { success: false, error: message };
  }
}

// Firebase Auth: Login with Email & Password
export async function loginWithFirebase(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;

    // Try reading user profile from Firestore
    let name = fbUser.displayName || email.split('@')[0];
    let joinedDate = Date.now();
    try {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.displayName) name = data.displayName;
        if (data.createdAt) joinedDate = data.createdAt;
      }
    } catch (readErr) {
      console.warn('User document fetch warning:', readErr);
    }

    const userProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || email,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      isLoggedIn: true,
      joinedDate
    };

    return { success: true, user: userProfile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return { success: false, error: message };
  }
}

// Firebase Auth: Google Sign-in Provider
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogleFirebase(): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const fbUser = cred.user;

    const userProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || '',
      name: fbUser.displayName || 'Member',
      isLoggedIn: true,
      joinedDate: Date.now()
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        userId: fbUser.uid,
        email: userProfile.email,
        displayName: userProfile.name,
        photoURL: fbUser.photoURL || '',
        updatedAt: Date.now(),
        role: 'user'
      }, { merge: true });
    } catch (saveErr) {
      console.warn('Google user profile write notice:', saveErr);
    }

    return { success: true, user: userProfile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Google sign-in cancelled or failed';
    return { success: false, error: message };
  }
}

// Firebase Auth: Logout
export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
}

// Cloud Watch History: Save episode watch entry to Firestore
export async function saveWatchHistoryToFirestore(
  userId: string,
  item: WatchHistoryItem
): Promise<void> {
  try {
    const docId = `${userId}_${item.seriesId}_s${item.seasonNum}_e${item.episodeNum}`;
    await setDoc(doc(db, 'watchHistory', docId), {
      ...item,
      userId,
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn('Firestore watch history save warning:', err);
  }
}

// Cloud Watch History: Fetch user history from Firestore
export async function fetchUserWatchHistoryFromFirestore(
  userId: string
): Promise<WatchHistoryItem[]> {
  try {
    const historyCol = collection(db, 'watchHistory');
    const q = query(
      historyCol,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const results: WatchHistoryItem[] = [];
    snapshot.forEach((snap) => {
      const d = snap.data();
      results.push({
        seriesId: d.seriesId,
        seasonNum: d.seasonNum,
        episodeNum: d.episodeNum,
        timestamp: d.timestamp,
        seriesTitle: d.seriesTitle,
        seriesThumbnail: d.seriesThumbnail,
        episodeTitle: d.episodeTitle,
        progressSeconds: d.progressSeconds,
        durationSeconds: d.durationSeconds
      });
    });
    return results;
  } catch (err) {
    console.warn('Firestore watch history query warning:', err);
    return [];
  }
}

// Cloud Watch History: Clear user watch history in Firestore
export async function clearUserWatchHistoryInFirestore(userId: string): Promise<void> {
  try {
    const historyCol = collection(db, 'watchHistory');
    const q = query(historyCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore watch history clear error:', err);
  }
}

// Listen to Firebase Auth state changes
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
