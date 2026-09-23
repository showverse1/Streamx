import { create } from 'zustand';
import { Series, Season, Episode, WatchHistoryItem, DownloadItem, TabType, UserProfile } from './types';
import { fetchSeriesData } from './firebase';
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
  logout: () => void;

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

  login: async (email: string, password: string) => {
    get().haptic(45);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    // Determine display name from email or existing user
    const existing = storage.getUser();
    const displayName = (existing && existing.email === cleanEmail && existing.name)
      ? existing.name
      : cleanEmail.split('@')[0];

    const profile: UserProfile = {
      email: cleanEmail,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      isLoggedIn: true,
      joinedDate: existing?.joinedDate || Date.now()
    };

    storage.saveUser(profile);
    set({ user: profile, isAuthModalOpen: false });
    return { success: true };
  },

  register: async (email: string, password: string, name?: string) => {
    get().haptic(50);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    const displayName = name?.trim() || cleanEmail.split('@')[0];
    const profile: UserProfile = {
      email: cleanEmail,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      isLoggedIn: true,
      joinedDate: Date.now()
    };

    storage.saveUser(profile);
    set({ user: profile, isAuthModalOpen: false });
    return { success: true };
  },

  logout: () => {
    get().haptic(50);
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
  },

  clearWatchHistory: () => {
    get().haptic(50);
    storage.clearWatchHistory();
    set({ watchHistory: [] });
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
