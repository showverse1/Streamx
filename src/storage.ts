import { WatchHistoryItem, DownloadItem } from './types';

const WATCH_HISTORY_KEY = 'streamx_watch_history';
const DOWNLOADS_KEY = 'streamx_downloads';
const RECENT_SEARCHES_KEY = 'streamx_recent_searches';

export const storage = {
  getRecentSearches(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      }
      return [];
    } catch (e) {
      console.error('Failed to read recent searches from localStorage', e);
      return [];
    }
  },

  saveRecentSearch(query: string): string[] {
    try {
      const trimmed = query.trim();
      if (!trimmed) return storage.getRecentSearches();

      const existing = storage.getRecentSearches();
      // Case-insensitive deduplication
      const filtered = existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save recent search', e);
      return [];
    }
  },

  removeRecentSearch(query: string): string[] {
    try {
      const existing = storage.getRecentSearches();
      const updated = existing.filter((item) => item.toLowerCase() !== query.toLowerCase());
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to remove recent search', e);
      return [];
    }
  },

  clearRecentSearches(): void {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Failed to clear recent searches', e);
    }
  },
  getWatchHistory(): WatchHistoryItem[] {
    try {
      const raw = localStorage.getItem(WATCH_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      return [];
    } catch (e) {
      console.error('Failed to read watch history from localStorage', e);
      return [];
    }
  },

  saveWatchHistoryItem(item: WatchHistoryItem): WatchHistoryItem[] {
    try {
      const existing = storage.getWatchHistory();
      // Remove previous entry for the exact same episode if it exists
      const filtered = existing.filter(
        (h) =>
          !(
            h.seriesId === item.seriesId &&
            h.seasonNum === item.seasonNum &&
            h.episodeNum === item.episodeNum
          )
      );
      const updated = [item, ...filtered];
      // Keep up to 50 recent items
      const trimmed = updated.slice(0, 50);
      localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(trimmed));
      return trimmed;
    } catch (e) {
      console.error('Failed to write watch history to localStorage', e);
      return [];
    }
  },

  isEpisodeWatched(seriesId: string, seasonNum: number, episodeNum: number): boolean {
    try {
      const history = storage.getWatchHistory();
      return history.some(
        (h) =>
          h.seriesId === seriesId &&
          h.seasonNum === seasonNum &&
          h.episodeNum === episodeNum
      );
    } catch {
      return false;
    }
  },

  clearWatchHistory(): void {
    try {
      localStorage.removeItem(WATCH_HISTORY_KEY);
    } catch (e) {
      console.error('Failed to clear watch history', e);
    }
  },

  getDownloads(): DownloadItem[] {
    try {
      const raw = localStorage.getItem(DOWNLOADS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to read downloads from localStorage', e);
      return [];
    }
  },

  saveDownload(item: DownloadItem): DownloadItem[] {
    try {
      const list = storage.getDownloads();
      const filtered = list.filter((d) => d.id !== item.id);
      const updated = [item, ...filtered];
      localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save download', e);
      return [];
    }
  },

  removeDownload(id: string): DownloadItem[] {
    try {
      const list = storage.getDownloads();
      const updated = list.filter((d) => d.id !== id);
      localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to delete download', e);
      return [];
    }
  }
};
