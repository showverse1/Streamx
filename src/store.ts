import { create } from 'zustand';
import { Series, Season, Episode, WatchHistoryItem, DownloadItem, TabType, UserProfile } from './types';
import {
  fetchSeriesData,
  saveSeriesToFirestore,
  bulkSaveSeriesToFirestore,
  deleteSeriesFromFirestore,
  clearAllSeriesInFirestore,
  loginWithFirebase,
  registerWithFirebase,
  loginWithGoogleFirebase,
  logoutFirebase,
  saveWatchHistoryToFirestore,
  fetchUserWatchHistoryFromFirestore,
  clearUserWatchHistoryInFirestore,
  subscribeToAuthState
} from './firebase';
import { storage } from './storage';

export interface ActivePlayback {
  series: Series;
  season: Season;
  episode: Episode;
  seasonNum: number;
}

interface AppState {
  // Navigation & System
  currentTab: TabType;
  selectedSeriesId: string | null;
  initialEpisodeTarget: { seasonNum: number; episodeNum: number } | null;
  activePlayback: ActivePlayback | null;
  backExitWarning: boolean;
  
  // User Auth State
  user: UserProfile | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  initAuthListener: () => () => void;

  // Series Data
  series: Series[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;

  // LocalStorage State
  watchHistory: WatchHistoryItem[];
  downloads: DownloadItem[];
  recentSearches: string[];

  // Actions
  setCurrentTab: (tab: TabType) => void;
  setSelectedSeriesId: (id: string | null) => void;
  openSeriesWithEpisode: (seriesId: string, seasonNum?: number, episodeNum?: number) => void;
  setSelectedCategory: (category: string) => void;
  setBackExitWarning: (show: boolean) => void;
  
  // Data actions
  loadSeries: () => Promise<void>;
  isContentManagerOpen: boolean;
  setIsContentManagerOpen: (open: boolean) => void;
  addSeries: (series: Series) => Promise<void>;
  updateSeries: (series: Series) => Promise<void>;
  bulkAddSeries: (seriesList: Series[]) => Promise<void>;
  deleteSeries: (seriesId: string) => Promise<void>;
  clearAllSeries: () => Promise<void>;
  
  // Playback & Watch History actions
  startPlayback: (series: Series, seasonNum: number, episode: Episode) => void;
  stopPlayback: () => void;
  recordEpisodeWatch: (series: Series, seasonNum: number, episode: Episode, progressSeconds?: number) => void;
  clearWatchHistory: () => void;

  // Downloads actions
  addDownload: (series: Series, seasonNum: number, episode: Episode) => void;
  deleteDownload: (id: string) => void;

  // Recent searches actions
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Clear all local histories
  clearAllHistory: () => void;

  // Haptic trigger
  haptic: (duration?: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentTab: 'home',
  selectedSeriesId: null,
  initialEpisodeTarget: null,
  activePlayback: null,
  backExitWarning: false,

  // Auth default state
  user: storage.getUser(),
  isAuthModalOpen: false,
  setIsAuthModalOpen: (open: boolean) => {
    get().haptic(30);
    set({ isAuthModalOpen: open });
  },

  initAuthListener: () => {
    return subscribeToAuthState(async (fbUser) => {
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Member'),
          isLoggedIn: true,
          joinedDate: Date.now()
        };
        storage.saveUser(profile);
        set({ user: profile });

        // Pull cloud watch history from Firestore
        try {
          const cloudHistory = await fetchUserWatchHistoryFromFirestore(fbUser.uid);
          if (cloudHistory && cloudHistory.length > 0) {
            cloudHistory.forEach((item) => storage.saveWatchHistoryItem(item));
            set({ watchHistory: storage.getWatchHistory() });
          }
        } catch (err) {
          console.warn('Initial cloud watch history sync notice:', err);
        }
      }
    });
  },

  login: async (email: string, password: string) => {
    get().haptic(45);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Authenticate with Firebase Auth
    const res = await loginWithFirebase(cleanEmail, password);
    if (!res.success || !res.user) {
      // Return user-friendly error
      const err = res.error || '';
      if (err.includes('user-not-found') || err.includes('invalid-credential')) {
        return { success: false, error: 'Invalid email or password. Please try again or create an account.' };
      }
      return { success: false, error: res.error || 'Authentication failed.' };
    }

    const profile = res.user;
    storage.saveUser(profile);
    set({ user: profile, isAuthModalOpen: false });

    // Sync cloud watch history from Firestore
    if (profile.uid) {
      try {
        const cloudHistory = await fetchUserWatchHistoryFromFirestore(profile.uid);
        if (cloudHistory && cloudHistory.length > 0) {
          cloudHistory.forEach((item) => storage.saveWatchHistoryItem(item));
          set({ watchHistory: storage.getWatchHistory() });
        }
      } catch (err) {
        console.warn('Post-login cloud history sync notice:', err);
      }
    }

    return { success: true };
  },

  register: async (email: string, password: string, name?: string) => {
    get().haptic(50);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Register with Firebase Auth & Firestore
    const res = await registerWithFirebase(cleanEmail, password, name);
    if (!res.success || !res.user) {
      const err = res.error || '';
      if (err.includes('email-already-in-use')) {
        return { success: false, error: 'This email is already registered. Please sign in instead.' };
      }
      return { success: false, error: res.error || 'Registration failed.' };
    }

    const profile = res.user;
    storage.saveUser(profile);
    set({ user: profile, isAuthModalOpen: false });

    // Sync existing local watch history to Firestore for newly created user
    if (profile.uid) {
      const existingHistory = storage.getWatchHistory();
      for (const item of existingHistory.slice(0, 10)) {
        saveWatchHistoryToFirestore(profile.uid, item).catch(() => {});
      }
    }

    return { success: true };
  },

  loginWithGoogle: async () => {
    get().haptic(45);
    const res = await loginWithGoogleFirebase();
    if (!res.success || !res.user) {
      return { success: false, error: res.error || 'Google sign-in could not be completed.' };
    }
    const profile = res.user;
    storage.saveUser(profile);
    set({ user: profile, isAuthModalOpen: false });

    if (profile.uid) {
      try {
        const cloudHistory = await fetchUserWatchHistoryFromFirestore(profile.uid);
        if (cloudHistory && cloudHistory.length > 0) {
          cloudHistory.forEach((item) => storage.saveWatchHistoryItem(item));
          set({ watchHistory: storage.getWatchHistory() });
        }
      } catch (err) {
        console.warn('Google post-login history fetch warning:', err);
      }
    }
    return { success: true };
  },

  logout: () => {
    get().haptic(50);
    logoutFirebase().catch(() => {});
    storage.clearUser();
    set({ user: null });
  },

  series: [],
  isLoading: false,
  error: null,
  selectedCategory: 'All',

  watchHistory: storage.getWatchHistory(),
  downloads: storage.getDownloads(),
  recentSearches: storage.getRecentSearches(),

  setCurrentTab: (tab: TabType) => {
    get().haptic(35);
    set({ currentTab: tab, selectedSeriesId: null });
  },

  setSelectedSeriesId: (id: string | null) => {
    get().haptic(40);
    set({ selectedSeriesId: id, initialEpisodeTarget: null, activePlayback: null });
  },

  openSeriesWithEpisode: (seriesId: string, seasonNum?: number, episodeNum?: number) => {
    get().haptic(50);
    set({
      selectedSeriesId: seriesId,
      initialEpisodeTarget: (seasonNum !== undefined && episodeNum !== undefined)
        ? { seasonNum, episodeNum }
        : null,
      activePlayback: null
    });
  },

  setSelectedCategory: (category: string) => {
    get().haptic(30);
    set({ selectedCategory: category });
  },

  setBackExitWarning: (show: boolean) => {
    set({ backExitWarning: show });
  },

  loadSeries: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchSeriesData();
      set({ series: data, isLoading: false });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch series catalog',
        isLoading: false
      });
    }
  },

  isContentManagerOpen: false,
  setIsContentManagerOpen: (open: boolean) => {
    if (open) {
      const email = get().user?.email?.toLowerCase().trim();
      if (email !== 'vk8260428@gmail.com') {
        return;
      }
    }
    set({ isContentManagerOpen: open });
  },

  addSeries: async (series: Series) => {
    get().haptic(40);
    await saveSeriesToFirestore(series);
    const existing = get().series.filter((s) => s.id !== series.id);
    set({ series: [series, ...existing] });
  },

  updateSeries: async (series: Series) => {
    get().haptic(40);
    await saveSeriesToFirestore(series);
    set({
      series: get().series.map((s) => (s.id === series.id ? series : s))
    });
  },

  bulkAddSeries: async (seriesList: Series[]) => {
    get().haptic(50);
    await bulkSaveSeriesToFirestore(seriesList);
    const current = get().series;
    const map = new Map<string, Series>();
    seriesList.forEach((s) => map.set(s.id, s));
    current.forEach((s) => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    set({ series: Array.from(map.values()) });
  },

  deleteSeries: async (seriesId: string) => {
    get().haptic(40);
    await deleteSeriesFromFirestore(seriesId);
    set({ series: get().series.filter((s) => s.id !== seriesId) });
  },

  clearAllSeries: async () => {
    get().haptic(60);
    await clearAllSeriesInFirestore();
    set({ series: [] });
  },

  startPlayback: (series: Series, seasonNum: number, episode: Episode) => {
    get().haptic(60);
    const targetSeason = series.seasons.find((s) => s.seasonNumber === seasonNum) || series.seasons[0];
    
    // Set active playback
    set({
      activePlayback: {
        series,
        season: targetSeason,
        episode,
        seasonNum
      }
    });

    // Record episode played to LocalStorage via Zustand action
    get().recordEpisodeWatch(series, seasonNum, episode, 0);
  },

  stopPlayback: () => {
    get().haptic(40);
    set({ activePlayback: null });
  },

  recordEpisodeWatch: (series: Series, seasonNum: number, episode: Episode, progressSeconds = 0) => {
    const historyItem: WatchHistoryItem = {
      seriesId: series.id,
      seasonNum,
      episodeNum: episode.episodeNumber,
      timestamp: Date.now(),
      seriesTitle: series.title,
      seriesThumbnail: series.thumbnailUrl,
      episodeTitle: episode.title,
      progressSeconds,
      durationSeconds: episode.durationSeconds
    };

    const updated = storage.saveWatchHistoryItem(historyItem);
    set({ watchHistory: updated });

    // Sync to Firestore if authenticated
    const currentUser = get().user;
    if (currentUser?.uid) {
      saveWatchHistoryToFirestore(currentUser.uid, historyItem).catch((err) => {
        console.warn('Firestore history save warning:', err);
      });
    }
  },

  clearWatchHistory: () => {
    get().haptic(50);
    storage.clearWatchHistory();
    set({ watchHistory: [] });

    const currentUser = get().user;
    if (currentUser?.uid) {
      clearUserWatchHistoryInFirestore(currentUser.uid).catch((err) => {
        console.warn('Firestore history clear warning:', err);
      });
    }
  },

  addDownload: (series: Series, seasonNum: number, episode: Episode) => {
    get().haptic(50);
    const item: DownloadItem = {
      id: `${series.id}_s${seasonNum}_e${episode.episodeNumber}`,
      seriesId: series.id,
      seriesTitle: series.title,
      seasonNum,
      episodeNum: episode.episodeNumber,
      episodeTitle: episode.title,
      thumbnailUrl: episode.thumbnailUrl || series.thumbnailUrl,
      fileSize: `${Math.floor(episode.durationSeconds * 0.42)} MB`,
      quality: '1080p FHD',
      downloadDate: Date.now(),
      videoUrl: episode.videoUrl
    };
    const updated = storage.saveDownload(item);
    set({ downloads: updated });
  },

  deleteDownload: (id: string) => {
    get().haptic(40);
    const updated = storage.removeDownload(id);
    set({ downloads: updated });
  },

  addRecentSearch: (query: string) => {
    const updated = storage.saveRecentSearch(query);
    set({ recentSearches: updated });
  },

  removeRecentSearch: (query: string) => {
    get().haptic(30);
    const updated = storage.removeRecentSearch(query);
    set({ recentSearches: updated });
  },

  clearRecentSearches: () => {
    get().haptic(40);
    storage.clearRecentSearches();
    set({ recentSearches: [] });
  },

  clearAllHistory: () => {
    get().haptic(70);
    storage.clearWatchHistory();
    storage.clearRecentSearches();
    set({ watchHistory: [], recentSearches: [] });

    const currentUser = get().user;
    if (currentUser?.uid) {
      clearUserWatchHistoryInFirestore(currentUser.uid).catch((err) => {
        console.warn('Firestore clear all history warning:', err);
      });
    }
  },

  haptic: (duration = 50) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([duration]);
      }
    } catch {
      // Ignore vibration errors on unsupporting platforms
    }
  }
}));
