import React, { useState, useMemo } from 'react';
import { Film, Play, Star, Sparkles, Clock, Compass } from 'lucide-react';
import { useAppStore } from '../store';
import { Series } from '../types';

export const MoviesPage: React.FC = () => {
  const { series, openSeriesWithEpisode, setSelectedSeriesId, haptic } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Movie' | 'Indian' | 'Top Rated'>('All');

  const filteredItems = useMemo(() => {
    return series.filter((item) => {
      const cat = (item.category || '').toLowerCase();
      const tags = (item.tags || []).map((t) => t.toLowerCase());

      if (activeFilter === 'Movie') {
        return cat === 'movie' || cat === 'sci-fi' || tags.includes('movie');
      }
      if (activeFilter === 'Indian') {
        return cat === 'indian' || cat === 'action' || tags.includes('indian');
      }
      if (activeFilter === 'Top Rated') {
        return parseFloat(item.rating || '0') >= 8.5;
      }
      // 'All' shows items that are Movie or Indian or general series
      return true;
    });
  }, [series, activeFilter]);

  const handlePlay = (e: React.MouseEvent, item: Series) => {
    e.stopPropagation();
    haptic(60);
    const s1 = item.seasons[0];
    const ep1 = s1?.episodes[0];
    if (s1 && ep1) {
      openSeriesWithEpisode(item.id, s1.seasonNumber, ep1.episodeNumber);
    } else {
      setSelectedSeriesId(item.id);
    }
  };

  const handleSelectSeries = (item: Series) => {
    haptic(40);
    setSelectedSeriesId(item.id);
  };

  return (
    <div className="space-y-5 pb-8 bg-black min-h-screen">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,243,255,0.4)]">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Cinema & Indian</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-500/40">
                ULTRA HD
              </span>
            </h1>
            <p className="text-xs text-slate-400">Watch blockbuster movies & top Indian series</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-cyan-400 font-mono font-bold bg-black px-2.5 py-1 rounded-full border border-cyan-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{filteredItems.length}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {(['All', 'Movie', 'Indian', 'Top Rated'] as const).map((tab) => {
          const isSelected = activeFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                haptic(30);
                setActiveFilter(tab);
              }}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_18px_rgba(0,243,255,0.6)] border border-cyan-300'
                  : 'bg-black text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-white'
              }`}
            >
              {tab === 'Movie' ? '🎬 Movies' : tab === 'Indian' ? '🇮🇳 Indian Cinema' : tab === 'Top Rated' ? '⭐ 4K Top Rated' : '✨ All Titles'}
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="px-4">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Compass className="w-10 h-10 mx-auto text-cyan-500 opacity-60 animate-pulse" />
            <p className="text-sm font-semibold text-white">No titles in {activeFilter} category yet</p>
            <p className="text-xs text-slate-400">New blockbusters dropping soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {filteredItems.map((item) => {
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
                  className="group relative flex flex-col bg-black rounded-2xl overflow-hidden border border-cyan-500/25 hover:border-cyan-400/80 hover:shadow-[0_0_25px_rgba(0,243,255,0.35)] transition-all duration-300 cursor-pointer active:scale-95 shadow-lg shadow-black/80"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded bg-black/85 backdrop-blur-md text-[9px] font-black text-cyan-300 uppercase border border-cyan-400/40 shadow-[0_0_8px_rgba(0,243,255,0.4)]">
                        {displayCat}
                      </span>
                    </div>

                    {item.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-md text-[9px] font-bold text-amber-300 border border-amber-400/30">
                        <Star className="w-2 h-2 fill-amber-300" />
                        {item.rating}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handlePlay(e, item)}
                      className="absolute bottom-2 right-2 p-2.5 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(0,243,255,0.8)] active:scale-90 transition-transform"
                      title="Play Now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between bg-black">
                    <h3 className="font-extrabold text-xs text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                      <span>{item.year || 2026}</span>
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {item.seasons[0]?.episodes.length || 0} Ep
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
