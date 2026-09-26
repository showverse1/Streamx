import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Star,
  CheckCircle2,
  Download,
  Clock,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bookmark,
  Film,
  Sparkles,
  Scaling,
  Sun,
  HardDrive,
  FastForward,
  Rewind,
  SkipForward,
  Gauge,
  Share2,
  Flame,
  Tv,
  Compass,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useAppStore } from '../store';
import { Episode, Series, Season } from '../types';
import { SkeletonImage } from '../components/SkeletonImage';
import { EpisodeComments } from '../components/EpisodeComments';
import { getOfflineVideoPlaybackUrl } from '../services/offlineStorage';
import { sanitizeVideoUrl } from '../services/videoUtils';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar } from '@capacitor/status-bar';

export const SeriesDetail: React.FC = () => {
  const {
    selectedSeriesId,
    setSelectedSeriesId,
    initialEpisodeTarget,
    series,
    watchHistory,
    stopPlayback,
    recordEpisodeWatch,
    addDownload,
    triggerDownloadWithProgress,
    downloads,
    downloadProgress,
    setMiniPlayer,
    haptic
  } = useAppStore();

  const currentSeries = useMemo(() => {
    const found = series.find((s) => s.id === selectedSeriesId);
    if (found) return found;

    // Offline fallback if app booted without internet
    const matchingDownload = downloads.find((d) => d.seriesId === selectedSeriesId);
    if (matchingDownload) {
      return {
        id: matchingDownload.seriesId,
        title: matchingDownload.seriesTitle,
        thumbnailUrl: matchingDownload.thumbnailUrl,
        bannerUrl: matchingDownload.thumbnailUrl,
        category: 'Downloaded',
        rating: '10',
        year: new Date(matchingDownload.downloadDate).getFullYear(),
        description: 'Saved offline title ready for playback with zero internet.',
        tags: ['Offline', 'Downloaded'],
        uploadTimestamp: matchingDownload.downloadDate,
        seasons: [
          {
            seasonNumber: matchingDownload.seasonNum,
            title: `Season ${matchingDownload.seasonNum}`,
            episodes: downloads
              .filter((d) => d.seriesId === matchingDownload.seriesId)
              .map((d) => ({
                id: d.id,
                episodeNumber: d.episodeNum,
                title: d.episodeTitle,
                duration: 'Offline',
                durationSeconds: 3600,
                videoUrl: d.videoUrl,
                thumbnailUrl: d.thumbnailUrl,
                description: 'Offline Video File'
              }))
          }
        ]
      } as Series;
    }
    return undefined;
  }, [series, selectedSeriesId, downloads]);

  const [activeSeasonNum, setActiveSeasonNum] = useState<number>(1);
  const [isPlayingInline, setIsPlayingInline] = useState<boolean>(true);
  const [currentPlayingEpisode, setCurrentPlayingEpisode] = useState<Episode | null>(null);
  const [isOfflinePlaying, setIsOfflinePlaying] = useState<boolean>(false);

  // Aspect Ratio Mode: 'fit' (16:9 contain), 'stretch' (fill container), 'crop' (cover/zoom)
  const [aspectRatioMode, setAspectRatioMode] = useState<'fit' | 'stretch' | 'crop'>('fit');

  // Gestures: Volume (0..1) & Brightness (0.2..1.5)
  const [volume, setVolume] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(1);

  // Gesture HUD Overlay state
  const [gestureHUD, setGestureHUD] = useState<{
    type: 'brightness' | 'volume' | 'seek-forward' | 'seek-backward' | 'seek-swipe' | 'aspect' | 'speed' | 'share' | null;
    value: string | number;
    subValue?: string;
    progress?: number;
    seekDelta?: number;
  }>({ type: null, value: 0 });
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Double-tap Seek Ripple state
  const [ripple, setRipple] = useState<{ side: 'left' | 'right'; key: number } | null>(null);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Touch & pointer gesture tracker refs
  const touchStartRef = useRef<{
    startX: number;
    startY: number;
    time: number;
    initialBrightness: number;
    initialVolume: number;
    initialTime: number;
    gestureMode: 'none' | 'brightness' | 'volume' | 'seek';
    targetSeekTime: number;
    seekDelta: number;
  } | null>(null);

  const lastTapRef = useRef<{ time: number; x: number; y: number; side: 'left' | 'right' } | null>(null);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPointerDownRef = useRef<boolean>(false);

  // Video element state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPaused, setIsVideoPaused] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);
  const [lockToast, setLockToast] = useState<string | null>(null);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState<boolean>(false);
  const unlockPromptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('');
  const [videoError, setVideoError] = useState<boolean>(false);

  const handleLockedScreenTap = () => {
    haptic(30);
    setShowUnlockPrompt(true);
    if (unlockPromptTimeoutRef.current) clearTimeout(unlockPromptTimeoutRef.current);
    unlockPromptTimeoutRef.current = setTimeout(() => {
      setShowUnlockPrompt(false);
    }, 3500);
  };

  // Auto-play immediately on series mount (No manual play button needed!)
  useEffect(() => {
    if (!currentSeries) return;

    let targetSeasonNum = 1;
    let targetEpisode: Episode | undefined;

    if (initialEpisodeTarget) {
      targetSeasonNum = initialEpisodeTarget.seasonNum;
      const season = currentSeries.seasons.find((s) => s.seasonNumber === targetSeasonNum) || currentSeries.seasons[0];
      if (season) {
        targetEpisode = season.episodes.find((e) => e.episodeNumber === initialEpisodeTarget.episodeNum) || season.episodes[0];
      }
    } else {
      // Find last watched episode for this series in watchHistory
      const lastWatched = watchHistory.find((w) => w.seriesId === currentSeries.id);
      if (lastWatched) {
        targetSeasonNum = lastWatched.seasonNum;
        const season = currentSeries.seasons.find((s) => s.seasonNumber === targetSeasonNum) || currentSeries.seasons[0];
        if (season) {
          targetEpisode = season.episodes.find((e) => e.episodeNumber === lastWatched.episodeNum) || season.episodes[0];
        }
      } else {
        const firstSeason = currentSeries.seasons[0];
        targetEpisode = firstSeason?.episodes[0];
        targetSeasonNum = firstSeason?.seasonNumber || 1;
      }
    }

    if (targetEpisode) {
      setActiveSeasonNum(targetSeasonNum);
      setCurrentPlayingEpisode(targetEpisode);
      setIsPlayingInline(true);
      setIsVideoPaused(false);
      if (targetEpisode.videoUrl) {
        setActiveVideoUrl(sanitizeVideoUrl(targetEpisode.videoUrl));
      }
      recordEpisodeWatch(currentSeries, targetSeasonNum, targetEpisode, 0);
    }
  }, [currentSeries?.id, initialEpisodeTarget]);

  // Sync active video url and check for offline stored blob
  useEffect(() => {
    if (!currentPlayingEpisode || !currentSeries) return;

    let isMounted = true;
    const downloadId = `${currentSeries.id}_s${activeSeasonNum}_e${currentPlayingEpisode.episodeNumber}`;

    getOfflineVideoPlaybackUrl(downloadId).then((offlineUrl) => {
      if (!isMounted) return;
      if (offlineUrl) {
        setActiveVideoUrl(offlineUrl);
        setIsOfflinePlaying(true);
      } else if (currentPlayingEpisode.videoUrl) {
        setActiveVideoUrl(sanitizeVideoUrl(currentPlayingEpisode.videoUrl));
        setIsOfflinePlaying(false);
      }
      setVideoError(false);
    });

    return () => {
      isMounted = false;
    };
  }, [currentPlayingEpisode?.id, currentPlayingEpisode?.videoUrl, currentSeries?.id, activeSeasonNum]);

  // Handle exiting SeriesDetail with automatic Picture-in-Picture
  const handleExitWithPiP = () => {
    haptic(40);
    if (isFullscreen) {
      setIsFullscreen(false);
      try {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      } catch (_) {}
      try {
        ScreenOrientation.unlock().catch(() => {});
      } catch (_) {}
      try {
        StatusBar.show().catch(() => {});
      } catch (_) {}
    }

    if (currentSeries && currentPlayingEpisode && !isVideoPaused && currentTime > 0) {
      // 1. Try system native Picture-in-Picture
      try {
        if (
          typeof document !== 'undefined' &&
          'pictureInPictureEnabled' in document &&
          document.pictureInPictureEnabled &&
          videoRef.current
        ) {
          videoRef.current.requestPictureInPicture().catch(() => {});
        }
      } catch {
        // Continue to in-app PiP
      }

      // 2. Set in-app floating MiniPlayer
      setMiniPlayer({
        series: currentSeries,
        seasonNum: activeSeasonNum,
        episode: currentPlayingEpisode,
        currentTime: videoRef.current ? videoRef.current.currentTime : currentTime,
        isPaused: false
      });
    }

    setSelectedSeriesId(null);
  };

  const handleVideoError = () => {
    console.warn('Playback error for uploaded video stream:', activeVideoUrl);
    // Never silently replace the user's video with dummy AI animations!
    setVideoError(true);
    setIsBuffering(false);
  };

  const handleReloadVideo = () => {
    if (!currentPlayingEpisode) return;
    setVideoError(false);
    setIsBuffering(true);
    const cleaned = sanitizeVideoUrl(currentPlayingEpisode.videoUrl);
    setActiveVideoUrl('');
    setTimeout(() => {
      setActiveVideoUrl(cleaned);
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    }, 50);
  };

  // Sync active season
  const activeSeason = useMemo(() => {
    if (!currentSeries) return null;
    return currentSeries.seasons.find((s) => s.seasonNumber === activeSeasonNum) || currentSeries.seasons[0];
  }, [currentSeries, activeSeasonNum]);

  // Identify whether content is Movie or Web Series
  const isMovie = useMemo(() => {
    if (!currentSeries) return false;
    const cat = (currentSeries.category || '').toLowerCase();
    if (cat === 'movie' || cat === 'movies' || cat === 'cinema' || cat === 'film') return true;
    const totalEps = currentSeries.seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0);
    return currentSeries.seasons.length <= 1 && totalEps <= 1;
  }, [currentSeries]);

  const totalEpisodesCount = useMemo(() => {
    if (!currentSeries) return 0;
    return currentSeries.seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0);
  }, [currentSeries]);

  // Check if an episode is marked 'watched' in Watch History (LocalStorage)
  const isEpisodeWatched = (epNum: number, seasonNum = activeSeason?.seasonNumber || 1) => {
    if (!currentSeries) return false;
    return watchHistory.some(
      (item) =>
        item.seriesId === currentSeries.id &&
        item.seasonNum === seasonNum &&
        item.episodeNum === epNum
    );
  };

  // Helper to check if an episode is downloaded
  const isEpisodeDownloaded = (epNum: number, seasonNum = activeSeason?.seasonNumber || 1) => {
    if (!currentSeries) return false;
    return downloads.some(
      (d) =>
        d.seriesId === currentSeries.id &&
        d.seasonNum === seasonNum &&
        d.episodeNum === epNum
    );
  };

  // Instant Autoplay function when any episode is clicked
  const handlePlayEpisode = (episode: Episode, seasonNum = activeSeason?.seasonNumber || 1) => {
    if (!currentSeries) return;
    haptic(60);

    setCurrentPlayingEpisode(episode);
    setActiveSeasonNum(seasonNum);
    setIsPlayingInline(true);
    setIsVideoPaused(false);

    // Save exact episode played to watch history immediately
    recordEpisodeWatch(currentSeries, seasonNum, episode, 0);

    // Scroll to top so the video player is in view
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Explicit immediate play attempt
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Direct autoplay blocked, retrying with muted state:', err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  };

  // Autoplay trigger on episode change
  useEffect(() => {
    if (isPlayingInline && currentPlayingEpisode && videoRef.current) {
      setIsVideoPaused(false);
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay caught:', err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [currentPlayingEpisode, isPlayingInline]);

  // Handle CTA resume/play button
  const firstOrResumeEpisode = useMemo(() => {
    if (!activeSeason || activeSeason.episodes.length === 0) return null;
    const unwatched = activeSeason.episodes.find((ep) => !isEpisodeWatched(ep.episodeNumber, activeSeason.seasonNumber));
    return unwatched || activeSeason.episodes[0];
  }, [activeSeason, watchHistory]);

  // Currently displayed or playing episode
  const activeEpisodeForDetails = useMemo(() => {
    if (currentPlayingEpisode) return currentPlayingEpisode;
    return firstOrResumeEpisode || activeSeason?.episodes[0] || null;
  }, [currentPlayingEpisode, firstOrResumeEpisode, activeSeason]);

  // Recommended Anime & Movies filter and listing
  const [recommendedFilter, setRecommendedFilter] = useState<string>('All');

  const recommendedItems = useMemo(() => {
    if (!currentSeries) return [];
    const others = series.filter((s) => s.id !== currentSeries.id);

    if (recommendedFilter === 'All') {
      return [...others].sort((a, b) => {
        const aCatMatch = a.category.toLowerCase() === currentSeries.category.toLowerCase();
        const bCatMatch = b.category.toLowerCase() === currentSeries.category.toLowerCase();
        if (aCatMatch && !bCatMatch) return -1;
        if (!aCatMatch && bCatMatch) return 1;
        return (b.uploadTimestamp || 0) - (a.uploadTimestamp || 0);
      });
    }

    if (recommendedFilter === 'Anime') {
      return others.filter((s) =>
        s.category.toLowerCase().includes('anime') ||
        s.title.toLowerCase().includes('anime') ||
        s.tags?.some((t) => t.toLowerCase().includes('anime'))
      );
    }

    if (recommendedFilter === 'Movies') {
      return others.filter((s) =>
        s.category.toLowerCase().includes('movie') ||
        s.title.toLowerCase().includes('movie') ||
        (s.seasons?.length === 1 && s.seasons[0]?.episodes?.length === 1)
      );
    }

    return others.filter((s) =>
      s.category.toLowerCase().includes(recommendedFilter.toLowerCase())
    );
  }, [series, currentSeries, recommendedFilter]);

  const handleSelectRecommended = (item: Series) => {
    haptic(45);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedSeriesId(item.id);
  };

  // Video time update handler
  const handleTimeUpdate = () => {
    if (!videoRef.current || !currentSeries || !currentPlayingEpisode || !activeSeason) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    const vidDur = videoRef.current.duration;
    if (vidDur && !isNaN(vidDur) && isFinite(vidDur) && vidDur > 0 && Math.abs(duration - vidDur) > 0.5) {
      setDuration(vidDur);
    }

    // Periodically update watch history progress
    if (Math.floor(curr) % 5 === 0 && Math.floor(curr) > 0) {
      recordEpisodeWatch(currentSeries, activeSeason.seasonNumber, currentPlayingEpisode, Math.floor(curr));
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const vidDur = videoRef.current.duration;
    const validDur = (vidDur && !isNaN(vidDur) && isFinite(vidDur) && vidDur > 0) ? vidDur : 0;
    setDuration(validDur);
    if (initialEpisodeTarget?.startAtSecond && initialEpisodeTarget.startAtSecond > 0) {
      videoRef.current.currentTime = initialEpisodeTarget.startAtSecond;
    }
    // Guarantee auto-play when video metadata is loaded
    videoRef.current.play().catch(() => {});
  };

  const handleCanPlay = () => {
    if (videoRef.current && isPlayingInline) {
      videoRef.current.play().catch(() => {});
    }
  };

  const lastTouchEndTimestamp = useRef<number>(0);

  // Auto-hide controls timer (Strict 4s during playback, never hide while paused!)
  const startControlsHideTimer = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    // When paused, do NOT auto-hide controls so user can see and tap buttons easily!
    if (isVideoPaused || (videoRef.current && videoRef.current.paused)) {
      return;
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  const showAndScheduleHideControls = () => {
    setShowControls(true);
    startControlsHideTimer();
  };

  const handleScreenTap = () => {
    haptic(30);
    setShowControls((prev) => {
      const next = !prev;
      if (next) {
        startControlsHideTimer();
      } else if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
      return next;
    });
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // If recently tapped on touch screen, ignore synthetic mouse click to prevent double toggle
    if (Date.now() - lastTouchEndTimestamp.current < 450) {
      return;
    }
    handleScreenTap();
  };

  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic(40);
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsVideoPaused(false);
        startControlsHideTimer();
      }).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsVideoPaused(true);
      setShowControls(true); // Keep controls open while paused!
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
  };

  const cyclePlaybackSpeed = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic(35);
    startControlsHideTimer();
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    triggerHUD('speed', `${nextSpeed}x`);
  };

  const playNextEpisode = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic(40);
    if (!activeSeason || !currentPlayingEpisode) return;
    const currentIndex = activeSeason.episodes.findIndex((ep) => ep.id === currentPlayingEpisode.id);
    if (currentIndex >= 0 && currentIndex < activeSeason.episodes.length - 1) {
      handlePlayEpisode(activeSeason.episodes[currentIndex + 1]);
    }
  };

  const triggerHUD = (
    type: 'brightness' | 'volume' | 'seek-forward' | 'seek-backward' | 'seek-swipe' | 'aspect' | 'speed' | 'share',
    value: string | number,
    extra?: { subValue?: string; progress?: number; seekDelta?: number; autoHideMs?: number }
  ) => {
    setGestureHUD({
      type,
      value,
      subValue: extra?.subValue,
      progress: extra?.progress,
      seekDelta: extra?.seekDelta
    });
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setGestureHUD({ type: null, value: 0 });
    }, extra?.autoHideMs ?? 1200);
  };

  const triggerRipple = (side: 'left' | 'right') => {
    setRipple({ side, key: Date.now() });
    if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
    rippleTimeoutRef.current = setTimeout(() => {
      setRipple(null);
    }, 700);
  };

  const cycleAspectRatio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic(40);
    startControlsHideTimer();
    setAspectRatioMode((prev) => {
      const next = prev === 'fit' ? 'stretch' : prev === 'stretch' ? 'crop' : 'fit';
      const label = next === 'fit' ? 'Fit (16:9)' : next === 'stretch' ? 'Stretch (Fill)' : 'Crop (Zoom)';
      triggerHUD('aspect', label);
      return next;
    });
  };

  const handleShareVideo = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic(40);
    startControlsHideTimer();
    const epTitle = currentPlayingEpisode?.title ? ` - ${currentPlayingEpisode.title}` : '';
    const shareTitle = `${currentSeries?.title || 'StreamX Video'}${epTitle}`;
    const shareText = `Watch ${shareTitle} on StreamX Neon Cinema!`;
    const shareUrl = window.location.href;

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ title: shareTitle, text: shareText, url: shareUrl })) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (_) {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        triggerHUD('share', 'Link Copied');
      } catch (_) {}
    }
  };

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    haptic(30);
    startControlsHideTimer();
    const vid = videoRef.current;
    const current = vid.currentTime || currentTime || 0;
    const dur = vid.duration && !isNaN(vid.duration) && isFinite(vid.duration) && vid.duration > 0
      ? vid.duration
      : (duration > 0 ? duration : 0);

    let target = current + seconds;
    if (dur > 0) {
      target = Math.max(0, Math.min(target, dur));
    } else {
      target = Math.max(0, target);
    }

    vid.currentTime = target;
    setCurrentTime(target);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    startControlsHideTimer();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * (duration || 1);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic(30);
    startControlsHideTimer();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Fullscreen change & Orientation sync
  useEffect(() => {
    const handleFSChange = () => {
      const isFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFS);
      if (!isFS) {
        try {
          ScreenOrientation.unlock().catch(() => {});
          StatusBar.show().catch(() => {});
        } catch (_) {}
        try {
          const screenAny = screen as unknown as { orientation?: { unlock?: () => void } };
          if (screenAny.orientation && typeof screenAny.orientation.unlock === 'function') {
            screenAny.orientation.unlock();
          }
        } catch (_) {}
      }
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
      try {
        ScreenOrientation.unlock().catch(() => {});
        StatusBar.show().catch(() => {});
      } catch (_) {}
      try {
        const screenAny = screen as unknown as { orientation?: { unlock?: () => void } };
        if (screenAny.orientation && typeof screenAny.orientation.unlock === 'function') {
          screenAny.orientation.unlock();
        }
      } catch (_) {}
    };
  }, []);

  const toggleFullscreen = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic(50);
    const container = document.getElementById('inline-video-container');
    if (!container) return;

    const isCurrentFS = isFullscreen || !!(document.fullscreenElement || (document as any).webkitFullscreenElement);

    if (!isCurrentFS) {
      const req = container.requestFullscreen || (container as any).webkitRequestFullscreen;
      if (req) {
        try {
          await req.call(container);
          setIsFullscreen(true);
        } catch (_) {
          setIsFullscreen(true);
        }
      } else {
        setIsFullscreen(true);
      }

      // Hide Android phone status bar and gesture navigation bar for edge-to-edge landscape
      try {
        await StatusBar.hide();
      } catch (_) {}

      // Rotate and lock phone screen to landscape natively on Android APK & Web
      try {
        await ScreenOrientation.lock({ orientation: 'landscape' });
      } catch (_) {
        try {
          const screenAny = screen as unknown as { orientation?: { lock?: (orient: string) => Promise<void> } };
          if (screenAny.orientation && typeof screenAny.orientation.lock === 'function') {
            await screenAny.orientation.lock('landscape').catch(() => {});
          }
        } catch (_) {}
      }
    } else {
      setIsScreenLocked(false);
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen;
      if (exit) {
        try {
          await exit.call(document);
          setIsFullscreen(false);
        } catch (_) {
          setIsFullscreen(false);
        }
      } else {
        setIsFullscreen(false);
      }

      // Restore Android status bar
      try {
        await StatusBar.show();
      } catch (_) {}

      // Unlock back to portrait orientation
      try {
        await ScreenOrientation.unlock();
      } catch (_) {
        try {
          const screenAny = screen as unknown as { orientation?: { unlock?: () => void } };
          if (screenAny.orientation && typeof screenAny.orientation.unlock === 'function') {
            screenAny.orientation.unlock();
          }
        } catch (_) {}
      }
    }
    startControlsHideTimer();
  };

  // On episode change or series mount, show controls and auto-hide after 3 seconds
  useEffect(() => {
    showAndScheduleHideControls();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [currentPlayingEpisode?.id]);

  // Universal gesture controller for mobile touch and desktop mouse swipe
  const startGesture = (clientX: number, clientY: number, containerRect: DOMRect) => {
    if (isScreenLocked) return;
    const x = clientX - containerRect.left;
    const y = clientY - containerRect.top;

    touchStartRef.current = {
      startX: x,
      startY: y,
      time: Date.now(),
      initialBrightness: brightness,
      initialVolume: videoRef.current ? videoRef.current.volume : volume,
      initialTime: videoRef.current ? videoRef.current.currentTime : currentTime,
      gestureMode: 'none',
      targetSeekTime: videoRef.current ? videoRef.current.currentTime : currentTime,
      seekDelta: 0
    };
  };

  const moveGesture = (clientX: number, clientY: number, containerRect: DOMRect) => {
    if (!touchStartRef.current) return;
    const tracker = touchStartRef.current;
    const currentX = clientX - containerRect.left;
    const currentY = clientY - containerRect.top;

    const deltaX = currentX - tracker.startX; // Rightward swipe = forward, leftward = rewind
    const deltaY = tracker.startY - currentY; // Upward swipe = increase, downward = decrease

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine gesture mode if not locked in yet
    if (tracker.gestureMode === 'none') {
      if (absY > 8 && absY > absX) {
        // Vertical swipe!
        if (tracker.startX <= containerRect.width * 0.5) {
          tracker.gestureMode = 'brightness';
          haptic(25);
        } else {
          tracker.gestureMode = 'volume';
          haptic(25);
        }
      } else if (absX > 10 && absX > absY) {
        // Horizontal swipe -> Seek gesture!
        tracker.gestureMode = 'seek';
        haptic(25);
      }
    }

    // Process active gesture
    if (tracker.gestureMode === 'brightness') {
      const height = containerRect.height || 260;
      const change = deltaY / (height * 0.7);
      const newBrightness = Math.max(0.15, Math.min(1.5, tracker.initialBrightness + change * 1.5));
      setBrightness(newBrightness);
      const pct = Math.round((newBrightness / 1.5) * 100);
      triggerHUD('brightness', `${pct}%`, {
        progress: (newBrightness - 0.15) / (1.5 - 0.15),
        autoHideMs: 1400
      });
    } else if (tracker.gestureMode === 'volume') {
      const height = containerRect.height || 260;
      const change = deltaY / (height * 0.7);
      const newVolume = Math.max(0, Math.min(1.0, tracker.initialVolume + change * 1.5));
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        videoRef.current.muted = newVolume === 0;
      }
      setIsMuted(newVolume === 0);
      const pct = Math.round(newVolume * 100);
      triggerHUD('volume', `${pct}%`, {
        progress: newVolume,
        autoHideMs: 1400
      });
    } else if (tracker.gestureMode === 'seek') {
      const width = containerRect.width || 400;
      const totalDur = duration || currentPlayingEpisode?.durationSeconds || 180;
      const maxScrubRange = Math.max(60, Math.min(totalDur * 0.45, 300));
      const swipeRatio = deltaX / (width * 0.65);
      const deltaSec = Math.round(swipeRatio * maxScrubRange);

      const targetTime = Math.max(0, Math.min(totalDur, tracker.initialTime + deltaSec));
      tracker.targetSeekTime = targetTime;
      tracker.seekDelta = deltaSec;

      const progress = totalDur > 0 ? targetTime / totalDur : 0;
      const deltaSign = deltaSec >= 0 ? '+' : '';
      const formattedTarget = formatSeconds(targetTime);
      const formattedTotal = formatSeconds(totalDur);

      triggerHUD('seek-swipe', `${deltaSign}${deltaSec}s`, {
        subValue: `${formattedTarget} / ${formattedTotal}`,
        progress,
        seekDelta: deltaSec,
        autoHideMs: 1600
      });
    }
  };

  const endGesture = (containerRect: DOMRect) => {
    if (!touchStartRef.current) return;
    const tracker = touchStartRef.current;
    const now = Date.now();

    if (tracker.gestureMode === 'seek') {
      if (videoRef.current) {
        videoRef.current.currentTime = tracker.targetSeekTime;
        setCurrentTime(tracker.targetSeekTime);
        haptic(50);
      }
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
      hudTimeoutRef.current = setTimeout(() => {
        setGestureHUD({ type: null, value: 0 });
      }, 800);
      touchStartRef.current = null;
      return;
    }

    if (tracker.gestureMode === 'brightness' || tracker.gestureMode === 'volume') {
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
      hudTimeoutRef.current = setTimeout(() => {
        setGestureHUD({ type: null, value: 0 });
      }, 800);
      touchStartRef.current = null;
      return;
    }

    touchStartRef.current = null;
  };

  // Dedicated YouTube-style Double Tap / Click coordinator
  const performDoubleTapSeek = (side: 'left' | 'right') => {
    if (isScreenLocked) return;
    haptic(45);
    if (side === 'right') {
      handleSeek(10);
      triggerRipple('right');
    } else {
      handleSeek(-10);
      triggerRipple('left');
    }
  };

  const handlePointerZoneClick = (side: 'left' | 'right', clientX: number, clientY: number) => {
    if (isScreenLocked) {
      handleLockedScreenTap();
      return;
    }
    const now = Date.now();
    const last = lastTapRef.current;

    // Detect double click / double tap (within 380ms on same side or nearby)
    if (last && (now - last.time) < 380 && (last.side === side || Math.abs(clientX - last.x) < 120)) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapRef.current = null;
      performDoubleTapSeek(side);
      return;
    }

    // First tap candidate: wait 260ms before toggling controls overlay
    lastTapRef.current = { time: now, x: clientX, y: clientY, side };
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
    }
    singleTapTimeoutRef.current = setTimeout(() => {
      lastTapRef.current = null;
      handleScreenTap();
    }, 260);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    startGesture(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    moveGesture(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.getBoundingClientRect());
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    endGesture(e.currentTarget.getBoundingClientRect());
  };

  // Mouse drag handlers for desktop support
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isPointerDownRef.current = true;
    startGesture(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    moveGesture(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    endGesture(e.currentTarget.getBoundingClientRect());
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      endGesture(e.currentTarget.getBoundingClientRect());
    }
  };

  // Mouse Double Click handler (Desktop/Browser native fallback)
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width || 360;
    const side: 'left' | 'right' = x > width * 0.5 ? 'right' : 'left';
    performDoubleTapSeek(side);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
      if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
      if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
    };
  }, []);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentSeries || !activeSeason) return null;

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 pb-24 select-none">
      {/* ========================================================================= */}
      {/* TOP HALF: Show Series Poster by default; Replace with 16:9 Inline Player */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-40 bg-[#090a0f] shadow-2xl">
        {isPlayingInline && currentPlayingEpisode ? (
          /* 16:9 YouTube-Style Inline Video Player with AutoPlay & Custom Gestures */
          <div
            id="inline-video-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
            className={`relative w-full overflow-hidden group select-none touch-none outline-none ring-0 focus:outline-none [-webkit-tap-highlight-color:transparent] transition-all duration-300 ${
              isFullscreen
                ? 'fixed inset-0 z-[100] w-screen h-screen bg-black flex items-center justify-center'
                : 'aspect-video bg-black'
            }`}
          >
            <video
              ref={videoRef}
              key={activeVideoUrl || currentPlayingEpisode.id}
              src={activeVideoUrl || currentPlayingEpisode.videoUrl}
              autoPlay
              playsInline
              onLoadStart={() => setIsBuffering(true)}
              onWaiting={() => setIsBuffering(true)}
              onSeeking={() => setIsBuffering(true)}
              onCanPlay={() => {
                setIsBuffering(false);
                handleCanPlay();
              }}
              onPlaying={() => setIsBuffering(false)}
              onSeeked={() => setIsBuffering(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onEnded={() => {
                // Auto-play next episode in series if available
                const currentIndex = activeSeason.episodes.findIndex((e) => e.id === currentPlayingEpisode.id);
                if (currentIndex >= 0 && currentIndex < activeSeason.episodes.length - 1) {
                  handlePlayEpisode(activeSeason.episodes[currentIndex + 1]);
                } else {
                  setIsVideoPaused(true);
                }
              }}
              style={{
                filter: `brightness(${brightness})`
              }}
              className={`w-full h-full bg-black cursor-pointer transition-all duration-150 ${
                aspectRatioMode === 'stretch'
                  ? 'object-fill'
                  : aspectRatioMode === 'crop'
                  ? 'object-cover'
                  : 'object-contain'
              }`}
            />

            {/* Split Screen Left & Right Interactive Hitbox Zones for Single/Double Tap */}
            <div
              className={`absolute inset-y-0 left-0 w-1/2 cursor-pointer select-none [-webkit-tap-highlight-color:transparent] ${
                !showControls || isScreenLocked ? 'z-30' : 'z-20'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handlePointerZoneClick('left', e.clientX, e.clientY);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                performDoubleTapSeek('left');
              }}
              aria-label="Rewind 10 seconds double tap"
            />
            <div
              className={`absolute inset-y-0 right-0 w-1/2 cursor-pointer select-none [-webkit-tap-highlight-color:transparent] ${
                !showControls || isScreenLocked ? 'z-30' : 'z-20'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handlePointerZoneClick('right', e.clientX, e.clientY);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                performDoubleTapSeek('right');
              }}
              aria-label="Forward 10 seconds double tap"
            />

            {/* Network Buffering / Loading Spinning Circle (Silent, sleek, no text, premium dual-ring glow) */}
            {isBuffering && !videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-25 pointer-events-none transition-all">
                <div className="relative flex items-center justify-center p-3 rounded-full bg-black/60 border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                  {/* Outer glowing spinning ring */}
                  <div className="w-12 h-12 rounded-full border-[3px] border-white/20 border-t-white border-r-white/80 animate-spin shadow-[0_0_20px_rgba(255,255,255,0.6)]" />
                  {/* Inner neon reverse spinning ring */}
                  <div className="w-7 h-7 rounded-full border-2 border-transparent border-t-cyan-400 border-b-cyan-300 animate-spin [animation-direction:reverse] [animation-duration:0.85s] absolute shadow-[0_0_12px_rgba(0,243,255,0.7)]" />
                  {/* Center glowing core dot */}
                  <div className="w-2 h-2 rounded-full bg-white absolute animate-pulse shadow-[0_0_8px_#ffffff]" />
                </div>
              </div>
            )}

            {/* Video Error Recovery Overlay */}
            {videoError && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in duration-150">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
                  <Film className="w-6 h-6" />
                </div>
                <p className="text-white font-bold text-sm mb-1">Video Stream Notice</p>
                <p className="text-slate-300 text-xs mb-1 max-w-md line-clamp-2">
                  {currentPlayingEpisode.title}
                </p>
                <p className="text-slate-400 text-[11px] mb-4 max-w-sm">
                  Video stream link could not be loaded directly. Tap below to reload.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReloadVideo();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Retry Video</span>
                  </button>
                  {activeVideoUrl && (
                    <a
                      href={activeVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
                    >
                      Open Link
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Double Tap Left Side Feedback (-10s) - Clean minimal 10s */}
            {ripple?.side === 'left' && (
              <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
                <div className="absolute -left-1/4 w-[130%] h-[130%] rounded-r-[100%] bg-gradient-to-r from-white/15 via-white/5 to-transparent backdrop-blur-[1px] animate-in fade-in duration-150" />
                <div className="relative px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/30 text-white shadow-xl animate-in zoom-in-90 duration-150">
                  <span className="font-black text-sm font-mono text-white tracking-wider">
                    10s
                  </span>
                </div>
              </div>
            )}

            {/* Double Tap Right Side Feedback (+10s) - Clean minimal 10s */}
            {ripple?.side === 'right' && (
              <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
                <div className="absolute -right-1/4 w-[130%] h-[130%] rounded-l-[100%] bg-gradient-to-l from-white/15 via-white/5 to-transparent backdrop-blur-[1px] animate-in fade-in duration-150" />
                <div className="relative px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/30 text-white shadow-xl animate-in zoom-in-90 duration-150">
                  <span className="font-black text-sm font-mono text-white tracking-wider">
                    10s
                  </span>
                </div>
              </div>
            )}

            {/* Seek Swipe Top Floating Pill (No square box, clean floating pill) */}
            {gestureHUD.type === 'seek-swipe' && (
              <div className="absolute top-5 inset-x-0 flex items-center justify-center pointer-events-none z-35 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-white shadow-2xl">
                  {(gestureHUD.seekDelta ?? 0) < 0 ? (
                    <Rewind className="w-4 h-4 text-rose-400 animate-pulse" />
                  ) : (
                    <FastForward className="w-4 h-4 text-rose-400 animate-pulse" />
                  )}
                  <span className="font-mono text-sm font-extrabold text-white">
                    {gestureHUD.value}
                  </span>
                  {gestureHUD.subValue && (
                    <span className="font-mono text-xs text-rose-300 font-semibold pl-2 border-l border-white/20">
                      {gestureHUD.subValue}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Volume, Brightness, Screen Fit, Speed & Quick Seek Pills */}
            {gestureHUD.type && gestureHUD.type !== 'seek-swipe' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-35 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 bg-black/85 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/15 text-white shadow-2xl">
                  {gestureHUD.type === 'brightness' && <Sun className="w-4 h-4 text-amber-400 animate-pulse" />}
                  {gestureHUD.type === 'volume' && (isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-rose-500" />)}
                  {gestureHUD.type === 'seek-backward' && <RotateCcw className="w-4 h-4 text-rose-400" />}
                  {gestureHUD.type === 'seek-forward' && <RotateCw className="w-4 h-4 text-rose-400" />}
                  {gestureHUD.type === 'aspect' && <Scaling className="w-4 h-4 text-sky-400" />}
                  {gestureHUD.type === 'speed' && <Gauge className="w-4 h-4 text-emerald-400" />}

                  <span className="font-bold text-xs tracking-wider uppercase text-slate-300">
                    {gestureHUD.type === 'brightness'
                      ? 'Brightness'
                      : gestureHUD.type === 'volume'
                      ? 'Volume'
                      : gestureHUD.type === 'aspect'
                      ? 'Screen Fit'
                      : gestureHUD.type === 'speed'
                      ? 'Speed'
                      : 'Seek'}
                  </span>

                  <span className="font-mono text-sm font-extrabold text-white">
                    {gestureHUD.value}
                  </span>

                  {(gestureHUD.type === 'volume' || gestureHUD.type === 'brightness') && (
                    <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-75 ${
                          gestureHUD.type === 'brightness' ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{
                          width: `${Math.max(0, Math.min(100, (gestureHUD.progress ?? 0) * 100))}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fullscreen Tap to Lock / Unlock Side Button ("iska button side me kerna taki acha lage") */}
            {isFullscreen && (
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 select-none">
                {isScreenLocked ? (
                  /* Screen is Locked: Tap anywhere shows floating Unlock button with neon glow */
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic(60);
                      setIsScreenLocked(false);
                      setShowControls(true);
                      setLockToast('Screen Unlocked');
                      setTimeout(() => setLockToast(null), 2000);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full bg-rose-600/90 hover:bg-rose-500 backdrop-blur-md border-2 border-white text-white shadow-[0_0_22px_rgba(244,63,94,0.85)] active:scale-90 transition-all cursor-pointer ${
                      showUnlockPrompt ? 'opacity-100 scale-100 animate-pulse' : 'opacity-80 scale-95 hover:opacity-100'
                    }`}
                    title="Tap to Unlock Screen"
                    aria-label="Tap to Unlock Screen"
                  >
                    <Lock className="w-4 h-4 text-white" />
                    <span className="text-[10px] font-black tracking-wider uppercase drop-shadow">Unlock</span>
                  </button>
                ) : (
                  /* Screen is Unlocked: Lock button shows on side when controls are visible */
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic(50);
                      setIsScreenLocked(true);
                      setShowControls(false);
                      setShowUnlockPrompt(true);
                      setLockToast('Screen Locked');
                      setTimeout(() => {
                        setLockToast(null);
                        setShowUnlockPrompt(false);
                      }, 2500);
                    }}
                    className={`p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/50 text-white shadow-[0_0_14px_rgba(255,255,255,0.3)] active:scale-90 transition-all cursor-pointer flex items-center justify-center group ${
                      showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    title="Lock Screen Controls"
                    aria-label="Lock Screen Controls"
                  >
                    <Unlock className="w-4 h-4 text-white group-hover:text-cyan-300" />
                  </button>
                )}
              </div>
            )}

            {/* Lock/Unlock Toast Alert */}
            {lockToast && (
              <div className="absolute top-6 inset-x-0 flex items-center justify-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/90 backdrop-blur-md border border-white/40 text-white text-xs font-bold shadow-2xl">
                  {lockToast.includes('Locked') ? (
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{lockToast}</span>
                </div>
              </div>
            )}

            {/* Video Controls Overlay - Auto-hides during playback, stays visible when paused, fully disabled when locked or hidden */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/70 flex flex-col justify-between p-3 sm:p-4 transition-all duration-300 z-25 ${
                showControls && !isScreenLocked
                  ? 'opacity-100 pointer-events-auto visible'
                  : 'opacity-0 pointer-events-none select-none invisible'
              }`}
            >
              {/* Top Controls Bar */}
              <div className={`flex items-center justify-between gap-2 ${showControls && !isScreenLocked ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExitWithPiP();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 text-xs font-semibold border border-white/10 shrink-0"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <div className="flex flex-col min-w-0 hidden xs:flex">
                    <span className="text-white text-xs font-bold truncate max-w-[140px] sm:max-w-[240px] drop-shadow">
                      {currentPlayingEpisode.title}
                    </span>
                    <span className="text-slate-400 text-[10px] truncate max-w-[140px] sm:max-w-[240px]">
                      {currentSeries.title}
                    </span>
                  </div>

                  {isOfflinePlaying && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <HardDrive className="w-3 h-3" />
                      <span>Offline</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Share Video Button */}
                  <button
                    type="button"
                    onClick={handleShareVideo}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 border border-white/15 transition shadow"
                    title="Share Video"
                    aria-label="Share Video"
                  >
                    <Share2 className="w-4 h-4 text-cyan-300" />
                  </button>

                  {/* Playback Speed Toggle */}
                  <button
                    type="button"
                    onClick={cyclePlaybackSpeed}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 text-xs font-bold border border-white/15 transition shadow"
                    title="Playback Speed"
                  >
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-bold font-mono">{playbackRate}x</span>
                  </button>

                  {/* Stretch / Crop / Fit Toggle Option */}
                  <button
                    type="button"
                    onClick={cycleAspectRatio}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 text-xs font-bold border border-white/15 transition shadow"
                    title="Toggle Aspect Ratio (Fit / Stretch / Crop)"
                  >
                    <Scaling className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="capitalize text-[11px] font-bold">
                      {aspectRatioMode === 'fit' ? 'Fit' : aspectRatioMode === 'stretch' ? 'Stretch' : 'Crop'}
                    </span>
                  </button>

                  <span className="px-2 py-0.5 rounded bg-black/80 border border-cyan-400/60 shadow-[0_0_8px_rgba(0,243,255,0.4)] font-bold text-[10px] uppercase tracking-wider text-cyan-300">
                    S{activeSeason.seasonNumber}:E{currentPlayingEpisode.episodeNumber}
                  </span>

                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 border border-white/15"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-fuchsia-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Center Play/Pause, Rewind, Forward, & Next Buttons with Visible Crisp White Structure */}
              <div className="my-auto flex items-center justify-center pointer-events-none">
                <div
                  className={`flex items-center justify-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border-2 border-white/80 shadow-[0_0_24px_rgba(255,255,255,0.3)] transition-all ${
                    showControls && !isScreenLocked ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0 invisible select-none'
                  }`}
                >
                  {/* 10s Rewind (Small with Crisp White Structure) */}
                  <button
                    type="button"
                    disabled={!showControls || isScreenLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeek(-10);
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/35 active:scale-90 text-white border border-white transition-all flex flex-col items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.35)] disabled:pointer-events-none"
                    title="Rewind 10s"
                    aria-label="Rewind 10 seconds"
                  >
                    <RotateCcw className="w-3 h-3 text-white stroke-[2.5]" />
                    <span className="text-[5.5px] font-mono leading-none mt-0.5 font-black text-white">10s</span>
                  </button>

                  {/* Play/Pause (Small with High-Contrast Crisp White Background & Solid White Border) */}
                  <button
                    type="button"
                    disabled={!showControls || isScreenLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause();
                    }}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-black hover:bg-slate-100 active:scale-90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.95)] border-2 border-white flex items-center justify-center cursor-pointer disabled:pointer-events-none"
                    title={isVideoPaused ? 'Play' : 'Pause'}
                    aria-label={isVideoPaused ? 'Play' : 'Pause'}
                  >
                    {isVideoPaused ? (
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black text-black ml-0.5" />
                    ) : (
                      <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black text-black" />
                    )}
                  </button>

                  {/* 10s Forward (Small with Crisp White Structure) */}
                  <button
                    type="button"
                    disabled={!showControls || isScreenLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeek(10);
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/35 active:scale-90 text-white border border-white transition-all flex flex-col items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.35)] disabled:pointer-events-none"
                    title="Forward 10s"
                    aria-label="Forward 10 seconds"
                  >
                    <RotateCw className="w-3 h-3 text-white stroke-[2.5]" />
                    <span className="text-[5.5px] font-mono leading-none mt-0.5 font-black text-white">10s</span>
                  </button>
                </div>
              </div>

              {/* Bottom Progress Bar, Times, and Fullscreen */}
              <div className={`space-y-2 ${showControls && !isScreenLocked ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressBarClick(e);
                  }}
                  className="w-full h-2.5 bg-white/25 hover:h-3 rounded-full cursor-pointer relative overflow-hidden transition-all shadow-inner"
                >
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-100 shadow-md"
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{formatSeconds(currentTime)}</span>
                    {duration > 0 && Math.abs(duration - currentTime) > 1 && (
                      <>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">{formatSeconds(duration)}</span>
                      </>
                    )}

                    {/* Next Episode Button with Crisp White Structure ("Next button hai inhe thoda small kerdo aur inka structure dikhe white me taki acha dikhe") */}
                    {activeSeason.episodes.findIndex((e) => e.id === currentPlayingEpisode.id) < activeSeason.episodes.length - 1 && (
                      <button
                        type="button"
                        disabled={!showControls || isScreenLocked}
                        onClick={playNextEpisode}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/35 border-2 border-white text-white text-[9.5px] font-sans font-black transition active:scale-95 ml-2 shadow-[0_0_10px_rgba(255,255,255,0.4)] backdrop-blur-md cursor-pointer disabled:pointer-events-none"
                        title="Next Episode"
                      >
                        <span>Next Ep</span>
                        <SkipForward className="w-2.5 h-2.5 stroke-[2.5] text-white fill-white" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-white/20 hover:text-white text-slate-300 active:scale-95 border border-white/10"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen / Rotate Landscape'}
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Default Top Series Poster Hero with SkeletonImage & AutoPlay CTA */
          <div className="relative w-full h-72 sm:h-80 md:h-96 overflow-hidden bg-black">
            <SkeletonImage
              src={currentSeries.bannerUrl || currentSeries.thumbnailUrl}
              alt={currentSeries.title}
              containerClassName="w-full h-full"
              imageClassName="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                haptic(40);
                setSelectedSeriesId(null);
              }}
              className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-slate-900 active:scale-95 transition-all border border-cyan-500/30 shadow-[0_0_12px_rgba(0,243,255,0.2)]"
              aria-label="Back to series list"
            >
              <ArrowLeft className="w-5 h-5 text-cyan-300" />
            </button>

            {/* Poster Hero Info & AutoPlay CTA */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md font-black text-[10px] uppercase tracking-wider text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,243,255,0.4)]">
                  {currentSeries.category}
                </span>
                {currentSeries.rating && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/40 text-xs font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                    <Star className="w-3 h-3 fill-amber-300" />
                    {currentSeries.rating}
                  </span>
                )}
                <span className="text-xs text-slate-300 font-medium">
                  {currentSeries.year || 2026}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {currentSeries.title}
              </h1>

              {/* Instant CTA to start video player */}
              {firstOrResumeEpisode && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handlePlayEpisode(firstOrResumeEpisode)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(0,243,255,0.6)] border border-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {isEpisodeWatched(firstOrResumeEpisode.episodeNumber) ? 'Resume Playing' : `Play S${activeSeason.seasonNumber}:E${firstOrResumeEpisode.episodeNumber}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NOW PLAYING STATUS BAR (Shown below video when inline player is active) */}
        {isPlayingInline && currentPlayingEpisode && (
          <div className="px-4 py-2.5 bg-[#0a0d14] border-b border-cyan-500/20 flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-md">
            <div className="min-w-0 flex-1 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f3ff] animate-ping shrink-0" />
              <div className="flex items-center gap-2 truncate text-xs font-mono font-semibold">
                <span className="text-cyan-400 font-bold uppercase tracking-wider">
                  {isMovie ? 'Now Streaming' : `Playing S${activeSeason?.seasonNumber || 1}:E${currentPlayingEpisode.episodeNumber}`}
                </span>
                {!isMovie && currentPlayingEpisode.title && currentPlayingEpisode.title !== currentSeries.title && (
                  <span className="text-slate-400 truncate">
                    • {currentPlayingEpisode.title}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  haptic(40);
                  setIsBookmarked(!isBookmarked);
                }}
                className={`p-2 rounded-lg border transition-all ${
                  isBookmarked
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.4)]'
                    : 'bg-black/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Bookmark Episode"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM HALF: Series Details, Season Tabs, Compact Series-Wise Episode Grid */}
      {/* ========================================================================= */}
      <div className="px-4 py-4 space-y-5">
        {/* Prominent Movie / Series Name & Meta Header (Above Description - Single Appearance) */}
        <div className="space-y-2.5 border-b border-slate-800/80 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Movie or Web Series Neon Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider font-mono border ${
              isMovie
                ? 'bg-gradient-to-r from-rose-500/20 to-pink-500/10 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
            }`}>
              {isMovie ? (
                <>
                  <Film className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
                  <span>Cinema Movie</span>
                </>
              ) : (
                <>
                  <Tv className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
                  <span>Web Series</span>
                </>
              )}
            </span>

            {/* Category / Genre Badge */}
            {currentSeries.category && (
              <span className="px-2.5 py-1 rounded-md bg-slate-900/90 text-slate-300 text-[11px] font-semibold border border-slate-700/60">
                {currentSeries.category}
              </span>
            )}

            {/* Release Year */}
            {currentSeries.year && (
              <span className="px-2 py-1 rounded-md bg-slate-900/90 text-slate-300 text-[11px] font-mono border border-slate-800">
                {currentSeries.year}
              </span>
            )}

            {/* Rating */}
            {currentSeries.rating && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 text-[11px] font-mono font-bold border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{currentSeries.rating}</span>
              </span>
            )}

            {/* 4K Ultra HD Badge */}
            <span className="px-2 py-1 rounded-md bg-cyan-950/40 text-cyan-400 text-[10px] font-mono font-extrabold border border-cyan-500/30">
              4K ULTRA HD
            </span>

            {!isMovie && (
              <span className="text-xs text-slate-400 font-mono ml-auto">
                {currentSeries.seasons.length} {currentSeries.seasons.length === 1 ? 'Season' : 'Seasons'} • {totalEpisodesCount} Ep
              </span>
            )}
          </div>

          {/* Main Title of the Movie / Series - EXACTLY ONCE */}
          <div className="pt-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow">
              {currentSeries.title}
            </h1>
          </div>
        </div>

        {/* Series Overview */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Story & Overview</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentSeries.description}
          </p>

          {currentSeries.tags && currentSeries.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentSeries.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 1. SCROLLABLE TABS FOR SEASONS (Series-wise grouping) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Season</span>
            </h3>
            <span className="text-[11px] text-cyan-400 font-mono">
              {currentSeries.seasons.length} {currentSeries.seasons.length > 1 ? 'Seasons' : 'Season'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {currentSeries.seasons.map((season) => {
              const isSelected = season.seasonNumber === activeSeason.seasonNumber;
              return (
                <button
                  key={season.seasonNumber}
                  type="button"
                  onClick={() => {
                    haptic(35);
                    setActiveSeasonNum(season.seasonNumber);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(0,243,255,0.7)] border-2 border-cyan-300 ring-2 ring-cyan-400/40'
                      : 'bg-black/90 text-slate-300 border border-cyan-500/30 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                  }`}
                >
                  Season {season.seasonNumber}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. COMPACT SMALL SQUARE BOX GRID ("E1", "E2"...) WITH AUTO-PLAY (Electric Neon Cyberpunk Style) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
                <span>Episodes: Season {activeSeason.seasonNumber}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 font-mono font-bold border border-cyan-400/60 shadow-[0_0_10px_rgba(0,243,255,0.35)]">
                  {activeSeason.episodes.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Click any episode box to auto play immediately
              </p>
            </div>

            {/* Compact Legend */}
            <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-cyan-400 shadow-[0_0_8px_#00f3ff]" />
                <span className="text-cyan-300 font-bold">Playing</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-fuchsia-950 border border-fuchsia-400 shadow-[0_0_6px_#ff007f]" />
                <span className="text-fuchsia-300 font-bold">Watched</span>
              </div>
            </div>
          </div>

          {/* Episode Section in ONLY ONE ROW (Horizontal Scrollable Strip with Vibrant Neon Glow) */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {activeSeason.episodes.map((ep) => {
              const watched = isEpisodeWatched(ep.episodeNumber, activeSeason.seasonNumber);
              const isCurrentlyPlaying =
                isPlayingInline &&
                currentPlayingEpisode?.id === ep.id;

              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => handlePlayEpisode(ep, activeSeason.seasonNumber)}
                  className={`group relative shrink-0 min-w-[52px] sm:min-w-[56px] h-12 sm:h-13 px-3 rounded-xl flex items-center justify-center transition-all duration-150 border active:scale-95 select-none cursor-pointer overflow-hidden ${
                    isCurrentlyPlaying
                      ? 'bg-gradient-to-tr from-cyan-500 via-sky-500 to-fuchsia-600 border-2 border-cyan-300 text-white font-black shadow-[0_0_25px_rgba(0,243,255,0.85),inset_0_0_12px_rgba(0,243,255,0.45)] ring-2 ring-cyan-400/60 scale-105 z-10 animate-pulse'
                      : watched
                      ? 'bg-fuchsia-950/40 border border-fuchsia-400/80 text-fuchsia-200 shadow-[0_0_14px_rgba(255,0,127,0.35)] hover:border-fuchsia-300'
                      : 'bg-black/90 border border-cyan-500/40 text-slate-200 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_16px_rgba(0,243,255,0.4)]'
                  }`}
                  title={`Play Episode ${ep.episodeNumber}: ${ep.title}`}
                >
                  <span className="font-mono font-black text-sm tracking-tight drop-shadow">
                    E{ep.episodeNumber}
                  </span>

                  {/* Watched Small Tick Badge */}
                  {!isCurrentlyPlaying && watched && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-fuchsia-400 drop-shadow-[0_0_4px_#ff007f]" />
                    </div>
                  )}

                  {/* Neon Bottom Accent Line */}
                  <div
                    className={`absolute bottom-0 inset-x-2 h-0.5 rounded-full transition-all ${
                      isCurrentlyPlaying
                        ? 'bg-cyan-300 shadow-[0_0_8px_#00f3ff]'
                        : watched
                        ? 'bg-fuchsia-400 shadow-[0_0_6px_#ff007f]'
                        : 'bg-transparent group-hover:bg-cyan-400/60'
                    }`}
                  />

                  {/* Playing mini animated indicator */}
                  {isCurrentlyPlaying && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-ping shadow-[0_0_8px_#ffffff]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SELECTED / CURRENT EPISODE DETAILS & ACTIONS (Electric Neon Card) */}
        {activeEpisodeForDetails && (
          <div className="p-4 rounded-2xl bg-black border border-cyan-500/35 shadow-[0_0_25px_rgba(0,243,255,0.12)] space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-black border border-cyan-400/50 text-cyan-300 font-black text-xs shadow-[0_0_10px_rgba(0,243,255,0.4)]">
                  Episode {activeEpisodeForDetails.episodeNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isEpisodeWatched(activeEpisodeForDetails.episodeNumber, activeSeason.seasonNumber) && (
                  <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Watched
                  </span>
                )}
                <span className="text-[10px] font-bold text-fuchsia-400 bg-black px-2 py-0.5 rounded border border-fuchsia-500/40 shadow-[0_0_8px_rgba(255,0,127,0.3)]">
                  ULTRA HD
                </span>
              </div>
            </div>

            <h4 className="font-extrabold text-sm text-white leading-snug">
              {activeEpisodeForDetails.title}
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeEpisodeForDetails.description || 'Watch this episode in full HD with ultra-low latency streaming.'}
            </p>

            {/* Fast Auto-play CTA button */}
            {(!isPlayingInline || currentPlayingEpisode?.id !== activeEpisodeForDetails.id) && (
              <button
                type="button"
                onClick={() => handlePlayEpisode(activeEpisodeForDetails, activeSeason.seasonNumber)}
                className="w-full mt-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_18px_rgba(0,243,255,0.5)] border border-cyan-300 transition active:scale-98 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Auto Play Episode {activeEpisodeForDetails.episodeNumber}</span>
              </button>
            )}
          </div>
        )}

        {/* 4. EPISODE DISCUSSION & COMMENT BOX (Neon Community Hub) */}
        <EpisodeComments
          seriesId={currentSeries.id}
          seasonNumber={activeSeason.seasonNumber}
          episodeNumber={currentPlayingEpisode?.episodeNumber || activeEpisodeForDetails?.episodeNumber || 1}
          episodeTitle={currentPlayingEpisode?.title || activeEpisodeForDetails?.title}
        />

        {/* 5. RECOMMENDED ANIME & MOVIES ("Half video player ke usi ke tarah anime movie vagaraha recommended") */}
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300 shadow-[0_0_10px_rgba(255,0,127,0.3)]">
                <Flame className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Recommended Anime & Movies</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-950/90 text-fuchsia-300 font-mono font-bold border border-fuchsia-500/40">
                    More Like This
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Trending picks based on {currentSeries.category}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendation Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['All', 'Anime', 'Movies', 'Thriller', 'Romance'].map((tab) => {
              const isSelected = recommendedFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    haptic(25);
                    setRecommendedFilter(tab);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 text-white border border-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.5)]'
                      : 'bg-black text-slate-400 border border-slate-800 hover:text-white hover:border-cyan-500/40'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Recommended Content Cards Grid */}
          {recommendedItems.length === 0 ? (
            <div className="p-6 rounded-2xl bg-black border border-slate-800 text-center space-y-1 text-slate-500 text-xs">
              <Compass className="w-6 h-6 mx-auto text-slate-600" />
              <p>Explore other categories for more anime and movies</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {recommendedItems.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectRecommended(item)}
                  className="group relative rounded-2xl overflow-hidden bg-black border border-cyan-500/25 hover:border-cyan-400/80 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all duration-200 active:scale-98 cursor-pointer flex flex-col"
                >
                  {/* Thumbnail with SkeletonImage */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                    <SkeletonImage
                      src={item.thumbnailUrl}
                      alt={item.title}
                      containerClassName="w-full h-full"
                      imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                    {/* Category pill */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-black tracking-wider uppercase text-cyan-300 border border-cyan-500/40 shadow-[0_0_6px_rgba(0,243,255,0.4)]">
                        {item.category}
                      </span>
                    </div>

                    {/* Rating badge */}
                    {item.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-amber-300 text-[10px] font-bold border border-amber-400/40">
                        <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                        <span>{item.rating}</span>
                      </div>
                    )}

                    {/* Play hover overlay button */}
                    <div className="absolute bottom-2 right-2 p-2 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(0,243,255,0.7)] group-hover:scale-110 active:scale-90 transition-all opacity-90 group-hover:opacity-100">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Title and metadata */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                    <h4 className="font-extrabold text-xs text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{item.year || 2026}</span>
                      <span className="text-cyan-400 font-semibold">
                        {item.seasons?.length === 1 && item.seasons[0]?.episodes?.length === 1
                          ? 'Movie'
                          : `${item.seasons?.length || 1} Seasons`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
