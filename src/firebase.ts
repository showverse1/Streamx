import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Series } from './types';

// Curated high-quality series fallback with guaranteed playable MP4 video streams
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
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
            description: 'A rogue ronin discovers an ancient biometric katana inside the ruins of Sector 7.'
          },
          {
            id: 'cr-s1-e2',
            episodeNumber: 2,
            title: 'The Neural Grid Ambush',
            duration: '12:14',
            durationSeconds: 734,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
            description: 'Cybernetic enforcers isolate the subway transit lines.'
          },
          {
            id: 'cr-s1-e3',
            episodeNumber: 3,
            title: 'Silicon Tears',
            duration: '14:20',
            durationSeconds: 860,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
            description: 'An old comrade reappears with an ultimatum that threatens the rebellion.'
          },
          {
            id: 'cr-s1-e4',
            episodeNumber: 4,
            title: 'Overdrive Protocol',
            duration: '15:02',
            durationSeconds: 902,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            description: 'Pushing neural implants past the safety threshold.'
          },
          {
            id: 'cr-s1-e5',
            episodeNumber: 5,
            title: 'Ascension of Chrome',
            duration: '11:45',
            durationSeconds: 705,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
            description: 'Six months later, a shadowy figure hacks the central mainframe.'
          },
          {
            id: 'cr-s2-e2',
            episodeNumber: 2,
            title: 'Black Ice Protocol',
            duration: '14:35',
            durationSeconds: 875,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
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
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
            description: 'An exhausted paralegal stumbles into an unmarked doorway during a downpour.'
          },
          {
            id: 'smc-s1-e2',
            episodeNumber: 2,
            title: 'Espresso with a Drop of Regret',
            duration: '11:15',
            durationSeconds: 675,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
            description: 'The barista offers a brew that reveals an unsaid confession.'
          },
          {
            id: 'smc-s1-e3',
            episodeNumber: 3,
            title: 'Cherry Blossom Foam',
            duration: '13:40',
            durationSeconds: 820,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&auto=format&fit=crop&q=80',
            description: 'A famous idol seeks sanctuary from the paparazzi.'
          },
          {
            id: 'smc-s1-e4',
            episodeNumber: 4,
            title: 'The Recipe from 1998',
            duration: '14:10',
            durationSeconds: 850,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            description: 'The detection station registers a timeline divergence of 4.2 hours.'
          },
          {
            id: 'ctv-s1-e2',
            episodeNumber: 2,
            title: 'Tachyon Drift',
            duration: '13:25',
            durationSeconds: 805,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
            description: 'Pursuing a time pirate through ancient Alexandria.'
          },
          {
            id: 'ctv-s1-e3',
            episodeNumber: 3,
            title: 'Grandfather Loop',
            duration: '15:10',
            durationSeconds: 910,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
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
    uploadTimestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
            description: 'An apprentice breaks the seal on the library basement.'
          },
          {
            id: 'sa-s1-e2',
            episodeNumber: 2,
            title: 'Circle of Chimera',
            duration: '11:50',
            durationSeconds: 710,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
            description: 'The undercover meeting goes south when an uninvited guest arrives.'
          },
          {
            id: 'gn-s1-e2',
            episodeNumber: 2,
            title: 'Port of Incheon',
            duration: '12:18',
            durationSeconds: 738,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
            description: 'Atmospheric entry burn through the planetary shields.'
          },
          {
            id: 'os-s1-e2',
            episodeNumber: 2,
            title: 'Zero G Breach',
            duration: '11:30',
            durationSeconds: 690,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
            description: 'Arriving at the secluded coastal workshop as twilight fades.'
          }
        ]
      }
    ]
  }
];

// Firebase app instance handling
let dbInstance: ReturnType<typeof getFirestore> | null = null;

export function getFirestoreDB() {
  if (dbInstance) return dbInstance;
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-streamx-key',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'streamx-web.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'streamx-web',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'streamx-web.appspot.com',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
    };

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.warn('Firestore initialization notice; using local fallback store', err);
    return null;
  }
}

export async function fetchSeriesData(): Promise<Series[]> {
  try {
    const db = getFirestoreDB();
    if (db && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      const seriesCol = collection(db, 'series');
      const q = query(seriesCol, orderBy('uploadTimestamp', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: Series[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as Omit<Series, 'id'>) });
        });
        return list;
      }
    }
  } catch (error) {
    console.warn('Firestore query failed or unconfigured, providing curated sample library:', error);
  }
  // Return pristine curated library
  return INITIAL_SERIES_DATA;
}
