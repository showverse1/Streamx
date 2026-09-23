import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Film, Play, Star } from 'lucide-react';
import { useAppStore } from '../store';
import { Series } from '../types';

export const Search: React.FC = () => {
  const { series, setSelectedSeriesId, startPlayback, haptic } = useAppStore();
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

  const handleSelectSeries = (s: Series) => {
    haptic(40);
    setSelectedSeriesId(s.id);
  };

  const handleQuickPlay = (e: React.MouseEvent, s: Series) => {
    e.stopPropagation();
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
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anime, K-drama, titles, actors..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              haptic(25);
              setQuery('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

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
