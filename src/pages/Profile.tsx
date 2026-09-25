import React, { useState } from 'react';
import {
  History,
  Trash2,
  Play,
  Clock,
  ShieldCheck,
  Film,
  Sparkles,
  AlertTriangle,
  X,
  Search as SearchIcon,
  Check,
  LogIn,
  LogOut,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { useAppStore } from '../store';
import { WatchHistoryItem } from '../types';
import { SkeletonImage } from '../components/SkeletonImage';

export const Profile: React.FC = () => {
  const {
    user,
    logout,
    setIsAuthModalOpen,
    setIsContentManagerOpen,
    watchHistory,
    recentSearches,
    clearAllHistory,
    clearWatchHistory,
    clearRecentSearches,
    openSeriesWithEpisode,
    series,
    setSelectedSeriesId,
    haptic
  } = useAppStore();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    openSeriesWithEpisode(item.seriesId, item.seasonNum, item.episodeNum);
  };

  const handleOpenSeries = (seriesId: string) => {
    haptic(40);
    openSeriesWithEpisode(seriesId, 1, 1);
  };

  const handleConfirmClear = () => {
    haptic(60);
    clearAllHistory();
    setIsConfirmModalOpen(false);
    setToastMessage('All watch records and search history wiped cleanly.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleClearWatchOnly = () => {
    haptic(50);
    clearWatchHistory();
    setToastMessage('Watch history cleared.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto relative bg-black min-h-screen text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-black/95 border border-cyan-400 text-white text-xs font-semibold shadow-[0_0_25px_rgba(0,243,255,0.4)] backdrop-blur-xl">
            <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsConfirmModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-black border border-cyan-500/40 p-5 shadow-[0_0_35px_rgba(0,243,255,0.3)] text-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,243,255,0.4)]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Clear All History?</h3>
                  <p className="text-[11px] text-cyan-400 font-mono">StreamX Privacy Clean</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  haptic(25);
                  setIsConfirmModalOpen(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Description */}
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will permanently wipe all watch records and recent search queries stored in this browser’s <strong>localStorage</strong> & cloud sync:
            </p>

            {/* Itemized breakdown */}
            <div className="rounded-2xl bg-black border border-slate-800 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Watch History</span>
                </div>
                <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded-full text-[11px] border border-cyan-500/30">
                  {watchHistory.length} {watchHistory.length === 1 ? 'record' : 'records'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-300">
                  <SearchIcon className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Recent Searches</span>
                </div>
                <span className="font-mono font-bold text-fuchsia-300 bg-slate-900 px-2 py-0.5 rounded-full text-[11px] border border-fuchsia-500/30">
                  {recentSearches.length} {recentSearches.length === 1 ? 'query' : 'queries'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  haptic(25);
                  setIsConfirmModalOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white text-xs font-black shadow-[0_0_15px_rgba(0,243,255,0.5)] border border-cyan-300 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card Header with Email & Password Login */}
      <div className="relative overflow-hidden rounded-2xl bg-black p-5 border border-cyan-500/30 shadow-[0_0_25px_rgba(0,243,255,0.15)]">
        {user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-fuchsia-600 p-0.5 shadow-[0_0_15px_rgba(0,243,255,0.5)]">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-black text-cyan-300 text-lg">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'SX'}
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-black shadow-[0_0_8px_#00f3ff]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-white text-sm truncate">
                    {user.name}
                  </h2>
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-300 font-mono truncate flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-cyan-400 font-mono font-semibold">
                    {watchHistory.length} watched titles
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic(40);
                logout();
              }}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all shrink-0 active:scale-95 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.25)]">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-white text-sm">
                    Guest Account
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sign in with email and password
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic(40);
                setIsAuthModalOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-extrabold text-xs shadow-[0_0_18px_rgba(0,243,255,0.4)] transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Login with Email & Password</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Studio & Upload Hub (STRICTLY ADMIN ONLY: vk8260428@gmail.com) */}
      {user?.email?.toLowerCase().trim() === 'vk8260428@gmail.com' && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-4 border border-rose-500/30 space-y-3 shadow-lg shadow-rose-950/20 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  Content Studio
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Admin
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {series.length} Movies & Series in Cloud Firestore
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Content Manager: Add movies, web series, seasons, episodes, thumbnails & video stream links.
          </p>

          <button
            type="button"
            onClick={() => {
              haptic(40);
              setIsContentManagerOpen(true);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Open Content Manager & Bulk Uploader</span>
          </button>
        </div>
      )}

      {/* WATCH HISTORY SECTION (Electric Neon Cyberpunk Style) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
            <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
              <span>Watch History</span>
              {watchHistory.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                  {watchHistory.length}
                </span>
              )}
            </h3>
          </div>

          {(watchHistory.length > 0 || recentSearches.length > 0) && (
            <button
              type="button"
              onClick={() => {
                haptic(40);
                setIsConfirmModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold shadow-[0_0_12px_rgba(0,243,255,0.2)] active:scale-95 transition cursor-pointer"
              title="Clear All Watch and Search History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          )}
        </div>

        {watchHistory.length === 0 ? (
          <div className="p-8 rounded-2xl bg-black border border-cyan-500/20 text-center space-y-2 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <Clock className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">
              No watch history recorded yet
            </p>
            <p className="text-[11px] text-slate-500">
              Play any movie or episode to automatically sync your progress.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {watchHistory.map((item, idx) => (
              <div
                key={`${item.seriesId}_s${item.seasonNum}_e${item.episodeNum}_${idx}`}
                className="relative overflow-hidden flex items-center justify-between p-3 rounded-2xl bg-black/90 border border-cyan-500/40 hover:border-cyan-300 hover:shadow-[0_0_24px_rgba(0,243,255,0.35)] transition-all group shadow-lg"
              >
                {/* Left Vertical Neon Glow Bar */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 via-sky-400 to-fuchsia-500 shadow-[0_0_8px_#00f3ff]" />

                {/* Thumbnail & Title with SkeletonImage */}
                <div
                  onClick={() => handleOpenSeries(item.seriesId)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pl-1"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,243,255,0.35)]">
                    <SkeletonImage
                      src={item.seriesThumbnail}
                      alt={item.seriesTitle || 'Thumbnail'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-900">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 shadow-[0_0_8px_#00f3ff]"
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
                    <h4 className="font-extrabold text-xs text-white truncate group-hover:text-cyan-300 transition-colors drop-shadow">
                      {item.seriesTitle || 'Streaming Series'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-400/40 font-mono font-bold shadow-[0_0_8px_rgba(0,243,255,0.25)]">
                        S{item.seasonNum} : E{item.episodeNum}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resume Play Button (Vibrant Neon Glow) */}
                <button
                  type="button"
                  onClick={() => handleResume(item)}
                  className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white shadow-[0_0_16px_rgba(0,243,255,0.6)] border border-cyan-300 active:scale-90 transition-all shrink-0 cursor-pointer"
                  title="Resume Playing"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data & LocalStorage Management Card (Neon Cyberpunk Style) */}
      <div className="rounded-2xl bg-black border border-cyan-500/30 p-4 space-y-3.5 shadow-[0_0_20px_rgba(0,243,255,0.12)]">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Data & Privacy Controls</span>
          </h3>
          <span className="text-[10px] text-cyan-400 font-mono">
            {watchHistory.length + recentSearches.length} items stored
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Watch Entries</span>
            <span className="font-mono text-xs font-bold text-cyan-300">{watchHistory.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Search Queries</span>
            <span className="font-mono text-xs font-bold text-fuchsia-300">{recentSearches.length}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {watchHistory.length > 0 && (
            <button
              type="button"
              onClick={handleClearWatchOnly}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              Clear Watch Only
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              haptic(40);
              setIsConfirmModalOpen(true);
            }}
            disabled={watchHistory.length === 0 && recentSearches.length === 0}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition active:scale-98 cursor-pointer ${
              watchHistory.length > 0 || recentSearches.length > 0
                ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(0,243,255,0.4)] border border-cyan-300'
                : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
