export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  duration: string;
  durationSeconds: number;
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface Season {
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

export interface Series {
  id: string;
  title: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  category: 'Anime' | 'K-Drama' | 'Action' | 'Sci-Fi' | 'Thriller' | 'Romance' | string;
  rating?: string;
  year?: number;
  description?: string;
  tags?: string[];
  uploadTimestamp: number;
  seasons: Season[];
}

export interface WatchHistoryItem {
  seriesId: string;
  seasonNum: number;
  episodeNum: number;
  timestamp: number;
  // Enriched meta for high-quality Profile UX
  seriesTitle?: string;
  seriesThumbnail?: string;
  episodeTitle?: string;
  progressSeconds?: number;
  durationSeconds?: number;
}

export interface DownloadItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  seasonNum: number;
  episodeNum: number;
  episodeTitle: string;
  thumbnailUrl: string;
  fileSize: string;
  quality: '720p HD' | '1080p FHD' | '480p SD';
  downloadDate: number;
  videoUrl: string;
}

export interface UserProfile {
  email: string;
  name: string;
  isLoggedIn: boolean;
  avatarUrl?: string;
  joinedDate: number;
}

export type TabType = 'home' | 'search' | 'downloads' | 'me';
