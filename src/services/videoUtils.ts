/**
 * Video Utilities for StreamX
 * Handles URL sanitization, cloud drive link conversion, and stream format detection.
 * NEVER returns dummy / AI cartoon videos (Sintel, Bunny, etc.).
 */

export function sanitizeVideoUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();

  // If protocol missing
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }

  // Auto-correct common typo in archive.org or copied links:
  // e.g. "The_Revolutionaries_[Hindi]_1080P_S01_E01.mp4S01_E01.mp4"
  // or "...S01_E04.mp4E04.mp4"
  // or "...S01_E05.mp401_E05.mp4"
  if (/\.mp4[A-Za-z0-9_]+\.mp4$/i.test(url)) {
    url = url.replace(/\.mp4[A-Za-z0-9_]+\.mp4$/i, '.mp4');
  } else if (/\.mp4[A-Za-z0-9_]+$/i.test(url) && !url.includes('?') && !url.includes('#')) {
    url = url.replace(/\.mp4[A-Za-z0-9_]+$/i, '.mp4');
  }

  // Convert Google Drive view URLs to direct downloadable streaming links
  // e.g. https://drive.google.com/file/d/1ABCXYZ/view?usp=sharing
  const gDriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  // Convert Dropbox share links to raw direct media links
  // e.g. https://www.dropbox.com/s/xyz/video.mp4?dl=0 -> raw=1
  if (url.includes('dropbox.com')) {
    if (url.includes('dl=0')) {
      url = url.replace('dl=0', 'raw=1');
    } else if (!url.includes('raw=1')) {
      url += (url.includes('?') ? '&' : '?') + 'raw=1';
    }
    return url;
  }

  return url;
}
