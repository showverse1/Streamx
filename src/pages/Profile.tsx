import React from 'react';
import {
  History,
  Trash2,
  Play,
  Clock,
  ShieldCheck,
  Smartphone,
  CheckCircle,
  Film,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store';
import { WatchHistoryItem } from '../types';

export const Profile: React.FC = () => {
  const {
    watchHistory,
    clearWatchHistory,
    startPlayback,
    series,
    setSelectedSeriesId,
    haptic
  } = useAppStore();

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleResume = (item: WatchHistoryItem) => {
    haptic(50);
    const targetSeries = series.find((s) => s.id === item.seriesId);
    if (!targetSeries) return;

    const season = targetSeries.seasons.find((s) => s.seasonNumber === item.seasonNum) || targetSeries.seasons[0];
    const episode = season.episodes.find((e) => e.episodeNumber === item.episodeNum) || season.episodes[0];

    startPlayback(targetSeries, season.seasonNumber, episode);
  };

  const handleOpenSeries = (seriesId: string) => {
    haptic(40);
    setSelectedSeriesId(seriesId);
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Profile Card Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 p-5 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-0.5 shadow-lg shadow-rose-600/30">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-rose-500 text-xl">
                SX
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-white text-base truncate">
                StreamX Member
              </h2>
              <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              PWA Mode: Standalone Ready
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                VIP Premium
              </span>
              <span className="text-[10px] text-slate-400">
                {watchHistory.length} Episodes Tracked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WATCH HISTORY SECTION MAPPED FROM LOCALSTORAGE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-rose-500" />
            <h3 className="font-extrabold text-sm text-white tracking-tight">
              Watch History (LocalStorage)
            </h3>
          </div>

          {watchHistory.length > 0 && (
            <button
              type="button"
              onClick={clearWatchHistory}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors p-1"
              title="Clear LocalStorage History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {watchHistory.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">
              No watch history recorded yet
            </p>
            <p className="text-[11px] text-slate-500">
              Play any episode from Home or Series Detail to automatically sync your progress.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {watchHistory.map((item, idx) => (
              <div
                key={`${item.seriesId}_s${item.seasonNum}_e${item.episodeNum}_${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                {/* Thumbnail & Title */}
                <div
                  onClick={() => handleOpenSeries(item.seriesId)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                    <img
                      src={item.seriesThumbnail}
                      alt={item.seriesTitle || 'Thumbnail'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-800">
                      <div
                        className="h-full bg-rose-500"
                        style={{
                          width: `${
                            item.progressSeconds && item.durationSeconds
                              ? Math.min(100, (item.progressSeconds / item.durationSeconds) * 100)
                              : 100
                          }%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-xs text-white truncate group-hover:text-rose-400 transition-colors">
                      {item.seriesTitle || 'Streaming Series'}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      Season {item.seasonNum} • Episode {item.episodeNum}
                    </p>
                    <span className="text-[10px] text-rose-400/80 font-mono">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Resume Play Button */}
                <button
                  type="button"
                  onClick={() => handleResume(item)}
                  className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 active:scale-95 transition-all shrink-0"
                  title="Resume Playing"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Features & Device Info Card */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
          Mobile PWA Capabilities
        </h3>

        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-rose-500" />
              <span>Haptic Feedback Engine</span>
            </div>
            <span className="font-mono text-emerald-400 text-[11px]">50ms Active</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Hardware Gesture Simulation</span>
            </div>
            <span className="font-mono text-slate-400 text-[11px]">Volume & Brightness</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-rose-500" />
              <span>Back Button Interception</span>
            </div>
            <span className="font-mono text-emerald-400 text-[11px]">Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
