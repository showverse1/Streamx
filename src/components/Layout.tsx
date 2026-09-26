import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Home, Search, Film, User, AlertCircle, WifiOff, ChevronLeft, Sparkles, Zap, Play } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { useAppStore } from '../store';
import { TabType } from '../types';
import { OfflineToast } from './OfflineToast';
import { PWAInstallButton } from './PWAInstallButton';
import { RefreshRateBadge } from './RefreshRateBadge';
import { useOnlineStatus } from './useOnlineStatus';
import { MiniPlayer } from './MiniPlayer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    user,
    currentTab,
    setCurrentTab,
    selectedSeriesId,
    setSelectedSeriesId,
    series,
    setMiniPlayer,
    activePlayback,
    stopPlayback,
    backExitWarning,
    setBackExitWarning,
    announcement,
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

    // 2. If Series detail is open, seamlessly transition to Picture-in-Picture mode!
    if (selectedSeriesId) {
      const activeVideo = document.querySelector('video') as HTMLVideoElement | null;
      if (activeVideo && !activeVideo.paused && activeVideo.currentTime > 0) {
        // Try system native PiP
        try {
          if (
            typeof document !== 'undefined' &&
            'pictureInPictureEnabled' in document &&
            document.pictureInPictureEnabled
          ) {
            activeVideo.requestPictureInPicture().catch(() => {});
          }
        } catch {
          // Continue to in-app PiP
        }

        const activeSeries = series.find((s) => s.id === selectedSeriesId);
        if (activeSeries) {
          const season = activeSeries.seasons[0];
          const ep = season?.episodes[0];
          if (ep) {
            setMiniPlayer({
              series: activeSeries,
              seasonNum: season.seasonNumber,
              episode: ep,
              currentTime: activeVideo.currentTime,
              isPaused: false
            });
          }
        }
      }

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

  const ADMIN_EMAILS = ['vk8260428@gmail.com', 'verseshow94@gmail.com'];
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase().trim()) : false;

  const navItems: { tab: TabType; label: string; icon: typeof Home; isStudio?: boolean }[] = [
    { tab: 'home', label: 'Home', icon: Home },
    { tab: 'movies', label: 'Cinema', icon: Film },
    { tab: 'search', label: 'Search', icon: Search },
    ...(isAdmin ? [{ tab: 'studio' as TabType, label: 'Studio', icon: Sparkles, isStudio: true }] : []),
    { tab: 'me', label: 'Profile', icon: User },
  ];

  return (
    <div className="relative min-h-[100dvh] bg-black text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Native Edge Swipe Back Visual Indicator */}
      {edgeSwipeProgress > 0 && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            transform: `translate3d(${edgeSwipeProgress * 28}px, -50%, 0)`,
            opacity: Math.min(1, edgeSwipeProgress * 1.5)
          }}
        >
          <div className="w-10 h-10 rounded-full bg-cyan-500/90 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.6)] flex items-center justify-center text-black font-bold border border-cyan-300">
            <ChevronLeft className="w-6 h-6 stroke-[3]" />
          </div>
        </div>
      )}

      {/* Top Mobile Status Header - ONLY on Home screen */}
      {currentTab === 'home' && !selectedSeriesId && (
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-black/90 backdrop-blur-2xl border-b border-cyan-500/25 safe-pt shadow-[0_4px_25px_rgba(0,0,0,0.9)] gpu-smooth">
          {/* Cinematic StreamX Brand Logo & Badge */}
          <div 
            onClick={() => {
              haptic(40);
              setCurrentTab('home');
            }}
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
          >
            {/* Cyber Neon Stream Badge */}
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 p-[1.5px] shadow-[0_0_16px_rgba(0,243,255,0.6)]">
              <div className="w-full h-full rounded-[10px] bg-black flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400 ml-0.5 drop-shadow-[0_0_6px_#00f3ff]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white drop-shadow">
                  Stream<span className="text-cyan-400 drop-shadow-[0_0_8px_#00f3ff]">X</span>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-300 font-mono text-[9px] font-black tracking-widest uppercase border border-cyan-400/40 shadow-[0_0_8px_rgba(0,243,255,0.4)]">
                  NEON
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f3ff] animate-ping" />
                <span className="text-[10px] text-cyan-300 font-mono tracking-wider font-semibold">
                  CINEMA • 4K
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <RefreshRateBadge />

            <button
              type="button"
              onClick={() => {
                haptic(35);
                setCurrentTab('search');
              }}
              className="p-2 rounded-xl bg-black border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,243,255,0.2)]"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <PWAInstallButton />

            {!isOnline && (
              <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 rounded-full px-2 py-0.5 text-[10px] text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)] animate-pulse">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>OFFLINE</span>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Global Broadcast Announcement Ticker (Managed by Creator Studio) */}
      {announcement?.enabled && announcement.text && currentTab !== 'studio' && (
        <div className="bg-black/90 border-b border-cyan-500/25 px-3 py-1.5 flex items-center gap-2 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider shrink-0 ${
              announcement.type === 'warning'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                : announcement.type === 'alert'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                : announcement.type === 'vip'
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/50 shadow-[0_0_8px_rgba(217,70,239,0.4)]'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(0,243,255,0.4)]'
            }`}
          >
            {announcement.tag || 'BROADCAST'}
          </span>
          <p className="truncate text-slate-200 text-[11px] font-semibold tracking-tight">
            {announcement.text}
          </p>
        </div>
      )}

      {/* Offline Toast Notification */}
      <OfflineToast />

      {/* Main Page Content with 120Hz smooth acceleration */}
      <main className={`flex-1 ${currentTab === 'studio' ? 'pb-0' : 'pb-24'} gpu-smooth bg-black`}>
        {children}
      </main>

      {/* Floating Picture-in-Picture Mini-Player */}
      <MiniPlayer />

      {/* "Press back again to exit" Floating Alert */}
      {backExitWarning && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-black/95 border border-cyan-400/60 text-slate-100 text-xs font-semibold shadow-[0_0_20px_rgba(0,243,255,0.4)] backdrop-blur-lg">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Press back again to exit</span>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar - Electric Neon Cyber Aesthetic (Hidden when in dedicated Creator Studio Mode) */}
      {currentTab !== 'studio' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl border-t border-cyan-500/25 safe-pb shadow-[0_-5px_25px_rgba(0,0,0,0.95)] gpu-smooth">
          <div className={`max-w-md mx-auto grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} px-2 py-1.5`}>
            {navItems.map(({ tab, label, icon: Icon, isStudio }) => {
              const isActive = currentTab === tab && !selectedSeriesId;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    haptic(35);
                    setCurrentTab(tab);
                  }}
                  className={`relative flex flex-col items-center justify-center py-1.5 px-1.5 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer ${
                    isActive
                      ? 'text-cyan-300 font-black'
                      : isStudio
                      ? 'text-fuchsia-400/90 hover:text-fuchsia-300'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-cyan-500/15 via-cyan-500/5 to-transparent pointer-events-none" />
                  )}
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive
                          ? 'scale-110 stroke-[2.5] text-cyan-300 drop-shadow-[0_0_10px_rgba(0,243,255,0.9)]'
                          : isStudio
                          ? 'stroke-[2] text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]'
                          : 'stroke-[1.8]'
                      }`}
                    />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f3ff]" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 tracking-tight truncate ${
                      isActive
                        ? 'text-cyan-300 font-black drop-shadow-[0_0_8px_rgba(0,243,255,0.7)]'
                        : isStudio
                        ? 'text-fuchsia-400 font-bold'
                        : 'text-slate-500 font-medium'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
