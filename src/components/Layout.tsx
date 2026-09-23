import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Home, Search, Download, User, AlertCircle, WifiOff, ChevronLeft } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
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

  // Edge-swipe gesture indicator state
  const [edgeSwipeProgress, setEdgeSwipeProgress] = useState<number>(0);

  // Centralized native back action
  const handleBackAction = useCallback(() => {
    // 0. Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
      haptic(30);
      return true;
    }

    // 1. If standalone/modal video player is active, stop it
    if (activePlayback) {
      stopPlayback();
      haptic(40);
      window.history.pushState({ streamx: 'playback-closed' }, '');
      return true;
    }

    // 2. If Series detail is open, close it back to current tab
    if (selectedSeriesId) {
      setSelectedSeriesId(null);
      haptic(40);
      window.history.pushState({ streamx: 'detail-closed' }, '');
      return true;
    }

    // 3. If on other tab, switch back to Home
    if (currentTab !== 'home') {
      setCurrentTab('home');
      haptic(40);
      window.history.pushState({ streamx: 'home-tab' }, '');
      return true;
    }

    // 4. If already on Home tab: intercept back button to show "Press back again to exit"
    const now = Date.now();
    if (now - lastBackPressRef.current < 2500) {
      setBackExitWarning(false);
      haptic(80);
      try {
        CapApp.exitApp();
      } catch {
        window.history.back();
      }
    } else {
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
    return false;
  }, [activePlayback, selectedSeriesId, currentTab, stopPlayback, setSelectedSeriesId, setCurrentTab, setBackExitWarning, haptic]);

  // Native Capacitor hardware/system back button integration
  useEffect(() => {
    let removeListener: (() => void) | null = null;
    CapApp.addListener('backButton', () => {
      handleBackAction();
    })
      .then((handle) => {
        removeListener = () => handle.remove();
      })
      .catch(() => {
        // Not running in Capacitor native runtime
      });

    return () => {
      if (removeListener) removeListener();
    };
  }, [handleBackAction]);

  // Browser History (Popstate) Interception
  useEffect(() => {
    window.history.pushState({ streamx: 'init' }, '');
    const onPopState = () => {
      handleBackAction();
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [handleBackAction]);

  // Native Edge Swipe Back Gesture (iOS & Android Style)
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Swipe back initiates when touching within 36px of screen left bezel
      if (touch.clientX <= 36) {
        startX = touch.clientX;
        startY = touch.clientY;
        tracking = true;
      } else {
        tracking = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      // If user is clearly scrolling vertically, cancel edge swipe
      if (deltaY > 25 && deltaY > deltaX) {
        tracking = false;
        setEdgeSwipeProgress(0);
        return;
      }

      if (deltaX > 10) {
        const progress = Math.min(1, deltaX / 90);
        setEdgeSwipeProgress(progress);
      } else {
        setEdgeSwipeProgress(0);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      setEdgeSwipeProgress(0);

      // Trigger back if swiped right >= 65px with horizontal velocity
      if (deltaX >= 65 && deltaX > deltaY * 1.2) {
        handleBackAction();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleBackAction]);

  const navItems: { tab: TabType; label: string; icon: typeof Home }[] = [
    { tab: 'home', label: 'Home', icon: Home },
    { tab: 'search', label: 'Search', icon: Search },
    { tab: 'downloads', label: 'Downloads', icon: Download },
    { tab: 'me', label: 'Me', icon: User },
  ];

  return (
    <div className="relative min-h-[100dvh] bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Native Edge Swipe Back Visual Indicator */}
      {edgeSwipeProgress > 0 && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            transform: `translate3d(${edgeSwipeProgress * 28}px, -50%, 0)`,
            opacity: Math.min(1, edgeSwipeProgress * 1.5)
          }}
        >
          <div className="w-10 h-10 rounded-full bg-rose-600/90 backdrop-blur-md shadow-lg shadow-rose-600/40 flex items-center justify-center text-white border border-rose-400/50">
            <ChevronLeft className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      )}

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
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              StreamX
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          {!isOnline && (
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
