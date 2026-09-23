import { create } from 'zustand';
import { Series, Season, Episode, WatchHistoryItem, DownloadItem, TabType } from './types';
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
  activePlayback: ActivePlayback | null;
  backExitWarning: boolean;
  
  // Series Data
  series: Series[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;

  // LocalStorage State
  watchHistory: WatchHistoryItem[];
  downloads: DownloadItem[];

  // Actions
  setCurrentTab: (tab: TabType) => void;
  setSelectedSeriesId: (id: string | null) => void;
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

  // Haptic trigger
  haptic: (duration?: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentTab: 'home',
  selectedSeriesId: null,
  activePlayback: null,
  backExitWarning: false,

  series: [],
  isLoading: false,
  error: null,
  selectedCategory: 'All',

  watchHistory: storage.getWatchHistory(),
  downloads: storage.getDownloads(),

  setCurrentTab: (tab: TabType) => {
    get().haptic(35);
    set({ currentTab: tab, selectedSeriesId: null });
  },

  setSelectedSeriesId: (id: string | null) => {
    get().haptic(40);
    set({ selectedSeriesId: id });
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
