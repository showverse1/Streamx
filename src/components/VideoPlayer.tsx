import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Sun,
  Volume2,
  VolumeX,
  PictureInPicture2,
  Maximize,
  Minimize,
  SkipForward,
  Scaling,
  HardDrive,
  Share2,
  Lock,
  Unlock
} from 'lucide-react';
import { useAppStore } from '../store';
import { sanitizeVideoUrl } from '../services/videoUtils';
import { getOfflineVideoPlaybackUrl } from '../services/offlineStorage';

export const VideoPlayer: React.FC = () => {
  const { activePlayback, stopPlayback, startPlayback, recordEpisodeWatch, haptic } = useAppStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [brightness, setBrightness] = useState(1); // 1 = 100% brightness (0% dark overlay)
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [lockToast, setLockToast] = useState<string | null>(null);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const unlockPromptTimeoutRef = useRef<number | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);

  const handleLockedScreenTap = () => {
    haptic(30);
    setShowUnlockPrompt(true);
    if (unlockPromptTimeoutRef.current) window.clearTimeout(unlockPromptTimeoutRef.current);
    unlockPromptTimeoutRef.current = window.setTimeout(() => {
      setShowUnlockPrompt(false);
    }, 3500);
  };
  const [videoError, setVideoError] = useState(false);
  const [isOfflinePlaying, setIsOfflinePlaying] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(sanitizeVideoUrl(activePlayback?.episode.videoUrl) || '');

  // Aspect Ratio Mode: 'fit' (16:9 contain), 'stretch' (fill container), 'crop' (cover/zoom)
  const [aspectRatioMode, setAspectRatioMode] = useState<'fit' | 'stretch' | 'crop'>('fit');

  // Double-tap Seek Ripple state
  const [ripple, setRipple] = useState<{ side: 'left' | 'right'; key: number } | null>(null);
  const rippleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activePlayback?.episode) return;

    let isMounted = true;
    const downloadId = `${activePlayback.series.id}_s${activePlayback.seasonNum}_e${activePlayback.episode.episodeNumber}`;

    getOfflineVideoPlaybackUrl(downloadId).then((offlineUrl) => {
      if (!isMounted) return;
      if (offlineUrl) {
        setActiveVideoUrl(offlineUrl);
        setIsOfflinePlaying(true);
      } else if (activePlayback.episode.videoUrl) {
        setActiveVideoUrl(sanitizeVideoUrl(activePlayback.episode.videoUrl));
        setIsOfflinePlaying(false);
      }
      setVideoError(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activePlayback?.series.id, activePlayback?.seasonNum, activePlayback?.episode.id, activePlayback?.episode.videoUrl]);

  const handleVideoError = () => {
    console.warn('Video source playback error for:', activeVideoUrl);
    setVideoError(true);
  };

  const handleReloadVideo = () => {
    if (!activePlayback?.episode) return;
    setVideoError(false);
    const cleaned = sanitizeVideoUrl(activePlayback.episode.videoUrl);
    setActiveVideoUrl('');
    setTimeout(() => {
      setActiveVideoUrl(cleaned);
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    }, 50);
  };

  // Gesture indicators
  const [gestureHUD, setGestureHUD] = useState<{
    type: 'brightness' | 'volume' | 'seek-forward' | 'seek-backward' | 'aspect' | null;
    value: number | string;
  }>({ type: null, value: 0 });

  const controlsTimeoutRef = useRef<number | null>(null);
  const hudTimeoutRef = useRef<number | null>(null);

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

  // Auto-hide controls timer (Strict 3 seconds)
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Flash Gesture HUD
  const triggerHUD = useCallback((type: 'brightness' | 'volume' | 'seek-forward' | 'seek-backward' | 'aspect', value: number | string) => {
    setGestureHUD({ type, value });
    if (hudTimeoutRef.current) {
      window.clearTimeout(hudTimeoutRef.current);
    }
    hudTimeoutRef.current = window.setTimeout(() => {
      setGestureHUD({ type: null, value: 0 });
    }, 1200);
  }, []);

  const triggerRipple = useCallback((side: 'left' | 'right') => {
    setRipple({ side, key: Date.now() });
    if (rippleTimeoutRef.current) {
      window.clearTimeout(rippleTimeoutRef.current);
    }
    rippleTimeoutRef.current = window.setTimeout(() => {
      setRipple(null);
    }, 700);
  }, []);

  const cycleAspectRatio = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic(40);
    setAspectRatioMode((prev) => {
      const next = prev === 'fit' ? 'stretch' : prev === 'stretch' ? 'crop' : 'fit';
      const label = next === 'fit' ? 'Fit (16:9)' : next === 'stretch' ? 'Stretch (Fill)' : 'Crop (Zoom)';
      triggerHUD('aspect', label);
      return next;
    });
  }, [haptic, triggerHUD]);

  // Landscape Orientation Lock & Fullscreen Attempt
  useEffect(() => {
    const lockLandscape = async () => {
      try {
        const screenAny = screen as unknown as { orientation?: { lock?: (orient: string) => Promise<void> } };
        if (screenAny.orientation && typeof screenAny.orientation.lock === 'function') {
          await screenAny.orientation.lock('landscape').catch(() => {});
        }
      } catch (err) {
        // Safe fail on unsupported browsers (Safari iOS / Desktop)
        console.debug('Orientation lock not supported', err);
      }
    };

    lockLandscape();

    return () => {
      try {
        const screenAny = screen as unknown as { orientation?: { unlock?: () => void } };
        if (screenAny.orientation && typeof screenAny.orientation.unlock === 'function') {
          screenAny.orientation.unlock();
        }
      } catch (e) {
        console.debug('Orientation unlock error', e);
      }
    };
  }, []);

  // Update watch history on play
  useEffect(() => {
    if (!activePlayback) return;
    recordEpisodeWatch(
      activePlayback.series,
      activePlayback.seasonNum,
      activePlayback.episode,
      0
    );
  }, [activePlayback, recordEpisodeWatch]);

  // Sync Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
      // Periodically record progress every ~5 seconds
      if (activePlayback && Math.floor(video.currentTime) % 5 === 0) {
        recordEpisodeWatch(
          activePlayback.series,
          activePlayback.seasonNum,
          activePlayback.episode,
          Math.floor(video.currentTime)
        );
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
      // Try autoplaying next episode if exists
      handleNextEpisode();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [activePlayback, recordEpisodeWatch]);

  // Next Episode logic
  const handleNextEpisode = useCallback(() => {
    if (!activePlayback) return;
    const currentSeason = activePlayback.season;
    const currentIndex = currentSeason.episodes.findIndex(
      (e) => e.id === activePlayback.episode.id
    );

    if (currentIndex !== -1 && currentIndex < currentSeason.episodes.length - 1) {
      const nextEp = currentSeason.episodes[currentIndex + 1];
      haptic(60);
      startPlayback(activePlayback.series, activePlayback.seasonNum, nextEp);
    }
  }, [activePlayback, haptic, startPlayback]);

  // Picture-in-Picture Toggle
  const togglePiP = async () => {
    haptic(40);
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (e) {
      console.warn('PiP error', e);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    haptic(40);
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
      setIsScreenLocked(false);
    }
  };

  // Seek helper
  const seekRelative = (seconds: number) => {
    if (isScreenLocked) return;
    haptic(45);
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration && !isNaN(video.duration) && isFinite(video.duration) && video.duration > 0
      ? video.duration
      : (duration > 0 ? duration : 0);
    const target = dur > 0
      ? Math.max(0, Math.min(dur, video.currentTime + seconds))
      : Math.max(0, video.currentTime + seconds);
    video.currentTime = target;
    setCurrentTime(target);
    triggerHUD(seconds > 0 ? 'seek-forward' : 'seek-backward', `${Math.abs(seconds)}s`);
    triggerRipple(seconds > 0 ? 'right' : 'left');
  };

  // Touch Gestures: Left-half Brightness, Right-half Volume, Center Tap, Double-Tap Seek
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isScreenLocked) return;
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
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const currentY = touch.clientY - rect.top;
    const deltaY = touchStartRef.current.y - currentY; // Upward swipe = positive
    const deltaX = Math.abs((touch.clientX - rect.left) - touchStartRef.current.x);

    // Check if dragging vertically
    if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > deltaX) {
      touchStartRef.current.isVerticalDrag = true;
      const height = rect.height;
      const change = deltaY / height; // Normalized drag range

      if (touchStartRef.current.x < rect.width * 0.5) {
        // Left-half vertical drag: Brightness simulation (0.15 to 1.0)
        const newBrightness = Math.max(0.15, Math.min(1.0, touchStartRef.current.initialBrightness + change * 1.5));
        setBrightness(newBrightness);
        triggerHUD('brightness', `${Math.round(newBrightness * 100)}%`);
      } else {
        // Right-half vertical drag: HTML5 Volume (0 to 1.0)
        const video = videoRef.current;
        const newVolume = Math.max(0, Math.min(1.0, touchStartRef.current.initialVolume + change * 1.5));
        setVolume(newVolume);
        if (video) {
          video.volume = newVolume;
          video.muted = newVolume === 0;
        }
        setIsMuted(newVolume === 0);
        triggerHUD('volume', `${Math.round(newVolume * 100)}%`);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const { isVerticalDrag, x, time } = touchStartRef.current;
    const now = Date.now();

    // If it was a vertical swipe, don't trigger tap
    if (isVerticalDrag) {
      touchStartRef.current = null;
      return;
    }

    // Check for Double-Tap
    const rect = e.currentTarget.getBoundingClientRect();
    const lastTap = lastTapRef.current;

    if (lastTap && (now - lastTap.time) < 320 && Math.abs(x - lastTap.x) < 55) {
      // Double tap recognized!
      lastTapRef.current = null; // reset
      if (x < rect.width * 0.45) {
        // Left side double tap -> Seek backward 10s
        seekRelative(-10);
      } else if (x > rect.width * 0.55) {
        // Right side double tap -> Seek forward 10s
        seekRelative(10);
      } else {
        // Center double tap -> Toggle Play/Pause
        togglePlayPause();
      }
    } else {
      // Single Tap candidate
      lastTapRef.current = { x, y: touchStartRef.current.y, time: now };
      // Delay single tap reaction to distinguish from double tap
      window.setTimeout(() => {
        if (lastTapRef.current && (Date.now() - lastTapRef.current.time) >= 300) {
          // Toggle UI overlay on center single tap
          setShowControls((prev) => !prev);
          resetControlsTimeout();
        }
      }, 310);
    }

    touchStartRef.current = null;
  };

  // Mouse Double Click handler (Desktop support)
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width * 0.55) {
      seekRelative(10);
    } else if (x < rect.width * 0.45) {
      seekRelative(-10);
    } else {
      togglePlayPause();
    }
  };

  const togglePlayPause = () => {
    haptic(40);
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
    video.currentTime = target;
    setCurrentTime(target);
    resetControlsTimeout();
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!activePlayback) return null;

  const { series, seasonNum, episode } = activePlayback;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      onClick={resetControlsTimeout}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        key={activeVideoUrl}
        src={activeVideoUrl}
        className={`w-full h-full cursor-pointer transition-all duration-150 ${
          aspectRatioMode === 'stretch'
            ? 'object-fill'
            : aspectRatioMode === 'crop'
            ? 'object-cover'
            : 'object-contain'
        } bg-black`}
        playsInline
        controls={false}
        onError={handleVideoError}
      />

      {/* Split Screen Left & Right Interactive Hitbox Zones for Instant Double Tap / Seek */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 z-25 cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
        onClick={(e) => {
          e.stopPropagation();
          if (isScreenLocked) {
            handleLockedScreenTap();
            return;
          }
          resetControlsTimeout();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (isScreenLocked) return;
          seekRelative(-10);
        }}
        aria-label="Rewind 10s"
      />
      <div
        className="absolute inset-y-0 right-0 w-1/2 z-25 cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
        onClick={(e) => {
          e.stopPropagation();
          if (isScreenLocked) {
            handleLockedScreenTap();
            return;
          }
          resetControlsTimeout();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (isScreenLocked) return;
          seekRelative(10);
        }}
        aria-label="Forward 10s"
      />

      {/* Video Source Error Recovery Banner */}
      {videoError && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-40">
          <p className="text-white font-bold text-sm mb-1">Stream source unavailable</p>
          <p className="text-slate-400 text-xs mb-4">Video link could not be streamed directly</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReloadVideo();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition"
          >
            Retry Video
          </button>
        </div>
      )}

      {/* Brightness Dimmer Overlay (Simulating Hardware Brightness) */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-75"
        style={{ opacity: 1 - brightness }}
      />

      {/* Gesture HUD (Center popup for Volume, Brightness, Seek & Aspect Ratio) */}
      {gestureHUD.type && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="flex flex-col items-center gap-2 bg-black/85 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-white shadow-2xl animate-pulse-fast min-w-[140px]">
            {gestureHUD.type === 'brightness' && <Sun className="w-8 h-8 text-amber-400" />}
            {gestureHUD.type === 'volume' && (isMuted || volume === 0 ? <VolumeX className="w-8 h-8 text-rose-500" /> : <Volume2 className="w-8 h-8 text-rose-500" />)}
            {gestureHUD.type === 'seek-backward' && <RotateCcw className="w-8 h-8 text-rose-400" />}
            {gestureHUD.type === 'seek-forward' && <RotateCw className="w-8 h-8 text-rose-400" />}
            {gestureHUD.type === 'aspect' && <Scaling className="w-8 h-8 text-sky-400" />}
            <span className="font-bold text-xs tracking-wide uppercase text-slate-300">
              {gestureHUD.type === 'brightness'
                ? 'Brightness'
                : gestureHUD.type === 'volume'
                ? 'Volume'
                : gestureHUD.type === 'aspect'
                ? 'Screen Fit'
                : 'Seek'}
            </span>
            <span className="font-mono text-sm font-bold text-white">
              {gestureHUD.value}
            </span>
          </div>
        </div>
      )}

      {/* Double Tap Left Side Ripple (-10s) */}
      {ripple?.side === 'left' && (
        <div className="absolute inset-y-0 left-0 w-5/12 flex items-center justify-center pointer-events-none z-30 bg-rose-500/10 rounded-r-full animate-pulse transition-all">
          <div className="flex flex-col items-center justify-center bg-black/75 backdrop-blur-md text-white px-5 py-4 rounded-2xl border border-white/20 shadow-2xl">
            <RotateCcw className="w-8 h-8 text-rose-400 animate-spin" />
            <span className="font-black text-sm tracking-wide mt-1 font-mono text-rose-300">-10s</span>
          </div>
        </div>
      )}

      {/* Double Tap Right Side Ripple (+10s) */}
      {ripple?.side === 'right' && (
        <div className="absolute inset-y-0 right-0 w-5/12 flex items-center justify-center pointer-events-none z-30 bg-rose-500/10 rounded-l-full animate-pulse transition-all">
          <div className="flex flex-col items-center justify-center bg-black/75 backdrop-blur-md text-white px-5 py-4 rounded-2xl border border-white/20 shadow-2xl">
            <RotateCw className="w-8 h-8 text-rose-400 animate-spin" />
            <span className="font-black text-sm tracking-wide mt-1 font-mono text-rose-300">+10s</span>
          </div>
        </div>
      )}

      {/* Fullscreen Tap to Lock / Unlock Side Button */}
      <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 select-none">
        {isScreenLocked ? (
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

      {/* Custom React UI Overlay Controls */}
      <div
        className={`absolute inset-0 flex flex-col justify-between pointer-events-none transition-all duration-300 z-20 ${
          showControls && !isScreenLocked
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none select-none invisible'
        }`}
      >
        {/* TOP BAR */}
        <div className={`flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent safe-pt ${
          showControls && !isScreenLocked ? 'pointer-events-auto' : 'pointer-events-none'
        }`}>
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                haptic(50);
                stopPlayback();
              }}
              className="p-2 rounded-full bg-white/10 active:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
              title="Close Player"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="truncate">
              <h2 className="text-white font-extrabold text-sm tracking-tight truncate drop-shadow flex items-center gap-2">
                <span>{series.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-400/30">
                  HD
                </span>
              </h2>
              <p className="text-slate-300 text-xs truncate">
                S{seasonNum} : E{episode.episodeNumber} - {episode.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Stretch / Crop / Fit Option */}
            <button
              type="button"
              onClick={cycleAspectRatio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 text-xs font-bold border border-white/10 shadow"
              title="Aspect Ratio (Fit / Stretch / Crop)"
            >
              <Scaling className="w-4 h-4 text-rose-400" />
              <span className="capitalize text-xs font-bold">
                {aspectRatioMode === 'fit' ? 'Fit' : aspectRatioMode === 'stretch' ? 'Stretch' : 'Crop'}
              </span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                haptic(40);
                const title = activePlayback?.episode?.title || activePlayback?.series?.title || 'StreamX';
                const shareData = {
                  title,
                  text: `Watch ${title} on StreamX`,
                  url: window.location.href
                };
                if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                  try {
                    await navigator.share(shareData);
                  } catch (_) {}
                } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                  } catch (_) {}
                }
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
              title="Share Video"
            >
              <Share2 className="w-5 h-5 text-cyan-300" />
            </button>

            {/* PiP Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePiP();
              }}
              className={`p-2 rounded-full backdrop-blur-md text-white transition-all active:scale-95 ${
                isPiPActive ? 'bg-cyan-500 text-white shadow-[0_0_10px_#00f3ff]' : 'bg-white/10 hover:bg-white/20'
              }`}
              title="Picture-in-Picture"
            >
              <PictureInPicture2 className="w-5 h-5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* CENTER CONTROLS with Visible Crisp White Structure */}
        <div className="flex items-center justify-center pointer-events-none">
          <div
            className={`flex items-center justify-center gap-2.5 sm:gap-3 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/15 hover:bg-white/20 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_rgba(255,255,255,0.2)] transition-all ${
              showControls && !isScreenLocked ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            {/* Rewind 10s */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                seekRelative(-10);
              }}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white border border-white/80 transition-all flex flex-col items-center justify-center cursor-pointer shadow-[0_0_8px_rgba(255,255,255,0.25)]"
              title="Rewind 10s"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white stroke-[2.5]" />
              <span className="text-[5.5px] sm:text-[6px] font-mono leading-none mt-0.5 font-black text-white">10s</span>
            </button>

            {/* Center Play/Pause Compact */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-black hover:bg-white/95 active:scale-90 transition-all shadow-[0_0_16px_rgba(255,255,255,0.9)] border-2 border-white flex items-center justify-center cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black text-black" />
              ) : (
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black text-black ml-0.5" />
              )}
            </button>

            {/* Forward 10s */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                seekRelative(10);
              }}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white border border-white/80 transition-all flex flex-col items-center justify-center cursor-pointer shadow-[0_0_8px_rgba(255,255,255,0.25)]"
              title="Forward 10s"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white stroke-[2.5]" />
              <span className="text-[5.5px] sm:text-[6px] font-mono leading-none mt-0.5 font-black text-white">10s</span>
            </button>
          </div>
        </div>

        {/* BOTTOM BAR WITH RANGE SEEKBAR */}
        <div className={`p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent safe-pb flex flex-col gap-2 ${
          showControls && !isScreenLocked ? 'pointer-events-auto' : 'pointer-events-none'
        }`}>
          {/* Progress Seekbar Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-300 w-12 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center">
              {/* Buffered progress track */}
              <div className="absolute inset-x-0 h-1 bg-white/20 rounded-full overflow-hidden pointer-events-none">
                <div
                  className="h-full bg-white/30 rounded-full"
                  style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
                />
              </div>

              {/* Range input */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full relative z-10"
                style={{
                  background: `linear-gradient(to right, #00f3ff 0%, #d946ef ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%, rgba(255,255,255,0.2) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>

            <span className="text-xs font-mono text-cyan-300 w-12 font-semibold">
              {duration > 0 && Math.abs(duration - currentTime) > 1 ? formatTime(duration) : ''}
            </span>
          </div>

          {/* Bottom Controls Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="text-white hover:text-cyan-400 active:scale-95 transition-all p-1"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current text-cyan-400 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" /> : <Play className="w-5 h-5 fill-current text-cyan-400 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic(30);
                  const video = videoRef.current;
                  if (video) {
                    video.muted = !video.muted;
                    setIsMuted(video.muted);
                  }
                }}
                className="text-white hover:text-cyan-400 active:scale-95 transition-all p-1"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-slate-200" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Next Episode Button with Crisp White Structure */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextEpisode();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/70 text-white text-[10px] font-bold transition active:scale-95 shadow-[0_0_10px_rgba(255,255,255,0.25)] backdrop-blur-md cursor-pointer"
              >
                <span>Next Ep</span>
                <SkipForward className="w-3 h-3 stroke-[2.5] text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
