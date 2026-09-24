/**
 * StreamX Offline Video Storage Engine
 * Handles 100% offline video downloads and playback:
 * - On Android APK (Native Capacitor): Uses @capacitor/filesystem to download real MP4 files
 *   directly to the app's local offline folder (bypassing browser CORS completely).
 * - On Web / PWA: Uses IndexedDB with streaming chunks for offline playback.
 */

import { Filesystem, Directory, ProgressStatus } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Series, Episode } from '../types';

const DB_NAME = 'StreamX_Offline_DB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_videos';
const OFFLINE_FOLDER = 'StreamX/Videos';

export interface OfflineVideoRecord {
  id: string;
  seriesId: string;
  seasonNum: number;
  episodeNum: number;
  seriesTitle: string;
  episodeTitle: string;
  thumbnailUrl: string;
  fileSize: string;
  sizeBytes: number;
  blob?: Blob;
  mimeType: string;
  downloadDate: number;
  videoUrl: string;
  localPath?: string;
  nativeUri?: string;
}

// Global active blob or file URLs map
const activePlaybackUrls = new Map<string, string>();

/**
 * Returns human-readable storage path for UI display
 */
export function getOfflineStoragePathDescription(): string {
  if (Capacitor.isNativePlatform()) {
    return 'Android/data/com.streamx.app/files/StreamX/Videos/';
  }
  return 'App Local Storage (StreamX/OfflineDB)';
}

/**
 * Open or upgrade the IndexedDB database (used on Web and for metadata sync)
 */
export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this platform.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('seriesId', 'seriesId', { unique: false });
        store.createIndex('downloadDate', 'downloadDate', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store a complete video record in device IndexedDB
 */
export async function saveOfflineVideo(record: OfflineVideoRecord): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB save warning (non-fatal):', e);
  }
}

/**
 * Retrieve an offline video record from IndexedDB
 */
export async function getOfflineVideo(id: string): Promise<OfflineVideoRecord | null> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Helper to construct standard file path for an episode
 */
function getRelativeVideoPath(downloadId: string): string {
  const safeId = downloadId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${OFFLINE_FOLDER}/${safeId}.mp4`;
}

/**
 * Check if a specific episode video is already stored offline
 */
export async function isVideoStoredOffline(id: string): Promise<boolean> {
  // 1. Check native filesystem if running on Android
  if (Capacitor.isNativePlatform()) {
    try {
      const path = getRelativeVideoPath(id);
      const stat = await Filesystem.stat({
        path,
        directory: Directory.Data
      });
      if (stat && stat.size > 0) return true;
    } catch {
      // Not on native filesystem
    }
  }

  // 2. Check IndexedDB
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(id);
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Get an offline URL for playing the video without internet
 * On Android: returns Capacitor convertFileSrc URL (plays directly from app storage)
 * On Web: returns cached Blob URL
 */
export async function getOfflineVideoPlaybackUrl(id: string): Promise<string | null> {
  if (activePlaybackUrls.has(id)) {
    return activePlaybackUrls.get(id)!;
  }

  // 1. Native platform check (Android APK)
  if (Capacitor.isNativePlatform()) {
    try {
      const path = getRelativeVideoPath(id);
      const stat = await Filesystem.stat({
        path,
        directory: Directory.Data
      });

      if (stat && stat.size > 0) {
        const uriResult = await Filesystem.getUri({
          path,
          directory: Directory.Data
        });
        const convertedSrc = Capacitor.convertFileSrc(uriResult.uri);
        activePlaybackUrls.set(id, convertedSrc);
        return convertedSrc;
      }
    } catch (e) {
      console.warn('Native file check for playback note:', e);
    }
  }

  // 2. Web IndexedDB check
  const record = await getOfflineVideo(id);
  if (record?.blob) {
    const url = URL.createObjectURL(record.blob);
    activePlaybackUrls.set(id, url);
    return url;
  }

  return null;
}

/**
 * Delete an offline video from device storage
 */
export async function deleteOfflineVideo(id: string): Promise<void> {
  try {
    if (activePlaybackUrls.has(id)) {
      const url = activePlaybackUrls.get(id)!;
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      activePlaybackUrls.delete(id);
    }

    // 1. If native Android, delete file from app directory
    if (Capacitor.isNativePlatform()) {
      try {
        const path = getRelativeVideoPath(id);
        await Filesystem.deleteFile({
          path,
          directory: Directory.Data
        });
      } catch (err) {
        console.warn('Native delete notice:', err);
      }
    }

    // 2. Delete from IndexedDB
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error deleting offline video:', err);
  }
}

/**
 * List all saved offline videos (metadata only)
 */
export async function getAllOfflineVideos(): Promise<Omit<OfflineVideoRecord, 'blob'>[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result || []) as OfflineVideoRecord[];
        const sanitized = list.map(({ blob, ...rest }) => rest);
        resolve(sanitized);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Download an episode into the app's offline storage folder with live progress:
 * - On Native Android (Capacitor): Uses Filesystem.downloadFile into app's private folder
 * - On Web / Browser: Uses chunked fetch + IndexedDB Blob storage
 */
export async function downloadEpisodeToAppFolder(
  series: Series,
  seasonNum: number,
  episode: Episode,
  onProgress?: (progressPct: number, loadedMB: number, totalMB: number) => void
): Promise<{ success: boolean; offlineUrl?: string; error?: string }> {
  const downloadId = `${series.id}_s${seasonNum}_e${episode.episodeNumber}`;
  const videoUrl = episode.videoUrl;

  if (!videoUrl) {
    return { success: false, error: 'Video URL is missing for this episode.' };
  }

  // ==========================================
  // 1. NATIVE ANDROID DOWNLOAD (Capacitor)
  // ==========================================
  if (Capacitor.isNativePlatform()) {
    try {
      if (onProgress) onProgress(5, 0, 0);

      const targetPath = getRelativeVideoPath(downloadId);

      // Create folder if not exists
      try {
        await Filesystem.mkdir({
          path: OFFLINE_FOLDER,
          directory: Directory.Data,
          recursive: true
        });
      } catch {
        // Folder may already exist
      }

      // Track progress via native listener
      let progressListenerHandle: { remove: () => Promise<void> } | null = null;
      try {
        progressListenerHandle = await Filesystem.addListener(
          'progress',
          (status: ProgressStatus) => {
            if (status.url === videoUrl || !status.url) {
              const loadedMB = parseFloat((status.bytes / (1024 * 1024)).toFixed(1));
              const totalMB = status.contentLength > 0
                ? parseFloat((status.contentLength / (1024 * 1024)).toFixed(1))
                : 0;
              const pct = totalMB > 0
                ? Math.min(99, Math.round((status.bytes / status.contentLength) * 100))
                : 50;

              if (onProgress) {
                onProgress(pct, loadedMB, totalMB);
              }
            }
          }
        );
      } catch (err) {
        console.warn('Progress listener attach note:', err);
      }

      // Perform real native file download directly from server to Android disk
      await Filesystem.downloadFile({
        path: targetPath,
        directory: Directory.Data,
        url: videoUrl,
        recursive: true,
        progress: true
      });

      if (progressListenerHandle) {
        await progressListenerHandle.remove().catch(() => {});
      }

      // Verify downloaded file size
      const stat = await Filesystem.stat({
        path: targetPath,
        directory: Directory.Data
      });

      const uriResult = await Filesystem.getUri({
        path: targetPath,
        directory: Directory.Data
      });

      const finalSizeMB = (stat.size / (1024 * 1024)).toFixed(1);
      const offlineUrl = Capacitor.convertFileSrc(uriResult.uri);
      activePlaybackUrls.set(downloadId, offlineUrl);

      // Save metadata record
      const record: OfflineVideoRecord = {
        id: downloadId,
        seriesId: series.id,
        seasonNum,
        episodeNum: episode.episodeNumber,
        seriesTitle: series.title,
        episodeTitle: episode.title,
        thumbnailUrl: episode.thumbnailUrl || series.thumbnailUrl,
        fileSize: `${finalSizeMB} MB`,
        sizeBytes: stat.size,
        mimeType: 'video/mp4',
        downloadDate: Date.now(),
        videoUrl,
        localPath: targetPath,
        nativeUri: uriResult.uri
      };

      await saveOfflineVideo(record);

      if (onProgress) {
        onProgress(100, parseFloat(finalSizeMB), parseFloat(finalSizeMB));
      }

      return { success: true, offlineUrl };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Native download failed';
      console.error('Android native download error:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // ==========================================
  // 2. WEB / PWA DOWNLOAD (IndexedDB Blob)
  // ==========================================
  try {
    if (onProgress) onProgress(5, 0, 0);

    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        Accept: 'video/*,*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLengthHeader = response.headers.get('content-length');
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
    const totalMB = totalBytes ? parseFloat((totalBytes / (1024 * 1024)).toFixed(1)) : 0;

    let blob: Blob;

    if (response.body && totalBytes > 0) {
      const reader = response.body.getReader();
      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (onProgress) {
          const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
          const loadedMB = parseFloat((receivedBytes / (1024 * 1024)).toFixed(1));
          onProgress(pct, loadedMB, totalMB);
        }
      }

      blob = new Blob(chunks as unknown as BlobPart[], { type: response.headers.get('content-type') || 'video/mp4' });
    } else {
      if (onProgress) onProgress(50, 0, 0);
      blob = await response.blob();
    }

    const finalSizeMB = (blob.size / (1024 * 1024)).toFixed(1);

    const record: OfflineVideoRecord = {
      id: downloadId,
      seriesId: series.id,
      seasonNum,
      episodeNum: episode.episodeNumber,
      seriesTitle: series.title,
      episodeTitle: episode.title,
      thumbnailUrl: episode.thumbnailUrl || series.thumbnailUrl,
      fileSize: `${finalSizeMB} MB`,
      sizeBytes: blob.size,
      blob,
      mimeType: blob.type || 'video/mp4',
      downloadDate: Date.now(),
      videoUrl
    };

    await saveOfflineVideo(record);

    if (onProgress) onProgress(100, parseFloat(finalSizeMB), parseFloat(finalSizeMB));

    const offlineUrl = URL.createObjectURL(blob);
    activePlaybackUrls.set(downloadId, offlineUrl);

    return { success: true, offlineUrl };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Download failed';
    console.warn('Web video download notice:', errorMsg);

    // If browser CORS prevented background fetch, trigger direct browser download link
    const isCorsError = errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError');
    if (isCorsError) {
      try {
        const link = document.createElement('a');
        link.href = videoUrl;
        link.target = '_blank';
        link.download = `${series.title}_S${seasonNum}_E${episode.episodeNumber}.mp4`.replace(/[^a-zA-Z0-9._-]/g, '_');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (_) {}
    }

    return {
      success: false,
      error: isCorsError
        ? 'Direct browser download initiated. File will be saved to your device Downloads folder.'
        : errorMsg
    };
  }
}

/**
 * Save / Export downloaded video directly to Android phone's Downloads or Documents folder
 */
export async function exportVideoToPhoneStorage(
  downloadId: string,
  preferredFileName?: string
): Promise<boolean> {
  try {
    const cleanName = (preferredFileName || `StreamX_${downloadId}.mp4`).replace(/[^a-zA-Z0-9._-]/g, '_');

    // 1. Native platform export
    if (Capacitor.isNativePlatform()) {
      const srcPath = getRelativeVideoPath(downloadId);
      try {
        await Filesystem.copy({
          from: srcPath,
          directory: Directory.Data,
          to: cleanName,
          toDirectory: Directory.Documents
        });
        return true;
      } catch (e) {
        console.warn('Native copy to documents notice:', e);
      }
    }

    // 2. Web export
    const record = await getOfflineVideo(downloadId);
    if (record?.blob) {
      const blobUrl = URL.createObjectURL(record.blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return true;
    }

    return false;
  } catch (err) {
    console.error('Failed to export video to phone storage', err);
    return false;
  }
}
