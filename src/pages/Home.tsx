import React, { useEffect, useMemo } from 'react';
import { Play, Sparkles, Star, TrendingUp, Film, Clock, Flame } from 'lucide-react';
import { useAppStore } from '../store';
import { Series } from '../types';
import { SkeletonImage, SeriesCardSkeleton, CarouselCardSkeleton } from '../components/SkeletonImage';

export const Home: React.FC = () => {
  const {
    user,
    series,
    isLoading,
    loadSeries,
    selectedCategory,
    setSelectedCategory,
    openSeriesWithEpisode,
    setSelectedSeriesId,
    setIsContentManagerOpen,
    haptic
  } = useAppStore();

  useEffect(() => {
    if (series.length === 0) {
      loadSeries();
    }
  }, [series.length, loadSeries]);

  // Derived category list: 'Movie' replaces 'Sci-Fi', 'Indian' replaces 'Action'
  const categories = useMemo(() => {
    const rawSet = new Set<string>(['All', 'Movie', 'Indian', 'Anime', 'K-Drama', 'Romance']);
    series.forEach((s) => {
      if (s.category) {
        const lower = s.category.toLowerCase();
        if (lower === 'sci-fi') rawSet.add('Movie');
        else if (lower === 'action') rawSet.add('Indian');
        else rawSet.add(s.category);
      }
    });
    return Array.from(rawSet);
  }, [series]);

  // Filtered series for the bottom grid
  const filteredSeries = useMemo(() => {
    if (selectedCategory === 'All') return series;
    const selected = selectedCategory.toLowerCase();
    return series.filter((s) => {
      const cat = (s.category || '').toLowerCase();
      if (selected === 'movie') {
        return cat === 'movie' || cat === 'sci-fi' || s.tags?.some((t) => t.toLowerCase() === 'movie');
      }
      if (selected === 'indian') {
        return cat === 'indian' || cat === 'action' || s.tags?.some((t) => t.toLowerCase() === 'indian');
      }
      return cat === selected;
    });
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
      <div className="p-4 space-y-6 bg-black min-h-screen">
        {/* Category Pills Skeleton */}
        <div className="flex gap-2 overflow-x-hidden pt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-20 bg-slate-900 border border-cyan-500/20 rounded-full shrink-0 animate-pulse" />
          ))}
        </div>

        {/* Carousel Skeleton */}
        <div className="space-y-3 pt-2">
          <div className="h-5 w-36 bg-slate-900 rounded-md animate-pulse" />
          <div className="flex gap-3 overflow-x-hidden">
            {[1, 2, 3].map((i) => (
              <CarouselCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Grid Skeletons */}
        <div className="space-y-3 pt-2">
          <div className="h-5 w-28 bg-slate-900 rounded-md animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SeriesCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (series.length === 0) {
    const isAdmin = user?.email?.toLowerCase().trim() === 'vk8260428@gmail.com';
    return (
      <div className="p-6 text-center space-y-4 max-w-sm mx-auto pt-16 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-black border border-cyan-500/40 shadow-[0_0_25px_rgba(0,243,255,0.4)] flex items-center justify-center mx-auto text-cyan-400">
          <Film className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white tracking-wide">StreamX Neon Cinema</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {isAdmin
              ? 'Catalog is clean. Ready to upload movies, web series, episodes, and video streaming links.'
              : 'Fresh cinema titles and web series are dropping soon. Stay tuned!'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              haptic(40);
              setIsContentManagerOpen(true);
            }}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(0,243,255,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>Upload Movies & Series (Bulk Import)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 bg-black min-h-screen">
      {/* ========================================================================= */}
      {/* SECTION 1: TOP - CATEGORY OPTION CHIPS (Placed ABOVE Trending as requested) */}
      {/* ========================================================================= */}
      <section className="px-4 pt-3">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  haptic(35);
                  setSelectedCategory(cat);
                }}
                className={`relative px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(0,243,255,0.6)] border border-cyan-300 scale-105'
                    : 'bg-black/90 hover:bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-white'
                }`}
              >
                {isSelected && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5 shadow-[0_0_6px_#ffffff] animate-pulse" />
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: TRENDING & LATEST RELEASES (Horizontal Snap-Scroll Row) */}
      {/* ========================================================================= */}
      <section className="pt-1">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
            <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Trending & Latest</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                PRO
              </span>
            </h2>
          </div>
          <span className="text-xs text-fuchsia-400 font-bold flex items-center gap-1 drop-shadow-[0_0_6px_rgba(217,70,239,0.6)]">
            <Sparkles className="w-3 h-3" /> New Drops
          </span>
        </div>

        {/* Horizontal Snap Carousel */}
        <div className="flex gap-3.5 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
          {latestReleases.map((item) => {
            const displayCat =
              item.category?.toLowerCase() === 'sci-fi'
                ? 'Movie'
                : item.category?.toLowerCase() === 'action'
                ? 'Indian'
                : item.category;

            return (
              <div
                key={item.id}
                onClick={() => handleSeriesClick(item)}
                className="relative shrink-0 w-[82vw] sm:w-80 h-56 rounded-2xl overflow-hidden bg-black border border-cyan-500/30 hover:border-cyan-400/80 snap-start shadow-[0_0_25px_rgba(0,0,0,0.9)] hover:shadow-[0_0_25px_rgba(0,243,255,0.35)] cursor-pointer group active:scale-[0.98] transition-all duration-300"
              >
                {/* Image & Gradient Backdrop with SkeletonImage */}
                <SkeletonImage
                  src={item.bannerUrl || item.thumbnailUrl}
                  alt={item.title}
                  containerClassName="w-full h-full"
                  imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

                {/* Badges & Meta */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.6)] border border-cyan-400/50">
                    {displayCat}
                  </span>
                  {item.rating && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      {item.rating}
                    </span>
                  )}
                </div>

                {/* Title & Quick Play */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-white text-base tracking-tight leading-tight truncate drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                      <span>{item.seasons.length} {item.seasons.length > 1 ? 'Seasons' : 'Season'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {item.seasons[0]?.episodes.length || 0} Episodes
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleQuickPlay(e, item)}
                    className="shrink-0 p-3 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white shadow-[0_0_20px_rgba(0,243,255,0.7)] active:scale-90 transition-transform"
                    title="Quick Play"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: BOTTOM - CSS GRID OF FILTERED SERIES */}
      {/* ========================================================================= */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,243,255,0.7)]" />
            <h2 className="text-sm font-extrabold text-white tracking-wide">
              {selectedCategory === 'All' ? 'All Cinema & Series' : `${selectedCategory} Collection`}
            </h2>
          </div>
          <span className="text-xs text-cyan-300/80 font-mono font-bold">
            {filteredSeries.length} {filteredSeries.length === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        {filteredSeries.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Film className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
            <p className="text-sm font-medium">No titles found in "{selectedCategory}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredSeries.map((item) => {
              const displayCat =
                item.category?.toLowerCase() === 'sci-fi'
                  ? 'Movie'
                  : item.category?.toLowerCase() === 'action'
                  ? 'Indian'
                  : item.category;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSeriesClick(item)}
                  className="group relative flex flex-col bg-black rounded-2xl overflow-hidden border border-cyan-500/25 hover:border-cyan-400/80 hover:shadow-[0_0_25px_rgba(0,243,255,0.35)] transition-all duration-300 cursor-pointer active:scale-95 shadow-lg shadow-black/80"
                >
                  {/* Poster Thumbnail with SkeletonImage */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                    <SkeletonImage
                      src={item.thumbnailUrl}
                      alt={item.title}
                      containerClassName="w-full h-full"
                      imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

                    {/* Top badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-black text-cyan-300 uppercase border border-cyan-400/40 shadow-[0_0_8px_rgba(0,243,255,0.4)]">
                        {displayCat}
                      </span>
                    </div>

                    {item.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-bold text-amber-300 border border-amber-400/30 shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                        <Star className="w-2 h-2 fill-amber-300" />
                        {item.rating}
                      </div>
                    )}

                    {/* Quick play hover button */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickPlay(e, item)}
                      className="absolute bottom-2 right-2 p-2 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(0,243,255,0.8)] active:scale-90 transition-transform opacity-95 hover:opacity-100"
                      title="Play"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between bg-black">
                    <h4 className="font-extrabold text-xs text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                      <span>{item.year || 2026}</span>
                      <span className="text-cyan-400">{item.seasons[0]?.episodes.length || 0} Eps</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
