import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Film, Play, Star, History, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../store';
import { Series } from '../types';

export const Search: React.FC = () => {
  const {
    series,
    setSelectedSeriesId,
    startPlayback,
    haptic,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('All');

  const quickFilters = ['All', 'Anime', 'K-Drama', 'Action', 'Sci-Fi', 'Popular'];

  const results = useMemo(() => {
    let filtered = series;

    if (activeQuickFilter !== 'All') {
      filtered = filtered.filter(
        (s) =>
          s.category.toLowerCase() === activeQuickFilter.toLowerCase() ||
          s.tags?.some((t) => t.toLowerCase() === activeQuickFilter.toLowerCase())
      );
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
    setSelectedSeriesId(s.id);
  };

  const handleQuickPlay = (e: React.MouseEvent, s: Series) => {
    e.stopPropagation();
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
    haptic(50);
    const s1 = s.seasons[0];
    if (s1 && s1.episodes.length > 0) {
      startPlayback(s, s1.seasonNumber, s1.episodes[0]);
    } else {
      setSelectedSeriesId(s.id);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anime, K-drama, titles, actors..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-20 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
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
            className="p-1 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition active:scale-95"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
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
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectSeries(item)}
              className="group bg-slate-900/80 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-all cursor-pointer active:scale-95 flex flex-col shadow-md"
            >
              <div className="relative aspect-[3/4] bg-slate-950">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                <div className="absolute top-2 left-2">
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

                <button
                  type="button"
                  onClick={(e) => handleQuickPlay(e, item)}
                  className="absolute bottom-2 right-2 p-2 rounded-full bg-rose-600 text-white shadow-md active:scale-90"
                  title="Play"
                >
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </button>
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <h4 className="font-bold text-xs text-white line-clamp-1 group-hover:text-rose-400">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span>{item.year || 2026}</span>
                  <span>{item.seasons.length} {item.seasons.length > 1 ? 'Seasons' : 'Season'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
