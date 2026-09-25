import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { highRefreshRate } from '../services/highRefreshRate';
import { useAppStore } from '../store';

export const RefreshRateBadge: React.FC = () => {
  const { haptic } = useAppStore();
  const [hz, setHz] = useState<number>(highRefreshRate.getHz());
  const [active, setActive] = useState<boolean>(highRefreshRate.isActive());

  useEffect(() => {
    return highRefreshRate.subscribe((currentHz, isHigh) => {
      setHz(currentHz);
      setActive(isHigh);
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
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-black transition-all active:scale-95 cursor-pointer border select-none ${
        active
          ? 'bg-gradient-to-r from-cyan-950/80 to-sky-950/80 text-cyan-300 border-cyan-400/60 shadow-[0_0_10px_rgba(0,243,255,0.4)]'
          : 'bg-black text-slate-500 border-slate-800'
      }`}
      title={active ? '120Hz Ultra Mode Active (Tap to toggle)' : '60Hz Power Saver Mode (Tap to enable 120Hz)'}
    >
      <Zap className={`w-2.5 h-2.5 ${active ? 'fill-cyan-400 text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
      <span>{active ? `${hz}Hz` : '60Hz'}</span>
    </button>
  );
};
