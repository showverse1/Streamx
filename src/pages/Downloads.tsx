import React, { useState } from 'react';
import {
  Download,
  HardDrive,
  Trash2,
  Play,
  CheckCircle2,
  FolderDown,
  FolderCheck,
  Smartphone,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store';
import { DownloadItem, Series } from '../types';
import { exportVideoToPhoneStorage, getOfflineStoragePathDescription } from '../services/offlineStorage';

export const Downloads: React.FC = () => {
  const {
    series,
    downloads,
    downloadProgress,
    deleteDownload,
    openSeriesWithEpisode,
    triggerDownloadWithProgress,
    setCurrentTab,
    haptic
  } = useAppStore();

  const [exportedId, setExportedId] = useState<string | null>(null);

  const handlePlayDownloaded = (item: DownloadItem) => {
    haptic(50);
    // Ensure series metadata exists in store for offline playback
    const exists = series.some((s) => s.id === item.seriesId);
    if (!exists) {
      const fallbackSeries: Series = {
        id: item.seriesId,
        title: item.seriesTitle,
        thumbnailUrl: item.thumbnailUrl,
        bannerUrl: item.thumbnailUrl,
        category: 'Downloaded',
        rating: '10',
        year: new Date(item.downloadDate).getFullYear(),
        description: 'Saved offline episode ready for playback with zero internet.',
        tags: ['Offline', 'Downloaded'],
        uploadTimestamp: item.downloadDate,
        seasons: [
          {
            seasonNumber: item.seasonNum,
            title: `Season ${item.seasonNum}`,
            episodes: [
              {
                id: item.id,
                episodeNumber: item.episodeNum,
                title: item.episodeTitle,
                duration: 'Offline',
                durationSeconds: 3600,
                videoUrl: item.videoUrl,
                thumbnailUrl: item.thumbnailUrl,
                description: 'Offline Video File'
              }
            ]
          }
        ]
      };
      useAppStore.setState({ series: [fallbackSeries, ...series] });
    }
    openSeriesWithEpisode(item.seriesId, item.seasonNum, item.episodeNum);
  };

  const handleRetryDownload = (item: DownloadItem) => {
    haptic(40);
    const matchedSeries = series.find((s) => s.id === item.seriesId) || {
      id: item.seriesId,
      title: item.seriesTitle,
      thumbnailUrl: item.thumbnailUrl,
      category: 'Downloads',
      rating: '10',
      year: new Date().getFullYear(),
      description: 'Downloaded content',
      tags: ['Offline'],
      uploadTimestamp: Date.now(),
      seasons: []
    } as Series;

    const episode = {
      id: item.id,
      episodeNumber: item.episodeNum,
      title: item.episodeTitle,
      duration: 'Offline',
      durationSeconds: 3600,
      videoUrl: item.videoUrl,
      thumbnailUrl: item.thumbnailUrl
    };

    triggerDownloadWithProgress(matchedSeries, item.seasonNum, episode);
  };

  const handleExportToDisk = async (item: DownloadItem) => {
    haptic(40);
    const success = await exportVideoToPhoneStorage(
      item.id,
      `${item.seriesTitle.replace(/[^a-zA-Z0-9]/g, '_')}_S${item.seasonNum}_E${item.episodeNum}.mp4`
    );

    if (success) {
      setExportedId(item.id);
      setTimeout(() => setExportedId(null), 3000);
    }
  };

  const totalSizeMB = downloads.reduce((acc, d) => {
    const num = parseInt(d.fileSize.replace(/\D/g, ''), 10) || 120;
    return acc + num;
  }, 0);

  const activeProgressList = Object.entries(downloadProgress);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* Offline Storage Status Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">App Offline Storage Folder</h3>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={getOfflineStoragePathDescription()}>
                {getOfflineStoragePathDescription()}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
            {totalSizeMB} MB
          </span>
        </div>

        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (totalSizeMB / 2048) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>IndexedDB + Android App Storage</span>
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Offline Ready
          </span>
        </div>
      </div>

      {/* Active In-Progress Downloads */}
      {activeProgressList.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Downloading to App Folder...
            </span>
            <span className="text-[10px] font-mono text-rose-400">
              {activeProgressList.length} in queue
            </span>
          </div>

          {activeProgressList.map(([id, prog]) => (
            <div key={id} className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-rose-500/20">
              <div className="flex items-center justify-between text-xs text-white">
                <span className="font-semibold truncate max-w-[200px]">Video Episode File</span>
                <span className="font-mono text-rose-300 font-bold">{prog.pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-150"
                  style={{ width: `${prog.pct}%` }}
                />
              </div>
              {prog.totalMB > 0 && (
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{prog.loadedMB} MB downloaded</span>
                  <span>{prog.totalMB} MB total</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Export feedback toast */}
      {exportedId && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Video file exported successfully to your phone's Downloads folder!</span>
        </div>
      )}

      {/* Downloads List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-extrabold text-sm text-white">
            Saved Offline Videos ({downloads.length})
          </h4>
          {downloads.length > 0 && (
            <span className="text-[11px] text-slate-400">Available without internet</span>
          )}
        </div>

        {downloads.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-300">No Offline Videos Saved</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                Download episodes to play smoothly anywhere on your phone with zero buffering and no internet!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg active:scale-95 transition"
            >
              Explore Movies & Series
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
                      {item.status === 'error' ? (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" /> Retry Needed
                        </span>
                      ) : item.status === 'downloading' ? (
                        <span className="text-sky-400 flex items-center gap-0.5 animate-pulse">
                          <Download className="w-2.5 h-2.5" /> Downloading...
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Offline File
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Retry if error */}
                  {item.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => handleRetryDownload(item)}
                      className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 shadow-md active:scale-95 transition-all"
                      title="Retry Download"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Play offline */}
                  <button
                    type="button"
                    onClick={() => handlePlayDownloaded(item)}
                    className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95 transition-all"
                    title="Play Offline"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Export to device disk */}
                  <button
                    type="button"
                    onClick={() => handleExportToDisk(item)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 border border-slate-700/60"
                    title="Save to Phone Storage (.mp4)"
                  >
                    <FolderDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete offline copy */}
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
