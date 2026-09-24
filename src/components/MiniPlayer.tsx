import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Maximize2, X, Pipette, ExternalLink } from 'lucide-react';
import { useAppStore } from '../store';
import { getOfflineVideoPlaybackUrl } from '../services/offlineStorage';

export const MiniPlayer: React.FC = () => {
  const {
    miniPlayer,
    selectedSeriesId,
    closeMiniPlayer,
    resumeMiniPlayerInDetail,
    haptic
  } = useAppStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(!miniPlayer?.isPaused);
  const [isPipSupported, setIsPipSupported] = useState<boolean>(false);
  const [effectiveSrc, setEffectiveSrc] = useState<string>('');

  useEffect(() => {
    setIsPipSupported(
      typeof document !== 'undefined' &&
      'pictureInPictureEnabled' in document &&
      document.pictureInPictureEnabled
    );
  }, []);

  // Determine if video source has an offline cached version in IndexedDB
  useEffect(() => {
    if (!miniPlayer) return;

    let isMounted = true;
    const downloadId = `${miniPlayer.series.id}_s${miniPlayer.seasonNum}_e${miniPlayer.episode.episodeNumber}`;

    getOfflineVideoPlaybackUrl(downloadId).then((offlineUrl) => {
      if (isMounted) {
        setEffectiveSrc(offlineUrl || miniPlayer.episode.videoUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [miniPlayer]);

  // Sync playback time and play state
  useEffect(() => {
    if (!videoRef.current || !miniPlayer) return;

    const vid = videoRef.current;
    if (miniPlayer.currentTime > 0) {
      vid.currentTime = miniPlayer.currentTime;
    }

    if (!miniPlayer.isPaused) {
      vid.play().catch(() => {
        // Auto-play was prevented, wait for user tap
        setIsPlaying(false);
      });
    }
  }, [effectiveSrc, miniPlayer]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic(30);
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSystemPiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic(40);
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('System PiP request notice:', err);
    }
  };

  const handleMaximize = () => {
    haptic(40);
    // Update timestamp before maximizing
    if (videoRef.current && miniPlayer) {
      miniPlayer.currentTime = videoRef.current.currentTime;
    }
    resumeMiniPlayerInDetail();
  };

  // Only show when miniPlayer is active AND we are NOT in the full SeriesDetail view
  if (!miniPlayer || selectedSeriesId) {
    return null;
  }

  return (
    <div
      onClick={handleMaximize}
      className="fixed bottom-20 right-3 z-50 w-56 sm:w-64 rounded-2xl overflow-hidden bg-slate-950/95 border border-rose-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 cursor-pointer group"
      style={{ touchAction: 'none' }}
    >
      {/* Video Viewport */}
      <div className="relative aspect-video w-full bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={effectiveSrc || miniPlayer.episode.videoUrl}
          playsInline
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain"
        />

        {/* Floating Mini Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
          {/* Top Row: System PiP & Close */}
          <div className="flex items-center justify-between gap-1">
            <span className="px-1.5 py-0.5 rounded bg-rose-600/90 text-[8px] font-black uppercase text-white shadow">
              PiP Mode
            </span>

            <div className="flex items-center gap-1">
              {isPipSupported && (
                <button
                  type="button"
                  onClick={handleSystemPiP}
                  className="p-1 rounded-full bg-black/60 hover:bg-white/20 text-slate-200 transition"
                  title="System Picture in Picture"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeMiniPlayer();
                }}
                className="p-1 rounded-full bg-black/60 hover:bg-rose-600 text-slate-200 transition"
                title="Close Floating Player"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Play/Pause, Title, Maximize */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow transition shrink-0"
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-white truncate leading-tight">
                {miniPlayer.series.title}
              </p>
              <p className="text-[9px] text-slate-400 truncate">
                E{miniPlayer.episode.episodeNumber}: {miniPlayer.episode.title}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMaximize();
              }}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
              title="Expand to Full Player"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
