import React from 'react';
import { Download, HardDrive, Trash2, Play, CheckCircle2, Film } from 'lucide-react';
import { useAppStore } from '../store';
import { DownloadItem } from '../types';

export const Downloads: React.FC = () => {
  const { downloads, deleteDownload, openSeriesWithEpisode, series, setCurrentTab, haptic } = useAppStore();

  const handlePlayDownloaded = (item: DownloadItem) => {
    haptic(50);
    // Open the series directly with the half video player playing this episode
    openSeriesWithEpisode(item.seriesId, item.seasonNum, item.episodeNum);
  };

  const totalSizeMB = downloads.reduce((acc, d) => {
    const num = parseInt(d.fileSize.replace(/\D/g, ''), 10) || 120;
    return acc + num;
  }, 0);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Offline Storage Status Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-rose-500" />
            <h3 className="font-extrabold text-sm text-white">Offline Device Storage</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {totalSizeMB} MB Used
          </span>
        </div>

        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
            style={{ width: `${Math.min(100, (totalSizeMB / 1024) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{downloads.length} {downloads.length === 1 ? 'Episode' : 'Episodes'} Saved</span>
          <span>Max 1.0 GB Allocated</span>
        </div>
      </div>

      {/* Downloads List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
            <Download className="w-4 h-4 text-rose-500" />
            <span>Saved for Offline</span>
          </h4>
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Offline Storage
          </span>
        </div>

        {downloads.length === 0 ? (
          <div className="py-16 text-center space-y-3 p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Film className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No downloaded episodes</p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Tap the download icon next to any episode to save it for offline watching during flights or transit.
            </p>
            <button
              type="button"
              onClick={() => {
                haptic(40);
                setCurrentTab('home');
              }}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Browse Catalog</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {downloads.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div
                  onClick={() => handlePlayDownloaded(item)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.seriesTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/70 text-[8px] font-bold text-rose-400">
                      {item.quality}
                    </div>
                  </div>

                  <div className="min-w-0 pr-2">
                    <h5 className="font-bold text-xs text-white truncate">
                      {item.seriesTitle}
                    </h5>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      S{item.seasonNum} : E{item.episodeNum} - {item.episodeTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                      <span>{item.fileSize}</span>
                      <span>•</span>
                      <span className="text-emerald-400">Ready</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePlayDownloaded(item)}
                    className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95 transition-all"
                    title="Play Offline"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic(40);
                      deleteDownload(item.id);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all active:scale-95 border border-slate-700/60"
                    title="Delete Download"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
