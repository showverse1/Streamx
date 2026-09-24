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
  HardDrive
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
  const [isPiPActive, setIsPiPActive] = useState(false);
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
    }
  };

  // Seek helper
  const seekRelative = (seconds: number) => {
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
          resetControlsTimeout();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          seekRelative(-10);
        }}
        aria-label="Rewind 10s"
      />
      <div
        className="absolute inset-y-0 right-0 w-1/2 z-25 cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
        onClick={(e) => {
          e.stopPropagation();
          resetControlsTimeout();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
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

      {/* Custom React UI Overlay Controls */}
      <div
        className={`absolute inset-0 flex flex-col justify-between pointer-events-none transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* TOP BAR */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto safe-pt">
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
              <h2 className="text-white font-bold text-sm tracking-tight truncate drop-shadow">
                {series.title}
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-slate-300 text-xs truncate">
                  S{seasonNum} : E{episode.episodeNumber} - {episode.title}
                </p>
                {isOfflinePlaying && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold shrink-0 flex items-center gap-1">
                    <HardDrive className="w-2.5 h-2.5" /> Offline File
                  </span>
                )}
              </div>
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

            {/* PiP Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePiP();
              }}
              className={`p-2 rounded-full backdrop-blur-md text-white transition-all active:scale-95 ${
                isPiPActive ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20'
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

        {/* CENTER PLAY/PAUSE BIG BUTTON */}
        <div className="flex items-center justify-center gap-8 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              seekRelative(-10);
            }}
            className="p-3 rounded-full bg-black/40 text-white/90 active:bg-white/20 backdrop-blur-sm transition-all active:scale-90"
            title="Rewind 10s"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="p-5 rounded-full bg-rose-600/90 text-white shadow-xl shadow-rose-600/40 active:scale-90 transition-all hover:bg-rose-500 backdrop-blur-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              seekRelative(10);
            }}
            className="p-3 rounded-full bg-black/40 text-white/90 active:bg-white/20 backdrop-blur-sm transition-all active:scale-90"
            title="Forward 10s"
          >
            <RotateCw className="w-6 h-6" />
          </button>
        </div>

        {/* BOTTOM BAR WITH RANGE SEEKBAR */}
        <div className="p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto safe-pb flex flex-col gap-2">
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
                  background: `linear-gradient(to right, #f43f5e 0%, #f43f5e ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%, transparent ${duration ? (currentTime / duration) * 100 : 0}%, transparent 100%)`
                }}
              />
            </div>

            <span className="text-xs font-mono text-slate-400 w-12">
              {formatTime(duration)}
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
                className="text-white hover:text-rose-400 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
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
                className="text-white hover:text-rose-400 active:scale-95 transition-all"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Next Episode Button if available */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextEpisode();
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white backdrop-blur-sm transition-all"
              >
                <span>Next</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
