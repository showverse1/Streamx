import React, { useEffect, useMemo } from 'react';
import { Play, Sparkles, Star, TrendingUp, Film, Clock } from 'lucide-react';
import { useAppStore } from '../store';
import { Series } from '../types';

export const Home: React.FC = () => {
  const {
    series,
    isLoading,
    loadSeries,
    selectedCategory,
    setSelectedCategory,
    openSeriesWithEpisode,
    setSelectedSeriesId,
    haptic
  } = useAppStore();

  useEffect(() => {
    if (series.length === 0) {
      loadSeries();
    }
  }, [series.length, loadSeries]);

  // Derived category list
  const categories = useMemo(() => {
    const rawSet = new Set<string>(['All', 'Anime', 'K-Drama', 'Action', 'Sci-Fi', 'Romance']);
    series.forEach((s) => {
      if (s.category) rawSet.add(s.category);
    });
    return Array.from(rawSet);
  }, [series]);

  // Filtered series for the bottom grid
  const filteredSeries = useMemo(() => {
    if (selectedCategory === 'All') return series;
    return series.filter((s) => s.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [series, selectedCategory]);

  // Latest releases for horizontal snap row (sorted by uploadTimestamp)
  const latestReleases = useMemo(() => {
    return [...series].sort((a, b) => b.uploadTimestamp - a.uploadTimestamp).slice(0, 6);
  }, [series]);

  const handleSeriesClick = (item: Series) => {
    haptic(40);
    const firstSeason = item.seasons[0];
    const firstEp = firstSeason?.episodes[0];
    if (firstSeason && firstEp) {
      openSeriesWithEpisode(item.id, firstSeason.seasonNumber, firstEp.episodeNumber);
    } else {
      setSelectedSeriesId(item.id);
    }
  };

  const handleQuickPlay = (e: React.MouseEvent, item: Series) => {
    e.stopPropagation();
    haptic(60);
    const firstSeason = item.seasons[0];
    const firstEp = firstSeason?.episodes[0];
    if (firstSeason && firstEp) {
      openSeriesWithEpisode(item.id, firstSeason.seasonNumber, firstEp.episodeNumber);
    } else {
      setSelectedSeriesId(item.id);
    }
  };

  if (isLoading && series.length === 0) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-64 bg-slate-800/60 rounded-2xl w-full" />
        <div className="flex gap-2 overflow-x-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-slate-800/60 rounded-full shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 bg-slate-800/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* SECTION A: TOP - LATEST RELEASES (Horizontal Snap-Scroll Row) */}
      <section className="pt-2">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <h2 className="text-base font-extrabold tracking-tight text-white">
              Latest Releases
            </h2>
          </div>
          <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> New Drops
          </span>
        </div>

        {/* Horizontal Snap Carousel */}
        <div className="flex gap-3.5 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
          {latestReleases.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSeriesClick(item)}
              className="relative shrink-0 w-[82vw] sm:w-80 h-56 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 snap-start shadow-xl shadow-black/40 cursor-pointer group active:scale-[0.98] transition-transform"
            >
              {/* Image & Gradient Backdrop */}
              <img
                src={item.bannerUrl || item.thumbnailUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

              {/* Badges & Meta */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-rose-600/90 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                  {item.category}
                </span>
                {item.rating && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-400/20">
                    <Star className="w-2.5 h-2.5 fill-amber-300" />
                    {item.rating}
                  </span>
                )}
              </div>

              {/* Title & Quick Play */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-white text-base tracking-tight leading-tight truncate drop-shadow">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                    <span>{item.seasons.length} {item.seasons.length > 1 ? 'Seasons' : 'Season'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.seasons[0]?.episodes.length || 0} Episodes
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleQuickPlay(e, item)}
                  className="shrink-0 p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/50 active:scale-90 transition-transform"
                  title="Quick Play"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION B: MIDDLE - FILTER CHIPS (Horizontal Scroll) */}
      <section className="px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION C: BOTTOM - CSS GRID OF FILTERED SERIES */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-200">
              {selectedCategory === 'All' ? 'Explore All Series' : `${selectedCategory} Collection`}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filteredSeries.length} {filteredSeries.length === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        {filteredSeries.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Film className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="text-sm font-medium">No series found in "{selectedCategory}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredSeries.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSeriesClick(item)}
                className="group relative flex flex-col bg-slate-900/90 rounded-xl overflow-hidden border border-slate-800/70 hover:border-slate-700 transition-all duration-200 cursor-pointer active:scale-95 shadow-md shadow-black/30"
              >
                {/* Poster Thumbnail */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/20" />

                  {/* Top badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-rose-400 uppercase border border-rose-500/20">
                      {item.category}
                    </span>
                  </div>

                  {item.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-amber-300 border border-amber-400/20">
                      <Star className="w-2 h-2 fill-amber-300" />
                      {item.rating}
                    </div>
                  )}

                  {/* Quick play hover button */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickPlay(e, item)}
                    className="absolute bottom-2 right-2 p-2 rounded-full bg-rose-600/90 text-white shadow-md active:scale-90 transition-transform opacity-90 hover:opacity-100"
                    title="Play"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <h4 className="font-bold text-xs text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <span>{item.year || 2026}</span>
                    <span>{item.seasons[0]?.episodes.length || 0} Eps</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
