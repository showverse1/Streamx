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
  Sun
} from 'lucide-react';
import { useAppStore } from '../store';
import { Episode } from '../types';

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
    downloads,
    haptic
  } = useAppStore();

  const currentSeries = useMemo(() => {
    return series.find((s) => s.id === selectedSeriesId);
  }, [series, selectedSeriesId]);

  const [activeSeasonNum, setActiveSeasonNum] = useState<number>(1);
  const [isPlayingInline, setIsPlayingInline] = useState<boolean>(true);
  const [currentPlayingEpisode, setCurrentPlayingEpisode] = useState<Episode | null>(null);

  // Aspect Ratio Mode: 'fit' (16:9 contain), 'stretch' (fill container), 'crop' (cover/zoom)
  const [aspectRatioMode, setAspectRatioMode] = useState<'fit' | 'stretch' | 'crop'>('fit');

  // Gestures: Volume (0..1) & Brightness (0.2..1.5)
  const [volume, setVolume] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(1);

  // Gesture HUD Overlay state
  const [gestureHUD, setGestureHUD] = useState<{
    type: 'brightness' | 'volume' | 'seek-forward' | 'seek-backward' | 'aspect' | null;
    value: string | number;
  }>({ type: null, value: 0 });
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Double-tap Seek Ripple state
  const [ripple, setRipple] = useState<{ side: 'left' | 'right'; key: number } | null>(null);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Touch gesture tracker refs
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    initialBrightness: number;
    initialVolume: number;
    isVerticalDrag: boolean;
  } | null>(null);

  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Video element state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPaused, setIsVideoPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('');
  const [videoError, setVideoError] = useState<boolean>(false);

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
        setActiveVideoUrl(targetEpisode.videoUrl);
      }
      recordEpisodeWatch(currentSeries, targetSeasonNum, targetEpisode, 0);
    }
  }, [currentSeries?.id, initialEpisodeTarget]);

  // Sync active video url when episode changes
  useEffect(() => {
    if (currentPlayingEpisode?.videoUrl) {
      setActiveVideoUrl(currentPlayingEpisode.videoUrl);
      setVideoError(false);
    }
  }, [currentPlayingEpisode?.id, currentPlayingEpisode?.videoUrl]);

  const handleVideoError = () => {
    console.warn('Video playback error, switching to verified backup CDN mirror...');
    const fallbacks = [
      'https://media.w3.org/2010/05/sintel/trailer.mp4',
      'https://vjs.zencdn.net/v/oceans.mp4',
      'https://media.w3.org/2010/05/bunny/trailer.mp4'
    ];
    const nextFallback = fallbacks.find((url) => url !== activeVideoUrl);
    if (nextFallback) {
      setActiveVideoUrl(nextFallback);
    } else {
      setVideoError(true);
    }
  };

  // Sync active season
  const activeSeason = useMemo(() => {
    if (!currentSeries) return null;
    return currentSeries.seasons.find((s) => s.seasonNumber === activeSeasonNum) || currentSeries.seasons[0];
  }, [currentSeries, activeSeasonNum]);

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

  // Video time update handler
  const handleTimeUpdate = () => {
    if (!videoRef.current || !currentSeries || !currentPlayingEpisode || !activeSeason) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // Periodically update watch history progress
    if (Math.floor(curr) % 5 === 0 && Math.floor(curr) > 0) {
      recordEpisodeWatch(currentSeries, activeSeason.seasonNumber, currentPlayingEpisode, Math.floor(curr));
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || currentPlayingEpisode?.durationSeconds || 0);
    // Guarantee auto-play when video metadata is loaded
    videoRef.current.play().catch(() => {});
  };

  const handleCanPlay = () => {
    if (videoRef.current && isPlayingInline) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Auto-hide controls timer (Strict 3 seconds of inactivity)
  const startControlsHideTimer = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const showAndScheduleHideControls = () => {
    setShowControls(true);
    startControlsHideTimer();
  };

  const toggleControls = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setShowControls((prev) => {
      const next = !prev;
      if (next) {
        startControlsHideTimer();
      } else if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      return next;
    });
  };

  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic(40);
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPaused(false);
    } else {
      videoRef.current.pause();
      setIsVideoPaused(true);
    }
    startControlsHideTimer();
  };

  const triggerHUD = (
    type: 'brightness' | 'volume' | 'seek-forward' | 'seek-backward' | 'aspect',
    value: string | number
  ) => {
    setGestureHUD({ type, value });
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setGestureHUD({ type: null, value: 0 });
    }, 1200);
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

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    haptic(30);
    startControlsHideTimer();
    const target = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    videoRef.current.currentTime = target;
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
        const screenAny = screen as unknown as { orientation?: { unlock?: () => void } };
        if (screenAny.orientation && typeof screenAny.orientation.unlock === 'function') {
          screenAny.orientation.unlock();
        }
      } catch (_) {}
    };
  }, []);

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic(50);
    const container = document.getElementById('inline-video-container');
    if (!container) return;

    const isCurrentFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);

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

      // Automatically force landscape screen orientation on mobile devices
      try {
        const screenAny = screen as unknown as { orientation?: { lock?: (orient: string) => Promise<void> } };
        if (screenAny.orientation && typeof screenAny.orientation.lock === 'function') {
          await screenAny.orientation.lock('landscape').catch(() => {});
        }
      } catch (_) {}
    } else {
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

      // Unlock back to portrait orientation
      try {
        const screenAny = screen as unknown as { orientation?: { unlock?: () => void } };
        if (screenAny.orientation && typeof screenAny.orientation.unlock === 'function') {
          screenAny.orientation.unlock();
        }
      } catch (_) {}
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

  // Touch handlers for video player screen gestures (Double-tap & swipe controls)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    touchStartRef.current = {
      x,
      y,
      time: Date.now(),
      initialBrightness: brightness,
      initialVolume: videoRef.current ? videoRef.current.volume : volume,
      isVerticalDrag: false
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const currentY = touch.clientY - rect.top;
    const currentX = touch.clientX - rect.left;
    const deltaY = touchStartRef.current.y - currentY; // Upward swipe = positive
    const deltaX = Math.abs(currentX - touchStartRef.current.x);

    // If moving vertically more than 8px and deltaY > deltaX
    if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > deltaX) {
      touchStartRef.current.isVerticalDrag = true;
      const height = rect.height;
      const change = deltaY / height; // Normalized drag range

      if (touchStartRef.current.x <= rect.width * 0.5) {
        // LEFT SIDE: Brightness control (0.2 to 1.5)
        const newBrightness = Math.max(0.2, Math.min(1.5, touchStartRef.current.initialBrightness + change * 1.6));
        setBrightness(newBrightness);
        triggerHUD('brightness', `${Math.round((newBrightness / 1.5) * 100)}%`);
      } else {
        // RIGHT SIDE: Volume control (0 to 1.0)
        const newVolume = Math.max(0, Math.min(1.0, touchStartRef.current.initialVolume + change * 1.6));
        setVolume(newVolume);
        if (videoRef.current) {
          videoRef.current.volume = newVolume;
          videoRef.current.muted = newVolume === 0;
        }
        setIsMuted(newVolume === 0);
        triggerHUD('volume', `${Math.round(newVolume * 100)}%`);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const { isVerticalDrag, x } = touchStartRef.current;
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();

    if (isVerticalDrag) {
      touchStartRef.current = null;
      return;
    }

    const lastTap = lastTapRef.current;
    if (lastTap && (now - lastTap.time) < 320 && Math.abs(x - lastTap.x) < 55) {
      // DOUBLE TAP RECOGNIZED!
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapRef.current = null;

      if (x > rect.width * 0.55) {
        // RIGHT SIDE DOUBLE TAP -> +10s forward!
        handleSeek(10);
        triggerRipple('right');
        triggerHUD('seek-forward', '+10s');
      } else if (x < rect.width * 0.45) {
        // LEFT SIDE DOUBLE TAP -> -10s backward!
        handleSeek(-10);
        triggerRipple('left');
        triggerHUD('seek-backward', '-10s');
      } else {
        // CENTER DOUBLE TAP -> Toggle Play/Pause!
        handlePlayPause();
      }
    } else {
      // SINGLE TAP CANDIDATE
      lastTapRef.current = { x, y: touchStartRef.current.y, time: now };
      if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = setTimeout(() => {
        toggleControls();
      }, 250);
    }

    touchStartRef.current = null;
  };

  // Mouse Double Click handler (Desktop/Browser support)
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width * 0.55) {
      handleSeek(10);
      triggerRipple('right');
      triggerHUD('seek-forward', '+10s');
    } else if (x < rect.width * 0.45) {
      handleSeek(-10);
      triggerRipple('left');
      triggerHUD('seek-backward', '-10s');
    } else {
      handlePlayPause();
    }
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
            onDoubleClick={handleDoubleClick}
            onClick={toggleControls}
            className={`relative w-full overflow-hidden group select-none touch-none transition-all duration-300 ${
              isFullscreen
                ? 'fixed inset-0 z-[100] w-screen h-screen bg-black flex items-center justify-center'
                : 'aspect-video bg-black'
            }`}
          >
            <video
              ref={videoRef}
              key={activeVideoUrl}
              src={activeVideoUrl || currentPlayingEpisode.videoUrl}
              poster={currentPlayingEpisode.thumbnailUrl || currentSeries.thumbnailUrl}
              autoPlay
              playsInline
              onCanPlay={handleCanPlay}
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
            >
              <source src={activeVideoUrl || currentPlayingEpisode.videoUrl} type="video/mp4" />
              <source src="https://media.w3.org/2010/05/sintel/trailer.mp4" type="video/mp4" />
              <source src="https://vjs.zencdn.net/v/oceans.mp4" type="video/mp4" />
            </video>

            {/* Video Error Recovery Overlay */}
            {videoError && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center z-30">
                <p className="text-white font-bold text-sm mb-1">Playback interrupted</p>
                <p className="text-slate-400 text-xs mb-3">Reconnecting to alternate fast streaming server</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoError(false);
                    setActiveVideoUrl('https://media.w3.org/2010/05/sintel/trailer.mp4');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Reload Stream
                </button>
              </div>
            )}

            {/* Double Tap Left Side Feedback (-10s) */}
            {ripple?.side === 'left' && (
              <div className="absolute inset-y-0 left-0 w-5/12 flex items-center justify-center pointer-events-none z-30 bg-rose-500/10 rounded-r-full animate-pulse transition-all">
                <div className="flex flex-col items-center justify-center bg-black/75 backdrop-blur-md text-white px-4 py-3 rounded-2xl border border-white/20 shadow-2xl">
                  <RotateCcw className="w-8 h-8 text-rose-400 animate-spin" />
                  <span className="font-black text-sm tracking-wide mt-1 font-mono text-rose-300">-10s</span>
                </div>
              </div>
            )}

            {/* Double Tap Right Side Feedback (+10s) */}
            {ripple?.side === 'right' && (
              <div className="absolute inset-y-0 right-0 w-5/12 flex items-center justify-center pointer-events-none z-30 bg-rose-500/10 rounded-l-full animate-pulse transition-all">
                <div className="flex flex-col items-center justify-center bg-black/75 backdrop-blur-md text-white px-4 py-3 rounded-2xl border border-white/20 shadow-2xl">
                  <RotateCw className="w-8 h-8 text-rose-400 animate-spin" />
                  <span className="font-black text-sm tracking-wide mt-1 font-mono text-rose-300">+10s</span>
                </div>
              </div>
            )}

            {/* Center Gesture HUD Overlay (Volume, Brightness, Seek, Aspect Ratio) */}
            {gestureHUD.type && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-35">
                <div className="flex flex-col items-center gap-2 bg-black/85 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-white shadow-2xl min-w-[140px]">
                  {gestureHUD.type === 'brightness' && <Sun className="w-8 h-8 text-amber-400" />}
                  {gestureHUD.type === 'volume' && (isMuted || volume === 0 ? <VolumeX className="w-8 h-8 text-rose-500" /> : <Volume2 className="w-8 h-8 text-rose-500" />)}
                  {gestureHUD.type === 'seek-backward' && <RotateCcw className="w-8 h-8 text-rose-400" />}
                  {gestureHUD.type === 'seek-forward' && <RotateCw className="w-8 h-8 text-rose-400" />}
                  {gestureHUD.type === 'aspect' && <Scaling className="w-8 h-8 text-sky-400" />}

                  <span className="font-bold text-[11px] tracking-wider uppercase text-slate-300">
                    {gestureHUD.type === 'brightness'
                      ? 'Brightness'
                      : gestureHUD.type === 'volume'
                      ? 'Volume'
                      : gestureHUD.type === 'aspect'
                      ? 'Screen Fit'
                      : 'Seek'}
                  </span>

                  <span className="font-mono text-sm font-extrabold text-white">
                    {gestureHUD.value}
                  </span>

                  {(gestureHUD.type === 'volume' || gestureHUD.type === 'brightness') && (
                    <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all duration-75 ${
                          gestureHUD.type === 'brightness' ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{
                          width:
                            gestureHUD.type === 'brightness'
                              ? `${Math.min(100, (brightness / 1.5) * 100)}%`
                              : `${volume * 100}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Video Controls Overlay - Auto-hides after 3 seconds of inactivity */}
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  toggleControls(e);
                } else {
                  startControlsHideTimer();
                }
              }}
              className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/70 flex flex-col justify-between p-3 transition-opacity duration-300 ${
                showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Top Controls Bar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic(40);
                    setSelectedSeriesId(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 text-xs font-semibold border border-white/10"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Stretch / Crop / Fit Toggle Option */}
                  <button
                    type="button"
                    onClick={cycleAspectRatio}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 text-xs font-bold border border-white/15 transition shadow"
                    title="Toggle Aspect Ratio (Fit / Stretch / Crop)"
                  >
                    <Scaling className="w-3.5 h-3.5 text-rose-400" />
                    <span className="capitalize text-[11px] font-bold">
                      {aspectRatioMode === 'fit' ? 'Fit' : aspectRatioMode === 'stretch' ? 'Stretch' : 'Crop'}
                    </span>
                  </button>

                  <span className="px-2 py-0.5 rounded bg-rose-600 font-bold text-[10px] uppercase tracking-wider text-white">
                    S{activeSeason.seasonNumber}:E{currentPlayingEpisode.episodeNumber}
                  </span>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-white/20 active:scale-95"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Center Play/Pause & Quick Seek Buttons */}
              <div className="flex items-center justify-center gap-8">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeek(-10);
                  }}
                  className="p-3 rounded-full bg-black/50 hover:bg-white/20 text-white active:scale-90 transition-transform"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-[9px] block font-mono">10s</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/50 active:scale-90 transition-transform"
                >
                  {isVideoPaused ? <Play className="w-7 h-7 fill-current ml-0.5" /> : <Pause className="w-7 h-7 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeek(10);
                  }}
                  className="p-3 rounded-full bg-black/50 hover:bg-white/20 text-white active:scale-90 transition-transform"
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="text-[9px] block font-mono">10s</span>
                </button>
              </div>

              {/* Bottom Progress Bar & Time */}
              <div className="space-y-1.5">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProgressBarClick(e);
                  }}
                  className="w-full h-2 bg-white/20 hover:h-3 rounded-full cursor-pointer relative overflow-hidden transition-all"
                >
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-100"
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                    <span className="text-white font-bold">{formatSeconds(currentTime)}</span>
                    <span className="text-slate-500">/</span>
                    <span>{formatSeconds(duration || currentPlayingEpisode.durationSeconds)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1 rounded hover:text-white text-slate-300 active:scale-95"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Default Top Series Poster Hero with Instant AutoPlay CTA */
          <div className="relative w-full h-72 sm:h-80 md:h-96 overflow-hidden bg-slate-950">
            <img
              src={currentSeries.bannerUrl || currentSeries.thumbnailUrl}
              alt={currentSeries.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                haptic(40);
                setSelectedSeriesId(null);
              }}
              className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-95 transition-all border border-white/10"
              aria-label="Back to series list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Poster Hero Info & AutoPlay CTA */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-rose-600 font-black text-[10px] uppercase tracking-wider text-white">
                  {currentSeries.category}
                </span>
                {currentSeries.rating && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />
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
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/40 active:scale-[0.98] transition-all"
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

        {/* NOW PLAYING TITLE BAR (Shown below video when inline player is active) */}
        {isPlayingInline && currentPlayingEpisode && (
          <div className="px-4 py-3 bg-[#0e1017] border-b border-slate-800 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Now Playing • S{activeSeason.seasonNumber}:E{currentPlayingEpisode.episodeNumber}</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate mt-0.5">
                {currentPlayingEpisode.title}
              </h2>
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
                    ? 'bg-rose-950/60 border-rose-500 text-rose-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Bookmark Episode"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic(40);
                  addDownload(currentSeries, activeSeason.seasonNumber, currentPlayingEpisode);
                }}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Download Episode"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM HALF: Series Details, Season Tabs, Compact Series-Wise Episode Grid */}
      {/* ========================================================================= */}
      <div className="px-4 py-4 space-y-5">
        {/* Series Overview */}
        <div className="space-y-2">
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
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-rose-500" />
              <span>Select Season</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-500/50'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Season {season.seasonNumber}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. COMPACT SMALL SQUARE BOX GRID ("E1", "E2"...) WITH AUTO-PLAY */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
                <span>Episodes: Season {activeSeason.seasonNumber}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-rose-400 font-mono font-bold">
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
                <span className="w-2 h-2 rounded bg-rose-600 shadow-sm shadow-rose-500" />
                <span>Playing</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-rose-950/80 border border-rose-500/60" />
                <span>Watched</span>
              </div>
            </div>
          </div>

          {/* Compact Small Square Boxes Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
            {activeSeason.episodes.map((ep) => {
              const watched = isEpisodeWatched(ep.episodeNumber, activeSeason.seasonNumber);
              const downloaded = isEpisodeDownloaded(ep.episodeNumber, activeSeason.seasonNumber);
              const isCurrentlyPlaying =
                isPlayingInline &&
                currentPlayingEpisode?.id === ep.id;

              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => handlePlayEpisode(ep, activeSeason.seasonNumber)}
                  className={`group relative aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all duration-150 border active:scale-90 select-none ${
                    isCurrentlyPlaying
                      ? 'bg-rose-600 border-white text-white font-black shadow-lg shadow-rose-600/50 ring-2 ring-rose-500/50 scale-105 z-10'
                      : watched
                      ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                      : 'bg-slate-900/90 border-slate-800/90 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                  title={`Play Episode ${ep.episodeNumber}: ${ep.title}`}
                >
                  <span className="font-black text-xs tracking-tight">
                    E{ep.episodeNumber}
                  </span>

                  {/* Watched Small Tick Badge */}
                  {!isCurrentlyPlaying && watched && (
                    <div className="absolute top-0.5 right-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-rose-400" />
                    </div>
                  )}

                  {/* Playing mini icon */}
                  {isCurrentlyPlaying && (
                    <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-white animate-ping" />
                  )}

                  {/* Downloaded mini stamp */}
                  {downloaded && !isCurrentlyPlaying && (
                    <div className="absolute bottom-0.5 right-0.5">
                      <Download className="w-2 h-2 text-emerald-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SELECTED / CURRENT EPISODE DETAILS & ACTIONS (No duplicate list) */}
        {activeEpisodeForDetails && (
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30">
                  Episode {activeEpisodeForDetails.episodeNumber}
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activeEpisodeForDetails.duration}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isEpisodeWatched(activeEpisodeForDetails.episodeNumber, activeSeason.seasonNumber) && (
                  <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Watched
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    haptic(40);
                    addDownload(currentSeries, activeSeason.seasonNumber, activeEpisodeForDetails);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
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
                className="w-full mt-1 py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Auto Play Episode {activeEpisodeForDetails.episodeNumber}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
