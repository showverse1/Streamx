import React, { useState, useMemo } from 'react';
import { ArrowLeft, Play, Star, CheckCircle2, Download, Clock, Info } from 'lucide-react';
import { useAppStore } from '../store';
import { Episode } from '../types';

export const SeriesDetail: React.FC = () => {
  const {
    selectedSeriesId,
    setSelectedSeriesId,
    series,
    watchHistory,
    startPlayback,
    addDownload,
    downloads,
    haptic
  } = useAppStore();

  const currentSeries = useMemo(() => {
    return series.find((s) => s.id === selectedSeriesId);
  }, [series, selectedSeriesId]);

  const [activeSeasonNum, setActiveSeasonNum] = useState<number>(1);
  const [selectedEpisodeInfo, setSelectedEpisodeInfo] = useState<Episode | null>(null);

  if (!currentSeries) return null;

  const activeSeason = currentSeries.seasons.find((s) => s.seasonNumber === activeSeasonNum) || currentSeries.seasons[0];

  // Helper to check if an episode is marked 'watched' in LocalStorage / Zustand
  const isEpisodeWatched = (epNum: number) => {
    return watchHistory.some(
      (item) =>
        item.seriesId === currentSeries.id &&
        item.seasonNum === activeSeason.seasonNumber &&
        item.episodeNum === epNum
    );
  };

  // Helper to check if an episode is downloaded
  const isEpisodeDownloaded = (epNum: number) => {
    return downloads.some(
      (d) =>
        d.seriesId === currentSeries.id &&
        d.seasonNum === activeSeason.seasonNumber &&
        d.episodeNum === epNum
    );
  };

  const handleEpisodeClick = (episode: Episode) => {
    haptic(50);
    setSelectedEpisodeInfo(episode);
    startPlayback(currentSeries, activeSeason.seasonNumber, episode);
  };

  const handleDownload = (e: React.MouseEvent, episode: Episode) => {
    e.stopPropagation();
    haptic(40);
    addDownload(currentSeries, activeSeason.seasonNumber, episode);
  };

  // Find next unwatched episode or first episode for the main CTA
  const resumeEpisode = useMemo(() => {
    if (!activeSeason || activeSeason.episodes.length === 0) return null;
    const unwatched = activeSeason.episodes.find((ep) => !isEpisodeWatched(ep.episodeNumber));
    return unwatched || activeSeason.episodes[0];
  }, [activeSeason, watchHistory]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 pb-20 animate-in fade-in duration-200">
      {/* Top Banner & Poster Hero */}
      <div className="relative w-full h-80 sm:h-96 overflow-hidden bg-slate-950">
        <img
          src={currentSeries.bannerUrl || currentSeries.thumbnailUrl}
          alt={currentSeries.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Back Button */}
        <button
          type="button"
          onClick={() => {
            haptic(40);
            setSelectedSeriesId(null);
          }}
          className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-95 transition-all border border-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Hero Overlay Meta */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-md bg-rose-600 font-black text-[10px] uppercase tracking-wider text-white">
              {currentSeries.category}
            </span>
            {currentSeries.rating && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                <Star className="w-3 h-3 fill-current" />
                {currentSeries.rating}
              </span>
            )}
            <span className="text-xs text-slate-300 font-medium">
              {currentSeries.year || 2026}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {currentSeries.title}
          </h1>

          {/* Quick CTA Play */}
          {resumeEpisode && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  haptic(60);
                  startPlayback(currentSeries, activeSeason.seasonNumber, resumeEpisode);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/40 active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {isEpisodeWatched(resumeEpisode.episodeNumber) ? 'Watch Again' : `Play S${activeSeason.seasonNumber}:E${resumeEpisode.episodeNumber}`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Series Details Body */}
      <div className="px-4 py-4 space-y-5">
        {/* Description & Tags */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {currentSeries.description || 'Experience the cinematic mobile journey of StreamX. Full high-definition streaming with instant gesture navigation.'}
        </p>

        {currentSeries.tags && currentSeries.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {currentSeries.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <hr className="border-slate-800/80" />

        {/* SEASONS HORIZONTALLY SCROLLABLE TABS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-sm text-white tracking-tight">
              Select Season
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {currentSeries.seasons.length} {currentSeries.seasons.length > 1 ? 'Seasons' : 'Season'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {currentSeries.seasons.map((season) => {
              const isSelected = season.seasonNumber === activeSeason.seasonNumber;
              return (
                <button
                  key={season.seasonNumber}
                  type="button"
                  onClick={() => {
                    haptic(35);
                    setActiveSeasonNum(season.seasonNumber);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-500/50'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Season {season.seasonNumber}
                </button>
              );
            })}
          </div>
        </div>

        {/* RESPONSIVE GRID OF SQUARE BOXES ("E1", "E2", ...) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-sm text-white tracking-tight">
              Episodes ({activeSeason.episodes.length})
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded bg-rose-950/80 border border-rose-500/50 inline-block" />
              <span>Watched</span>
            </div>
          </div>

          {/* Grid of Square Boxes */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
            {activeSeason.episodes.map((ep) => {
              const watched = isEpisodeWatched(ep.episodeNumber);
              const downloaded = isEpisodeDownloaded(ep.episodeNumber);

              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => handleEpisodeClick(ep)}
                  className={`group relative aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition-all duration-200 border active:scale-90 shadow-md ${
                    watched
                      ? 'bg-rose-950/50 border-rose-500/60 text-rose-200 shadow-rose-950/40' // Tinted episode square box background if watched
                      : 'bg-slate-900/90 border-slate-800 text-white hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-extrabold text-sm tracking-tight group-hover:scale-110 transition-transform">
                    E{ep.episodeNumber}
                  </span>

                  <span className="text-[9px] font-mono text-slate-400 mt-0.5 truncate max-w-[90%]">
                    {ep.duration}
                  </span>

                  {/* Watched Indicator Stamp */}
                  {watched && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="w-3 h-3 text-rose-400" />
                    </div>
                  )}

                  {/* Downloaded stamp */}
                  {downloaded && (
                    <div className="absolute bottom-1 right-1">
                      <Download className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Episode List View with Download Buttons */}
        <div className="space-y-3 pt-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Episode Guide
          </h4>
          <div className="space-y-2.5">
            {activeSeason.episodes.map((ep) => {
              const watched = isEpisodeWatched(ep.episodeNumber);
              const downloaded = isEpisodeDownloaded(ep.episodeNumber);

              return (
                <div
                  key={ep.id}
                  onClick={() => handleEpisodeClick(ep)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${
                    watched
                      ? 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-black text-xs border ${
                        watched
                          ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}
                    >
                      E{ep.episodeNumber}
                    </div>

                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate group-hover:text-rose-400">
                        {ep.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {ep.duration}
                        </span>
                        {watched && (
                          <span className="text-rose-400 font-semibold">• Watched</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, ep)}
                      className={`p-2 rounded-lg border transition-all active:scale-95 ${
                        downloaded
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                      title={downloaded ? 'Downloaded' : 'Download Episode'}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEpisodeClick(ep);
                      }}
                      className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95 transition-all"
                      title="Play Episode"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
