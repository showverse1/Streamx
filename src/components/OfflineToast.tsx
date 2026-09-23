import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X, HardDriveDownload } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';
import { useAppStore } from '../store';

export const OfflineToast: React.FC = () => {
  const { isOnline, justReconnected } = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const { haptic, setCurrentTab } = useAppStore();

  // Whenever offline status triggers, reset dismissed state so the toast appears
  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
      haptic(70);
    }
  }, [isOnline, haptic]);

  if (justReconnected) {
    return (
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-100 shadow-2xl backdrop-blur-xl">
          <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Wifi className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-white">Back Online</p>
            <p className="text-emerald-300/80 text-[11px]">Connection restored. Streaming resumed.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      {!dismissed ? (
        <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-amber-500/50 shadow-2xl shadow-black/80 backdrop-blur-xl text-slate-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <WifiOff className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">Offline</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Connection is lost. Static assets are cached and downloaded titles remain fully playable.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                haptic(20);
                setDismissed(true);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                haptic(40);
                setCurrentTab('downloads');
                setDismissed(true);
              }}
              className="flex items-center gap-1.5 font-semibold text-rose-400 hover:text-rose-300"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              <span>Go to Downloads</span>
            </button>
            <span className="text-[10px] text-slate-400">PWA Offline Cache Active</span>
          </div>
        </div>
      ) : (
        /* Subtle persistent pill when toast is dismissed so user stays informed */
        <div
          onClick={() => setDismissed(false)}
          className="flex items-center gap-2 mx-auto w-fit px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-[11px] font-semibold text-amber-200 shadow-lg backdrop-blur-md cursor-pointer active:scale-95 transition"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Offline Mode</span>
        </div>
      )}
    </div>
  );
};
