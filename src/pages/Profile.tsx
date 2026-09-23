import React, { useState } from 'react';
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
  ChevronRight,
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

export const Profile: React.FC = () => {
  const {
    user,
    logout,
    setIsAuthModalOpen,
    setIsContentManagerOpen,
    watchHistory,
    recentSearches,
    clearAllHistory,
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
    clearAllHistory();
    setIsConfirmModalOpen(false);
    setToastMessage('Watch history and search history wiped from localStorage.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 border border-rose-500/60 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl">
            <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
            <span className="flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsConfirmModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl shadow-black text-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Clear All History?</h3>
                  <p className="text-[11px] text-slate-400">LocalStorage Wipe Confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  haptic(25);
                  setIsConfirmModalOpen(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Description */}
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will permanently wipe all watch records and recent search queries stored in this browser’s <strong>localStorage</strong>:
            </p>

            {/* Itemized breakdown */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <History className="w-3.5 h-3.5 text-rose-500" />
                  <span>Watch History</span>
                </div>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full text-[11px]">
                  {watchHistory.length} {watchHistory.length === 1 ? 'record' : 'records'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2 text-slate-300">
                  <SearchIcon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Recent Searches</span>
                </div>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full text-[11px]">
                  {recentSearches.length} {recentSearches.length === 1 ? 'query' : 'queries'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Note: Downloaded offline episodes and playback settings will remain unaffected.
            </p>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  haptic(25);
                  setIsConfirmModalOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card Header with Email & Password Login */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 p-5 border border-slate-800 shadow-xl">
        {user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-0.5 shadow-lg shadow-rose-600/30">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-rose-500 text-lg">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'SX'}
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-white text-sm truncate">
                    {user.name}
                  </h2>
                  <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                </div>
                <p className="text-xs text-slate-300 font-mono truncate flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-slate-400">
                    {watchHistory.length} watched
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
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-all shrink-0 active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
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
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
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

      {/* WATCH HISTORY SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-rose-500" />
            <h3 className="font-extrabold text-sm text-white tracking-tight">
              Watch History
            </h3>
          </div>

          {(watchHistory.length > 0 || recentSearches.length > 0) && (
            <button
              type="button"
              onClick={() => {
                haptic(40);
                setIsConfirmModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold transition active:scale-95"
              title="Clear All Watch and Search History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
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

      {/* Data & LocalStorage Management Card */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-3.5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Data & Privacy (LocalStorage)</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            {watchHistory.length + recentSearches.length} items stored
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Watch Entries</span>
            <span className="font-mono text-xs font-bold text-white">{watchHistory.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Search Queries</span>
            <span className="font-mono text-xs font-bold text-white">{recentSearches.length}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic(40);
            setIsConfirmModalOpen(true);
          }}
          disabled={watchHistory.length === 0 && recentSearches.length === 0}
          className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition active:scale-98 ${
            watchHistory.length > 0 || recentSearches.length > 0
              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 shadow-sm'
              : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All History</span>
        </button>
      </div>

      {/* Mobile Features & Device Info Card */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
          Mobile PWA Capabilities
        </h3>

        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Firebase Cloud DB & Auth</span>
            </div>
            <span className="font-mono text-emerald-400 text-[11px]">Connected</span>
          </div>

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

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>ServiceWorker Static Cache</span>
            </div>
            <span className="font-mono text-emerald-400 text-[11px]">Active (PWA)</span>
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
