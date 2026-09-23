import React, { useEffect, useRef } from 'react';
import { Home, Search, Download, User, AlertCircle, WifiOff } from 'lucide-react';
import { useAppStore } from '../store';
import { TabType } from '../types';
import { OfflineToast } from './OfflineToast';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from './useOnlineStatus';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    currentTab,
    setCurrentTab,
    selectedSeriesId,
    setSelectedSeriesId,
    activePlayback,
    stopPlayback,
    backExitWarning,
    setBackExitWarning,
    haptic
  } = useAppStore();

  const lastBackPressRef = useRef<number>(0);
  const exitTimeoutRef = useRef<number | null>(null);
  const { isOnline } = useOnlineStatus();

  // Browser History Interception
  useEffect(() => {
    // Push an initial history marker
    window.history.pushState({ streamx: 'init' }, '');

    const handlePopState = () => {
      // 1. If video player is active, close video player
      if (activePlayback) {
        stopPlayback();
        window.history.pushState({ streamx: 'playback-closed' }, '');
        return;
      }

      // 2. If Series detail is open, close it back to current tab
      if (selectedSeriesId) {
        setSelectedSeriesId(null);
        window.history.pushState({ streamx: 'detail-closed' }, '');
        return;
      }

      // 3. If on other tab, switch back to Home
      if (currentTab !== 'home') {
        setCurrentTab('home');
        window.history.pushState({ streamx: 'home-tab' }, '');
        return;
      }

      // 4. If already on Home tab: intercept back button to show "Press back again to exit"
      const now = Date.now();
      if (now - lastBackPressRef.current < 2500) {
        // Second back press within 2.5s -> let browser perform natural exit or close
        setBackExitWarning(false);
        haptic(80);
        window.history.back();
      } else {
        // First back press -> intercept and warn
        lastBackPressRef.current = now;
        window.history.pushState({ streamx: 'home-warned' }, '');
        setBackExitWarning(true);
        haptic(50);

        if (exitTimeoutRef.current) {
          window.clearTimeout(exitTimeoutRef.current);
        }
        exitTimeoutRef.current = window.setTimeout(() => {
          setBackExitWarning(false);
        }, 2500);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitTimeoutRef.current) {
        window.clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [activePlayback, selectedSeriesId, currentTab, stopPlayback, setSelectedSeriesId, setCurrentTab, setBackExitWarning, haptic]);

  const navItems: { tab: TabType; label: string; icon: typeof Home }[] = [
    { tab: 'home', label: 'Home', icon: Home },
    { tab: 'search', label: 'Search', icon: Search },
    { tab: 'downloads', label: 'Downloads', icon: Download },
    { tab: 'me', label: 'Me', icon: User },
  ];

  return (
    <div className="relative min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Mobile Status Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#090a0f]/90 backdrop-blur-md border-b border-slate-800/60 safe-pt">
        <div 
          onClick={() => {
            haptic(40);
            setCurrentTab('home');
          }}
          className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 via-red-600 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-rose-600/30">
            X
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                StreamX
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                PWA
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          {isOnline ? (
            <div className="flex items-center gap-1.5 bg-slate-800/70 border border-slate-700/60 rounded-full px-2.5 py-1 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-[11px]">4K ULTRA</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/50 rounded-full px-2.5 py-1 text-xs text-amber-300 shadow-sm animate-pulse">
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span className="font-semibold text-[10px] tracking-wide">OFFLINE</span>
            </div>
          )}
        </div>
      </header>

      {/* Offline Toast Notification */}
      <OfflineToast />

      {/* Main Page Content */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* "Press back again to exit" Floating Alert */}
      {backExitWarning && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 border border-rose-500/50 text-slate-100 text-xs font-semibold shadow-2xl backdrop-blur-lg">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Press back again to exit</span>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0f17]/95 backdrop-blur-xl border-t border-slate-800/80 safe-pb">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
          {navItems.map(({ tab, label, icon: Icon }) => {
            const isActive = currentTab === tab && !selectedSeriesId;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCurrentTab(tab)}
                className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 active:scale-90 ${
                  isActive ? 'text-rose-500 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500" />
                  )}
                </div>
                <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
