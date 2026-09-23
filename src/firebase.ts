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
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Series, UserProfile, WatchHistoryItem } from './types';

// Curated high-quality series with guaranteed working, high-speed public CDN video streams
export const INITIAL_SERIES_DATA: Series[] = [
  {
    id: 'cyber-ronin',
    title: 'Cyber Ronin: Neo Tokyo',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    category: 'Anime',
    rating: '9.8',
    year: 2026,
    description: 'In the dystopian neon alleys of Neo Tokyo, an augmented swordmaster seeks redemption against rogue AI syndicates dominating the underworld.',
    tags: ['Cyberpunk', 'Action', 'Sci-Fi', 'Popular'],
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 2,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Neon Blade',
        episodes: [
          {
            id: 'cr-s1-e1',
            episodeNumber: 1,
            title: 'Awakening of the Ghost Katana',
            duration: '10:53',
            durationSeconds: 653,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
            description: 'A rogue ronin discovers an ancient biometric katana inside the ruins of Sector 7.'
          },
          {
            id: 'cr-s1-e2',
            episodeNumber: 2,
            title: 'The Neural Grid Ambush',
            duration: '12:14',
            durationSeconds: 734,
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
            description: 'Cybernetic enforcers isolate the subway transit lines.'
          },
          {
            id: 'cr-s1-e3',
            episodeNumber: 3,
            title: 'Silicon Tears',
            duration: '14:20',
            durationSeconds: 860,
            videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
            description: 'An old comrade reappears with an ultimatum that threatens the rebellion.'
          },
          {
            id: 'cr-s1-e4',
            episodeNumber: 4,
            title: 'Overdrive Protocol',
            duration: '15:02',
            durationSeconds: 902,
            videoUrl: 'https://media.w3.org/2010/05/video/movie_300.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            description: 'Pushing neural implants past the safety threshold.'
          },
          {
            id: 'cr-s1-e5',
            episodeNumber: 5,
            title: 'Ascension of Chrome',
            duration: '11:45',
            durationSeconds: 705,
            videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
            description: 'The final infiltration into the Orbital Citadel begins.'
          }
        ]
      },
      {
        seasonNumber: 2,
        title: 'Season 2: Zero Syndicate',
        episodes: [
          {
            id: 'cr-s2-e1',
            episodeNumber: 1,
            title: 'Ghosts of Shinjuku',
            duration: '13:10',
            durationSeconds: 790,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
            description: 'Six months later, a shadowy figure hacks the central mainframe.'
          },
          {
            id: 'cr-s2-e2',
            episodeNumber: 2,
            title: 'Black Ice Protocol',
            duration: '14:35',
            durationSeconds: 875,
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
            description: 'Countermeasures unleash a digital nightmare across the city.'
          }
        ]
      }
    ]
  },
  {
    id: 'seoul-midnight-cafe',
    title: 'Seoul Midnight Café',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=1200&auto=format&fit=crop&q=80',
    category: 'K-Drama',
    rating: '9.6',
    year: 2025,
    description: 'A secretive late-night café in Hongdae serves magical drinks that allow patrons to revisit one unresolved memory before dawn.',
    tags: ['Romance', 'Mystery', 'Drama', 'Healing'],
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 5,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Warm Americano',
        episodes: [
          {
            id: 'smc-s1-e1',
            episodeNumber: 1,
            title: 'Rainy Night in Mapo',
            duration: '12:00',
            durationSeconds: 720,
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
            description: 'An exhausted paralegal stumbles into an unmarked doorway during a downpour.'
          },
          {
            id: 'smc-s1-e2',
            episodeNumber: 2,
            title: 'Espresso with a Drop of Regret',
            duration: '11:15',
            durationSeconds: 675,
            videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
            description: 'The barista offers a brew that reveals an unsaid confession.'
          },
          {
            id: 'smc-s1-e3',
            episodeNumber: 3,
            title: 'Cherry Blossom Foam',
            duration: '13:40',
            durationSeconds: 820,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&auto=format&fit=crop&q=80',
            description: 'A famous idol seeks sanctuary from the paparazzi.'
          },
          {
            id: 'smc-s1-e4',
            episodeNumber: 4,
            title: 'The Recipe from 1998',
            duration: '14:10',
            durationSeconds: 850,
            videoUrl: 'https://media.w3.org/2010/05/video/movie_300.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
            description: 'An elderly visitor recognizes the unique hand-drip technique.'
          }
        ]
      }
    ]
  },
  {
    id: 'chronos-vanguard',
    title: 'Chronos: The Time Vanguard',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    category: 'Sci-Fi',
    rating: '9.4',
    year: 2026,
    description: 'Time anomaly detectives prevent temporal paradoxes caused by illicit time travel expeditions in the year 2142.',
    tags: ['Sci-Fi', 'Time Travel', 'Thriller'],
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 12,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Paradox Alpha',
        episodes: [
          {
            id: 'ctv-s1-e1',
            episodeNumber: 1,
            title: 'Fissure at Cape Canaveral',
            duration: '14:50',
            durationSeconds: 890,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            description: 'The detection station registers a timeline divergence of 4.2 hours.'
          },
          {
            id: 'ctv-s1-e2',
            episodeNumber: 2,
            title: 'Tachyon Drift',
            duration: '13:25',
            durationSeconds: 805,
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
            description: 'Pursuing a time pirate through ancient Alexandria.'
          },
          {
            id: 'ctv-s1-e3',
            episodeNumber: 3,
            title: 'Grandfather Loop',
            duration: '15:10',
            durationSeconds: 910,
            videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
            description: 'Trapped inside a 30-minute causality loop.'
          }
        ]
      }
    ]
  },
  {
    id: 'shadow-alchemist',
    title: 'Shadow Alchemist: Eclipse',
    thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    category: 'Anime',
    rating: '9.9',
    year: 2026,
    description: 'Forbidden transmutation unleashes mythical celestial beasts across the northern kingdom.',
    tags: ['Anime', 'Fantasy', 'Magic', 'Adventure'],
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 24,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: The Forbidden Sigil',
        episodes: [
          {
            id: 'sa-s1-e1',
            episodeNumber: 1,
            title: 'Black Quicksilver',
            duration: '12:45',
            durationSeconds: 765,
            videoUrl: 'https://media.w3.org/2010/05/video/movie_300.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
            description: 'An apprentice breaks the seal on the library basement.'
          },
          {
            id: 'sa-s1-e2',
            episodeNumber: 2,
            title: 'Circle of Chimera',
            duration: '11:50',
            durationSeconds: 710,
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
            description: 'Guards encounter the first nocturnal manifestation.'
          }
        ]
      }
    ]
  },
  {
    id: 'gangnam-noir',
    title: 'Gangnam Noir: Crimson Tide',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    category: 'K-Drama',
    rating: '9.3',
    year: 2025,
    description: 'An undercover detective infiltrates Seoul’s most ruthless conglomerate syndicate only to discover ties to his family past.',
    tags: ['K-Drama', 'Crime', 'Suspense', 'Action'],
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 36,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Deep Water',
        episodes: [
          {
            id: 'gn-s1-e1',
            episodeNumber: 1,
            title: 'VIP Lounge Penthouse',
            duration: '13:30',
            durationSeconds: 810,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
            description: 'The undercover meeting goes south when an uninvited guest arrives.'
          },
          {
            id: 'gn-s1-e2',
            episodeNumber: 2,
            title: 'Port of Incheon',
            duration: '12:18',
            durationSeconds: 738,
            videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
            description: 'Tracking container 809 before midnight customs clearance.'
          }
        ]
      }
    ]
  },
  {
    id: 'orbital-strike',
    title: 'Orbital Strike: Aegis',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80',
    category: 'Action',
    rating: '9.5',
    year: 2026,
    description: 'An elite orbital drop defense squadron responds to an extraterrestrial distress call from moon base Tycho.',
    tags: ['Action', 'Military', 'Sci-Fi', 'Space'],
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 48,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Lunar Siege',
        episodes: [
          {
            id: 'os-s1-e1',
            episodeNumber: 1,
            title: 'Drop Pod 04',
            duration: '10:40',
            durationSeconds: 640,
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
            description: 'Atmospheric entry burn through the planetary shields.'
          },
          {
            id: 'os-s1-e2',
            episodeNumber: 2,
            title: 'Zero G Breach',
            duration: '11:30',
            durationSeconds: 690,
            videoUrl: 'https://media.w3.org/2010/05/video/movie_300.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            description: 'Clearing the docking hangar under zero gravity conditions.'
          }
        ]
      }
    ]
  },
  {
    id: 'tokyo-drift-ghost',
    title: 'Touge Phantoms',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?w=1200&auto=format&fit=crop&q=80',
    category: 'Action',
    rating: '9.2',
    year: 2025,
    description: 'Mountain pass downhill racers battle for territory and honor with legendary tuned vehicles under the moonlight.',
    tags: ['Action', 'Racing', 'Drift', 'Anime'],
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 72,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Mount Haruna Downhill',
        episodes: [
          {
            id: 'tp-s1-e1',
            episodeNumber: 1,
            title: 'The Five Hairpin Turns',
            duration: '12:20',
            durationSeconds: 740,
            videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?w=600&auto=format&fit=crop&q=80',
            description: 'A midnight run tests the limits of tire friction and nerve.'
          }
        ]
      }
    ]
  },
  {
    id: 'jeju-island-blue',
    title: 'Jeju Sunset Romance',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    category: 'Romance',
    rating: '9.5',
    year: 2026,
    description: 'Two estranged artists meet on the wind-swept coast of Jeju Island to restore an old lighthouse and find unexpected warmth.',
    tags: ['Romance', 'K-Drama', 'Healing', 'Coast'],
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 96,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Coastal Breeze',
        episodes: [
          {
            id: 'jsr-s1-e1',
            episodeNumber: 1,
            title: 'The Lighthouse Keeper',
            duration: '13:00',
            durationSeconds: 780,
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
            description: 'Arriving at the secluded coastal workshop as twilight fades.'
          }
        ]
      }
    ]
  }
];

// Firebase App & Services Initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Seed Initial Series Data to Firestore if collection is empty
export async function seedInitialSeriesIfEmpty(): Promise<void> {
  try {
    const seriesCol = collection(db, 'series');
    const existingSnap = await getDocs(query(seriesCol, limit(1)));
    if (existingSnap.empty) {
      console.log('Seeding initial series to Firestore...');
      for (const item of INITIAL_SERIES_DATA) {
        await setDoc(doc(db, 'series', item.id), item);
      }
      console.log('Firestore series seeded successfully!');
    }
  } catch (err) {
    console.warn('Initial series seed to Firestore skipped or unpermitted:', err);
  }
}

// Fetch Series from Firestore with fallback to pristine curated data
export async function fetchSeriesData(): Promise<Series[]> {
  try {
    const seriesCol = collection(db, 'series');
    const q = query(seriesCol, orderBy('uploadTimestamp', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const list: Series[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Series, 'id'>) });
      });
      return list;
    } else {
      // Background seed if collection is empty
      seedInitialSeriesIfEmpty().catch(() => {});
    }
  } catch (error) {
    console.warn('Firestore series fetch failed, using curated dataset:', error);
  }
  return INITIAL_SERIES_DATA;
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
