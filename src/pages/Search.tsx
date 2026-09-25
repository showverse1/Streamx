import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Film, Play, Star, History, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../store';
import { Series } from '../types';
import { SkeletonImage } from '../components/SkeletonImage';

export const Search: React.FC = () => {
  const {
    series,
    setSelectedSeriesId,
    openSeriesWithEpisode,
    haptic,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('All');

  const quickFilters = ['All', 'Movie', 'Indian', 'Anime', 'K-Drama', 'Popular'];

  const results = useMemo(() => {
    let filtered = series;

    if (activeQuickFilter !== 'All') {
      const target = activeQuickFilter.toLowerCase();
      filtered = filtered.filter((s) => {
        const cat = (s.category || '').toLowerCase();
        const tags = (s.tags || []).map((t) => t.toLowerCase());

        if (target === 'movie') {
          return cat === 'movie' || cat === 'sci-fi' || tags.includes('movie');
        }
        if (target === 'indian') {
          return cat === 'indian' || cat === 'action' || tags.includes('indian');
        }
        if (target === 'popular') {
          return parseFloat(s.rating || '0') >= 8.5;
        }
        return cat === target || tags.includes(target);
      });
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q)) ||
          s.seasons.some((season) =>
            season.episodes.some((ep) => ep.title.toLowerCase().includes(q))
          )
      );
    }

    return filtered;
  }, [series, query, activeQuickFilter]);

  const handleExecuteSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    haptic(35);
    setQuery(trimmed);
    addRecentSearch(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleExecuteSearch(query);
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  const handleSelectSeries = (s: Series) => {
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
    haptic(40);
    const s1 = s.seasons[0];
    const ep1 = s1?.episodes[0];
    if (s1 && ep1) {
      openSeriesWithEpisode(s.id, s1.seasonNumber, ep1.episodeNumber);
    } else {
      setSelectedSeriesId(s.id);
    }
  };

  const handleQuickPlay = (e: React.MouseEvent, s: Series) => {
    e.stopPropagation();
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
    haptic(50);
    const s1 = s.seasons[0];
    const ep1 = s1?.episodes[0];
    if (s1 && ep1) {
      openSeriesWithEpisode(s.id, s1.seasonNumber, ep1.episodeNumber);
    } else {
      setSelectedSeriesId(s.id);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto bg-black min-h-screen">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, Indian series, cinema, actors..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-20 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,243,255,0.35)] transition-all shadow-inner"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                haptic(25);
                setQuery('');
              }}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition active:scale-90"
              aria-label="Clear query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="p-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white text-xs font-bold shadow-[0_0_10px_rgba(0,243,255,0.4)] transition active:scale-95 cursor-pointer"
          >
            Search
          </button>
        </div>
      </form>

      {/* Quick Tag Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {quickFilters.map((tag) => {
          const isSelected = activeQuickFilter.toLowerCase() === tag.toLowerCase();
          return (
            <button
              key={tag}
              type="button"
              onClick={() => {
                haptic(30);
                setActiveQuickFilter(tag);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(0,243,255,0.6)] border border-cyan-300'
                  : 'bg-black text-slate-400 border border-slate-800 hover:border-cyan-500/40 hover:text-white'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Recent Searches Section */}
      {recentSearches.length > 0 && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 space-y-2.5 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <History className="w-3.5 h-3.5 text-rose-500" />
              <span>Recent Searches</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-medium">
                {recentSearches.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearRecentSearches();
              }}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition"
              title="Clear all recent searches"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>

          {/* Recent Searches Pill Flow with Quick Re-execution & Delete */}
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item) => {
              const isCurrentQuery = query.toLowerCase() === item.toLowerCase();
              return (
                <div
                  key={item}
                  onClick={() => handleExecuteSearch(item)}
                  className={`group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs transition-all cursor-pointer select-none active:scale-95 ${
                    isCurrentQuery
                      ? 'bg-rose-600/25 text-rose-300 border border-rose-500/50 shadow-sm'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60 hover:text-white'
                  }`}
                  title={`Tap to search for "${item}"`}
                >
                  <Clock className="w-3 h-3 text-slate-400 group-hover:text-rose-400 shrink-0" />
                  <span className="font-medium truncate max-w-[140px]">{item}</span>
                  <ArrowUpRight className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 text-rose-400 shrink-0" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(item);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/80 transition"
                    title="Remove this search"
                    aria-label={`Remove ${item}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1">
        <span>Found {results.length} results</span>
        {query && <span className="italic truncate max-w-[50%]">for "{query}"</span>}
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <div className="py-16 text-center space-y-2 text-slate-400">
          <Film className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No matching streaming titles</p>
          <p className="text-xs text-slate-500">
            Try searching for "Cyber", "Midnight", "Seoul", "Anime", or "Sci-Fi"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {results.map((item) => {
            const displayCat =
              item.category?.toLowerCase() === 'sci-fi'
                ? 'Movie'
                : item.category?.toLowerCase() === 'action'
                ? 'Indian'
                : item.category;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectSeries(item)}
                className="group bg-black rounded-2xl overflow-hidden border border-cyan-500/25 hover:border-cyan-400/80 hover:shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all cursor-pointer active:scale-95 flex flex-col shadow-lg shadow-black"
              >
                <div className="relative aspect-[3/4] bg-black overflow-hidden">
                  <SkeletonImage
                    src={item.thumbnailUrl}
                    alt={item.title}
                    containerClassName="w-full h-full"
                    imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent pointer-events-none" />

                  <div className="absolute top-2 left-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-black text-cyan-300 uppercase border border-cyan-400/40 shadow-[0_0_8px_rgba(0,243,255,0.4)]">
                      {displayCat}
                    </span>
                  </div>

                  {item.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-bold text-amber-300 border border-amber-400/30">
                      <Star className="w-2 h-2 fill-amber-300" />
                      {item.rating}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleQuickPlay(e, item)}
                    className="absolute bottom-2 right-2 p-2 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.8)] active:scale-90 transition-transform"
                    title="Play"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between bg-black">
                  <h4 className="font-extrabold text-xs text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                    <span>{item.year || 2026}</span>
                    <span className="text-cyan-400">{item.seasons[0]?.episodes.length || 0} Ep</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
