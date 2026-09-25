import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { highRefreshRate, RefreshMode } from '../services/highRefreshRate';
import { useAppStore } from '../store';

export const RefreshRateBadge: React.FC = () => {
  const { haptic } = useAppStore();
  const [hz, setHz] = useState<number>(highRefreshRate.getHz());
  const [active, setActive] = useState<boolean>(highRefreshRate.isActive());
  const [mode, setMode] = useState<RefreshMode>(highRefreshRate.getMode());

  useEffect(() => {
    return highRefreshRate.subscribe((currentHz, isHigh, currentMode) => {
      setHz(currentHz);
      setActive(isHigh);
      setMode(currentMode);
    });
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic(35);
    highRefreshRate.toggle120HzMode();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-black transition-all active:scale-95 cursor-pointer border select-none ${
        active
          ? 'bg-gradient-to-r from-cyan-950/90 via-sky-950/80 to-blue-950/90 text-cyan-300 border-cyan-400/70 shadow-[0_0_12px_rgba(0,243,255,0.45)]'
          : 'bg-black/90 text-slate-400 border-slate-800 hover:text-slate-200'
      }`}
      title={
        active
          ? `${hz}Hz Ultra Smooth Mode Active (Tap to switch to 60Hz Eco)`
          : '60Hz Eco Mode Active (Tap to activate 120Hz Ultra Mode)'
      }
      aria-label={`Current refresh rate: ${active ? `${hz}Hz Ultra` : '60Hz Eco'}. Tap to toggle.`}
    >
      <Zap
        className={`w-3 h-3 transition-colors ${
          active ? 'fill-cyan-400 text-cyan-300 animate-pulse drop-shadow-[0_0_6px_rgba(0,243,255,0.8)]' : 'text-slate-500'
        }`}
      />
      <span>{active ? `${hz}Hz` : '60Hz'}</span>
    </button>
  );
};
