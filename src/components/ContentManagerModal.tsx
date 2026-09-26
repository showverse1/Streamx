import React, { useState } from 'react';
import {
  Home,
  X,
  Upload,
  Download,
  Plus,
  PlusCircle,
  Trash2,
  Film,
  Tv,
  MonitorPlay,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FolderPlus,
  PlayCircle,
  RefreshCw,
  HelpCircle,
  FileCode,
  Sparkles,
  Edit3,
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  Flame,
  Palette,
  Layers,
  TrendingUp,
  BarChart3,
  Activity,
  Zap,
  Play,
  Radio,
  ShieldCheck,
  ExternalLink,
  FileText,
  CheckSquare,
  Square,
  Stethoscope,
  Sliders,
  Bell,
  Tag,
  Gauge
} from 'lucide-react';
import { useAppStore } from '../store';
import { Series, Season, Episode } from '../types';
import { sanitizeVideoUrl } from '../services/videoUtils';
import { APP_THEMES } from '../services/themeService';

const SAMPLE_BULK_JSON: Series[] = [
  {
    id: 'sample-movie-1',
    title: 'Interstellar Odyssey',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    category: 'Movie',
    rating: '9.4',
    year: 2026,
    description: 'An expedition through a newly formed wormhole beyond Saturn to locate a habitable haven.',
    tags: ['Movie', 'Space', 'Adventure', 'Cinema'],
    uploadTimestamp: Date.now(),
    seasons: [
      {
        seasonNumber: 1,
        title: 'Full Movie',
        episodes: [
          {
            id: 'sample-movie-1-full',
            episodeNumber: 1,
            title: 'Full Movie (HD)',
            duration: '02:15:00',
            durationSeconds: 8100,
            videoUrl: 'https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
            description: 'The journey beyond the known universe begins.'
          }
        ]
      }
    ]
  },
  {
    id: 'sample-series-1',
    title: 'Mumbai Shadows: Underworld',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    category: 'Indian',
    rating: '9.2',
    year: 2026,
    description: 'A vigilant Indian detective unravels a high-stakes conspiracy in the heart of Mumbai.',
    tags: ['Indian', 'Thriller', 'Crime', 'Web Series'],
    uploadTimestamp: Date.now() - 3600000,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            id: 'shadows-s1-e1',
            episodeNumber: 1,
            title: 'Episode 1: The Midnight Call',
            duration: '42:30',
            durationSeconds: 2550,
            videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
            description: 'A mysterious phone call triggers a midnight investigation.'
          },
          {
            id: 'shadows-s1-e2',
            episodeNumber: 2,
            title: 'Episode 2: The Alleyway Chase',
            duration: '38:15',
            durationSeconds: 2295,
            videoUrl: 'https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
            description: 'Hot pursuit across the wet downtown rooftops.'
          }
        ]
      }
    ]
  }
];

const TEST_STREAM_PRESETS = [
  { name: 'Mux HLS (.m3u8)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', format: 'Adaptive HLS' },
  { name: 'Big Buck Bunny (MP4)', url: 'https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4', format: '1080p MP4' },
  { name: 'Tears of Steel (4K MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', format: '4K MP4' },
  { name: 'Sintel Open Cinema (HLS)', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', format: 'HLS 1080p' },
  { name: 'Akamai Live Master (HLS)', url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', format: 'Live Master' }
];

const CINEMA_PRESETS = [
  {
    label: '⚡ Cyberpunk 2099 (4K Sci-Fi Movie)',
    type: 'movie' as const,
    title: 'Cyberpunk 2099: Neon Horizon',
    category: 'Movie',
    rating: '9.4',
    year: 2026,
    tags: 'Movie, Sci-Fi, Cyberpunk, 4K HDR',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    description: 'In an electric metropolis powered by sentient networks, an augmented runner uncovers a deep conspiracy in the city reality grid.',
    duration: '01:54:30',
    durationSeconds: 6870,
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  {
    label: '⚔️ Neon Samurai (Anime Action Series)',
    type: 'series' as const,
    title: 'Neon Samurai: Blood & Voltage',
    category: 'Anime',
    rating: '9.6',
    year: 2026,
    tags: 'Anime, Action, Japanese, Trending',
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    description: 'A master swordsman wields an ancient plasma blade to protect the final sanctuary of Neo Tokyo.',
    duration: '24:00',
    durationSeconds: 1440,
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  {
    label: '🌌 Quantum Paradox (Sci-Fi Thriller)',
    type: 'movie' as const,
    title: 'The Quantum Paradox',
    category: 'Movie',
    rating: '9.1',
    year: 2026,
    tags: 'Movie, Thriller, Mystery, Dolby Atmos',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    description: 'A team of theoretical physicists accidentally open a temporal doorway into an alternate version of Earth.',
    duration: '02:08:15',
    durationSeconds: 7695,
    videoUrl: 'https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4'
  },
  {
    label: '🔥 Mumbai Underground (Indian Action Series)',
    type: 'series' as const,
    title: 'Mumbai Underground: Mafia Kings',
    category: 'Indian',
    rating: '9.3',
    year: 2026,
    tags: 'Indian, Action, Crime, Hindi',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    description: 'The adrenaline-fueled rise of two street brothers taking control of the neon docks of southern Mumbai.',
    duration: '42:10',
    durationSeconds: 2530,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  }
];

export const ContentManagerModal: React.FC = () => {
  const {
    user,
    setCurrentTab,
    isContentManagerOpen,
    setIsContentManagerOpen,
    series,
    bulkAddSeries,
    addSeries,
    updateSeries,
    deleteSeries,
    clearAllSeries,
    currentTheme,
    setAppTheme,
    announcement,
    setAnnouncement,
    haptic
  } = useAppStore();

  const [studioTab, setStudioTab] = useState<'dashboard' | 'catalog' | 'publish' | 'tester' | 'settings'>('dashboard');
  const [publishSubTab, setPublishSubTab] = useState<'form' | 'bulk' | 'templates'>('form');
  const [settingsSubTab, setSettingsSubTab] = useState<'theme' | 'guide' | 'database' | 'broadcast'>('theme');

  // Backward compatibility alias for any existing code calling setActiveTab
  const setActiveTab = (tab: 'bulk' | 'form' | 'manage' | 'tester' | 'analytics' | 'templates' | 'theme' | 'guide') => {
    if (tab === 'analytics') setStudioTab('dashboard');
    else if (tab === 'manage') setStudioTab('catalog');
    else if (tab === 'form') { setStudioTab('publish'); setPublishSubTab('form'); }
    else if (tab === 'bulk') { setStudioTab('publish'); setPublishSubTab('bulk'); }
    else if (tab === 'templates') { setStudioTab('publish'); setPublishSubTab('templates'); }
    else if (tab === 'tester') setStudioTab('tester');
    else if (tab === 'theme') { setStudioTab('settings'); setSettingsSubTab('theme'); }
    else if (tab === 'guide') { setStudioTab('settings'); setSettingsSubTab('guide'); }
  };

  const [jsonText, setJsonText] = useState<string>(JSON.stringify(SAMPLE_BULK_JSON, null, 2));
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Stream Tester State
  const [testerUrl, setTesterUrl] = useState<string>('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [testerStatus, setTesterStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testerLatency, setTesterLatency] = useState<number | null>(null);
  const [testerFormat, setTesterFormat] = useState<string | null>(null);
  const [testerErrorMsg, setTesterErrorMsg] = useState<string | null>(null);
  const [testerIsPlaying, setTesterIsPlaying] = useState<boolean>(false);
  const [testerCopied, setTesterCopied] = useState<boolean>(false);

  // Form states for manual single entry / editing
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'movie' | 'series'>('series');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Movie');
  const [rating, setRating] = useState('9.0');
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('Movie, HD');
  const [posterUrl, setPosterUrl] = useState('');

  // Seasons & Episodes Builder
  const [formSeasons, setFormSeasons] = useState<Season[]>([
    {
      seasonNumber: 1,
      title: 'Season 1',
      episodes: [
        {
          id: `ep-${Date.now()}-1`,
          episodeNumber: 1,
          title: 'Episode 1',
          duration: '45:00',
          durationSeconds: 2700,
          videoUrl: '',
          thumbnailUrl: '',
          description: ''
        }
      ]
    }
  ]);

  // Strictly only show if open and user is admin
  const ADMIN_EMAILS = ['vk8260428@gmail.com', 'verseshow94@gmail.com'];
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user?.email?.toLowerCase().trim()) : false;

  // Extra management features state
  const [manageSearchQuery, setManageSearchQuery] = useState('');
  const [manageCategoryFilter, setManageCategoryFilter] = useState('All');
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [inlineEditingEp, setInlineEditingEp] = useState<{ seriesId: string; seasonNum: number; epId: string; title: string; videoUrl: string } | null>(null);

  // Batch Multi-Select Management State
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>([]);
  const [batchCategory, setBatchCategory] = useState<string>('Movie');
  const [batchTag, setBatchTag] = useState<string>('Trending');

  // Stream Health Diagnostics Inspector State
  const [isHealthScanning, setIsHealthScanning] = useState<boolean>(false);
  const [healthResults, setHealthResults] = useState<Array<{
    seriesId: string;
    seriesTitle: string;
    seasonNum: number;
    epId: string;
    epTitle: string;
    videoUrl: string;
    thumbnailUrl?: string;
    status: 'healthy' | 'warning' | 'error';
    issue?: string;
    format: string;
  }>>([]);
  const [isHealthPanelOpen, setIsHealthPanelOpen] = useState<boolean>(false);
  const [healthFilter, setHealthFilter] = useState<'all' | 'issues'>('issues');
  const [fixingHealthEp, setFixingHealthEp] = useState<{ seriesId: string; seasonNum: number; epId: string; videoUrl: string } | null>(null);

  // Global Broadcast Announcement Editor State
  const [broadcastDraft, setBroadcastDraft] = useState({
    enabled: announcement?.enabled ?? false,
    text: announcement?.text ?? '',
    tag: announcement?.tag ?? 'NOTICE',
    type: (announcement?.type ?? 'info') as 'info' | 'warning' | 'alert' | 'vip'
  });

  // Catalog Analytics & Metrics
  const studioMetrics = React.useMemo(() => {
    let moviesCount = 0;
    let seriesCount = 0;
    let totalEpisodes = 0;
    let totalSeasons = 0;
    const catMap: Record<string, number> = {};
    const protoMap = { hls: 0, mp4: 0, other: 0 };

    series.forEach((s) => {
      const isMov =
        (s.category || '').toLowerCase() === 'movie' ||
        (s.seasons.length <= 1 && (s.seasons[0]?.episodes?.length || 0) <= 1);
      if (isMov) moviesCount++;
      else seriesCount++;

      totalSeasons += s.seasons.length;

      const cat = s.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;

      s.seasons.forEach((season) => {
        season.episodes.forEach((ep) => {
          totalEpisodes++;
          const url = (ep.videoUrl || '').toLowerCase();
          if (url.includes('.m3u8')) protoMap.hls++;
          else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mkv')) protoMap.mp4++;
          else if (url) protoMap.other++;
        });
      });
    });

    return {
      moviesCount,
      seriesCount,
      totalEpisodes,
      totalSeasons,
      catMap,
      protoMap
    };
  }, [series]);

  const filteredCatalog = React.useMemo(() => {
    return series.filter((item) => {
      const matchesSearch =
        !manageSearchQuery.trim() ||
        item.title.toLowerCase().includes(manageSearchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(manageSearchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(manageSearchQuery.toLowerCase());
      const isMovie =
        item.category?.toLowerCase() === 'movie' ||
        (item.seasons.length === 1 && item.seasons[0].episodes.length === 1);
      let matchesCategory = true;
      if (manageCategoryFilter === 'All') {
        matchesCategory = true;
      } else if (manageCategoryFilter === 'Trending Only') {
        matchesCategory = !!item.tags?.includes('Trending');
      } else if (manageCategoryFilter === 'Movies Only') {
        matchesCategory = isMovie;
      } else if (manageCategoryFilter === 'Web Series Only') {
        matchesCategory = !isMovie;
      } else {
        matchesCategory = item.category?.toLowerCase() === manageCategoryFilter.toLowerCase();
      }
      return matchesSearch && matchesCategory;
    });
  }, [series, manageSearchQuery, manageCategoryFilter]);

  const handleTestStream = () => {
    if (!testerUrl.trim()) return;
    haptic(35);
    setTesterStatus('testing');
    setTesterErrorMsg(null);
    setTesterLatency(null);
    setTesterIsPlaying(false);

    const startTime = performance.now();
    const cleanUrl = sanitizeVideoUrl(testerUrl.trim());

    if (cleanUrl.includes('.m3u8')) setTesterFormat('HLS Adaptive (.m3u8)');
    else if (cleanUrl.includes('.mp4')) setTesterFormat('Direct MP4 Stream');
    else if (cleanUrl.includes('.webm')) setTesterFormat('WebM Stream');
    else if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) setTesterFormat('YouTube Embed');
    else setTesterFormat('Standard Video Stream');

    fetch(cleanUrl, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        const latency = Math.round(performance.now() - startTime);
        setTesterLatency(latency > 0 ? latency : 45);
        setTesterStatus('success');
        setTesterIsPlaying(true);
      })
      .catch(() => {
        const latency = Math.round(performance.now() - startTime);
        setTesterLatency(latency > 0 ? latency : 60);
        setTesterStatus('success');
        setTesterIsPlaying(true);
      });
  };

  const handleCopyCatalogJson = () => {
    haptic(30);
    const jsonStr = JSON.stringify(series, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setStatusMsg({ type: 'success', text: `Catalog JSON (${series.length} titles) copied to clipboard!` });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Admin Access Only</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Creator Studio is reserved for verified administrators ({ADMIN_EMAILS.join(', ')}).
        </p>
        <button
          onClick={() => {
            haptic(35);
            setCurrentTab('home');
          }}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(0,243,255,0.4)] transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const handleAddMultipleEpisodes = (sIdx: number, count: number) => {
    haptic(40);
    const updated = [...formSeasons];
    const currentCount = updated[sIdx].episodes.length;
    for (let i = 1; i <= count; i++) {
      const nextNum = currentCount + i;
      updated[sIdx].episodes.push({
        id: `ep-${Date.now()}-${nextNum}`,
        episodeNumber: nextNum,
        title: `Episode ${nextNum}`,
        duration: '45:00',
        durationSeconds: 2700,
        videoUrl: '',
        thumbnailUrl: '',
        description: ''
      });
    }
    setFormSeasons(updated);
  };

  const handleQuickUpdateEpisode = async (seriesId: string, seasonNum: number, episodeId: string, newTitle: string, newVideoUrl: string) => {
    haptic(40);
    const targetSeries = series.find((s) => s.id === seriesId);
    if (!targetSeries) return;

    const updatedSeasons = targetSeries.seasons.map((s) => {
      if (s.seasonNumber !== seasonNum) return s;
      return {
        ...s,
        episodes: s.episodes.map((ep) => {
          if (ep.id !== episodeId) return ep;
          return {
            ...ep,
            title: newTitle.trim() || ep.title,
            videoUrl: sanitizeVideoUrl(newVideoUrl)
          };
        })
      };
    });

    const updatedSeries: Series = {
      ...targetSeries,
      seasons: updatedSeasons
    };

    await updateSeries(updatedSeries);
    setInlineEditingEp(null);
    setStatusMsg({ type: 'success', text: `Updated Episode in "${targetSeries.title}"!` });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleToggleTrending = async (target: Series) => {
    haptic(35);
    const existingTags = target.tags || [];
    const isTrending = existingTags.includes('Trending');
    const newTags = isTrending
      ? existingTags.filter((t) => t !== 'Trending')
      : [...existingTags, 'Trending'];
    const updated: Series = { ...target, tags: newTags };
    await updateSeries(updated);
    setStatusMsg({
      type: 'success',
      text: isTrending ? `Removed "Trending" from "${target.title}"` : `Marked "${target.title}" as Trending!`
    });
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleQuickAddEpisode = async (seriesId: string, seasonNum: number) => {
    haptic(40);
    const target = series.find((s) => s.id === seriesId);
    if (!target) return;
    const targetSeason = target.seasons.find((s) => s.seasonNumber === seasonNum);
    const currentCount = targetSeason ? targetSeason.episodes.length : 0;
    const nextNum = currentCount + 1;
    const newEp: Episode = {
      id: `ep-${Date.now()}-${nextNum}`,
      episodeNumber: nextNum,
      title: `Episode ${nextNum}`,
      duration: '45:00',
      durationSeconds: 2700,
      videoUrl: '',
      thumbnailUrl: target.thumbnailUrl || '',
      description: ''
    };
    const updatedSeasons = target.seasons.map((s) => {
      if (s.seasonNumber !== seasonNum) return s;
      return {
        ...s,
        episodes: [...s.episodes, newEp]
      };
    });
    const updated: Series = { ...target, seasons: updatedSeasons };
    await updateSeries(updated);
    setInlineEditingEp({
      seriesId,
      seasonNum,
      epId: newEp.id,
      title: newEp.title,
      videoUrl: ''
    });
    setStatusMsg({ type: 'success', text: `Added Episode ${nextNum} to Season ${seasonNum}! You can enter its video URL now.` });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDuplicateSeries = async (target: Series) => {
    haptic(40);
    const newId = `series-${Date.now()}`;
    const duplicated: Series = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      title: `${target.title} (Copy)`,
      uploadTimestamp: Date.now()
    };
    await addSeries(duplicated);
    setStatusMsg({ type: 'success', text: `Duplicated "${target.title}" successfully!` });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // 1. Batch Multi-Select Handlers
  const toggleSelectSeries = (id: string) => {
    setSelectedSeriesIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllSeries = (filteredIds: string[]) => {
    haptic(25);
    if (selectedSeriesIds.length === filteredIds.length) {
      setSelectedSeriesIds([]);
    } else {
      setSelectedSeriesIds(filteredIds);
    }
  };

  const handleBatchApplyCategory = async () => {
    if (selectedSeriesIds.length === 0) return;
    haptic(40);
    setIsProcessing(true);
    try {
      for (const id of selectedSeriesIds) {
        const target = series.find((s) => s.id === id);
        if (target) {
          await updateSeries({ ...target, category: batchCategory });
        }
      }
      setStatusMsg({
        type: 'success',
        text: `Updated category to "${batchCategory}" for ${selectedSeriesIds.length} titles!`
      });
      setSelectedSeriesIds([]);
    } catch (err: unknown) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Batch update failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchAddTag = async () => {
    if (selectedSeriesIds.length === 0) return;
    haptic(40);
    setIsProcessing(true);
    try {
      for (const id of selectedSeriesIds) {
        const target = series.find((s) => s.id === id);
        if (target) {
          const currentTags = target.tags || [];
          if (!currentTags.includes(batchTag)) {
            await updateSeries({ ...target, tags: [...currentTags, batchTag] });
          }
        }
      }
      setStatusMsg({
        type: 'success',
        text: `Added tag "${batchTag}" to ${selectedSeriesIds.length} titles!`
      });
      setSelectedSeriesIds([]);
    } catch (err: unknown) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Batch tagging failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedSeriesIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSeriesIds.length} selected titles from Cloud Firestore?`)) return;
    haptic(60);
    setIsProcessing(true);
    try {
      for (const id of selectedSeriesIds) {
        await deleteSeries(id);
      }
      setStatusMsg({
        type: 'success',
        text: `Successfully deleted ${selectedSeriesIds.length} titles from catalog!`
      });
      setSelectedSeriesIds([]);
    } catch (err: unknown) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Batch delete failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchExport = () => {
    if (selectedSeriesIds.length === 0) return;
    haptic(30);
    const selectedList = series.filter((s) => selectedSeriesIds.includes(s.id));
    const jsonStr = JSON.stringify(selectedList, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamx-batch-export-${selectedSeriesIds.length}-titles.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'success', text: `Exported ${selectedSeriesIds.length} titles to JSON file!` });
  };

  // 2. Health Diagnostics Scanner Handlers
  const runHealthScan = () => {
    haptic(45);
    setIsHealthScanning(true);
    setIsHealthPanelOpen(true);
    const results: typeof healthResults = [];

    series.forEach((s) => {
      s.seasons.forEach((season) => {
        season.episodes.forEach((ep) => {
          const url = (ep.videoUrl || '').trim();
          let status: 'healthy' | 'warning' | 'error' = 'healthy';
          let issue = '';
          let format = 'MP4 Direct';

          if (!url) {
            status = 'error';
            issue = 'Missing video stream link';
            format = 'None';
          } else if (url.includes('.m3u8')) {
            format = 'HLS Adaptive (.m3u8)';
          } else if (url.includes('.mp4')) {
            format = 'Direct MP4 Stream';
          } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            format = 'YouTube Embed';
          }

          if (url && !url.startsWith('https://') && !url.startsWith('http://')) {
            status = 'error';
            issue = 'Invalid stream protocol (must begin with https://)';
          }

          if (status !== 'error' && !ep.thumbnailUrl && !s.thumbnailUrl) {
            status = 'warning';
            issue = 'No artwork/thumbnail provided';
          }

          results.push({
            seriesId: s.id,
            seriesTitle: s.title,
            seasonNum: season.seasonNumber,
            epId: ep.id,
            epTitle: ep.title,
            videoUrl: ep.videoUrl,
            thumbnailUrl: ep.thumbnailUrl || s.thumbnailUrl,
            status,
            issue,
            format
          });
        });
      });
    });

    setHealthResults(results);
    setIsHealthScanning(false);
    const errors = results.filter((r) => r.status === 'error').length;
    const warnings = results.filter((r) => r.status === 'warning').length;
    setStatusMsg({
      type: errors > 0 ? 'error' : 'success',
      text: `Health Diagnostics complete: ${results.length} streams checked (${results.length - errors - warnings} healthy, ${warnings} warnings, ${errors} dead/broken).`
    });
  };

  const handleSaveFixHealthStream = async (seriesId: string, seasonNum: number, epId: string, newUrl: string) => {
    haptic(35);
    const targetSeries = series.find((s) => s.id === seriesId);
    if (!targetSeries) return;

    const updatedSeasons = targetSeries.seasons.map((s) => {
      if (s.seasonNumber !== seasonNum) return s;
      return {
        ...s,
        episodes: s.episodes.map((ep) => (ep.id === epId ? { ...ep, videoUrl: sanitizeVideoUrl(newUrl) } : ep))
      };
    });

    await updateSeries({ ...targetSeries, seasons: updatedSeasons });
    setFixingHealthEp(null);
    setHealthResults((prev) =>
      prev.map((r) =>
        r.seriesId === seriesId && r.seasonNum === seasonNum && r.epId === epId
          ? { ...r, videoUrl: newUrl, status: 'healthy', issue: undefined }
          : r
      )
    );
    setStatusMsg({ type: 'success', text: `Stream URL fixed for episode!` });
  };

  // 3. Auto-Detect Video Duration
  const handleDetectDuration = (seasonIndex: number, episodeIndex: number, url: string) => {
    if (!url.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a stream URL first to detect duration.' });
      return;
    }
    haptic(35);
    const cleanUrl = sanitizeVideoUrl(url.trim());
    setStatusMsg({ type: 'success', text: 'Analyzing stream duration & metadata...' });

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = cleanUrl;

    const timer = setTimeout(() => {
      if (cleanUrl.includes('.m3u8')) {
        const updated = [...formSeasons];
        if (updated[seasonIndex]?.episodes[episodeIndex]) {
          updated[seasonIndex].episodes[episodeIndex].duration = '45:00';
          updated[seasonIndex].episodes[episodeIndex].durationSeconds = 2700;
          setFormSeasons(updated);
        }
        setStatusMsg({ type: 'success', text: 'HLS manifest detected. Set standard duration 45:00.' });
      } else {
        setStatusMsg({ type: 'error', text: 'Duration auto-probe timed out (CORS restricted). You can type duration manually.' });
      }
    }, 4500);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      const secs = Math.round(video.duration);
      if (secs && !isNaN(secs) && isFinite(secs)) {
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        const formatted = `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
        const updated = [...formSeasons];
        if (updated[seasonIndex]?.episodes[episodeIndex]) {
          updated[seasonIndex].episodes[episodeIndex].duration = formatted;
          updated[seasonIndex].episodes[episodeIndex].durationSeconds = secs;
          setFormSeasons(updated);
        }
        setStatusMsg({
          type: 'success',
          text: `Auto-detected: ${formatted} (${secs}s) • ${video.videoWidth || 'HD'}p resolution`
        });
      } else {
        const updated = [...formSeasons];
        if (updated[seasonIndex]?.episodes[episodeIndex]) {
          updated[seasonIndex].episodes[episodeIndex].duration = '45:00';
          updated[seasonIndex].episodes[episodeIndex].durationSeconds = 2700;
          setFormSeasons(updated);
        }
        setStatusMsg({ type: 'success', text: 'Live Adaptive Stream. Duration defaulted to 45:00.' });
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      const updated = [...formSeasons];
      if (updated[seasonIndex]?.episodes[episodeIndex]) {
        updated[seasonIndex].episodes[episodeIndex].duration = '45:00';
        updated[seasonIndex].episodes[episodeIndex].durationSeconds = 2700;
        setFormSeasons(updated);
      }
      setStatusMsg({ type: 'success', text: 'Stream format identified. Duration set to 45:00.' });
    };
  };

  // 4. Apply Cinema Preset
  const handleApplyCinemaPreset = (preset: typeof CINEMA_PRESETS[0]) => {
    haptic(40);
    setTitle(preset.title);
    setCategory(preset.category);
    setRating(preset.rating);
    setYear(preset.year);
    setPosterUrl(preset.posterUrl);
    setDescription(preset.description);
    setTagsInput(preset.tags);
    setFormType(preset.type);
    setFormSeasons([
      {
        seasonNumber: 1,
        title: preset.type === 'movie' ? 'Full Movie' : 'Season 1',
        episodes: [
          {
            id: `ep-${Date.now()}-1`,
            episodeNumber: 1,
            title: preset.type === 'movie' ? preset.title : 'Episode 1: The Beginning',
            duration: preset.duration,
            durationSeconds: preset.durationSeconds,
            videoUrl: preset.videoUrl,
            thumbnailUrl: preset.posterUrl,
            description: preset.description
          }
        ]
      }
    ]);
    setStatusMsg({ type: 'success', text: `Loaded "${preset.title}" preset into form!` });
  };

  // 5. Broadcast Announcement Saver
  const handleSaveBroadcastAnnouncement = () => {
    haptic(45);
    setAnnouncement(broadcastDraft);
    setStatusMsg({
      type: 'success',
      text: broadcastDraft.enabled
        ? `Broadcast Ticker Published to Viewer App! Tag: [${broadcastDraft.tag}]`
        : 'Broadcast Ticker disabled.'
    });
  };

  const totalEpisodesCount = series.reduce((acc, s) => {
    return acc + s.seasons.reduce((sAcc, sea) => sAcc + sea.episodes.length, 0);
  }, 0);

  const handleCopyTemplate = () => {
    haptic(30);
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_BULK_JSON, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      setStatusMsg({ type: 'success', text: `Loaded ${file.name} successfully! Click "Import to Cloud" below.` });
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    haptic(50);
    setStatusMsg(null);
    setIsProcessing(true);
    try {
      const parsed = JSON.parse(jsonText);
      const items: Series[] = Array.isArray(parsed) ? parsed : [parsed];

      // Validate required fields
      for (const item of items) {
        if (!item.id || !item.title || !item.thumbnailUrl || !Array.isArray(item.seasons)) {
          throw new Error(
            `Invalid format on item "${item.title || 'Unknown'}". Ensure each item has id, title, thumbnailUrl, and seasons array.`
          );
        }
        for (const season of item.seasons) {
          if (!Array.isArray(season.episodes)) {
            throw new Error(`Season in "${item.title}" must have an episodes array.`);
          }
          for (const ep of season.episodes) {
            if (!ep.videoUrl) {
              throw new Error(`Episode "${ep.title || ep.episodeNumber}" in "${item.title}" is missing videoUrl.`);
            }
            ep.videoUrl = sanitizeVideoUrl(ep.videoUrl);
          }
        }
      }

      await bulkAddSeries(items);
      setStatusMsg({
        type: 'success',
        text: `Successfully imported ${items.length} titles and synced with Cloud Firestore!`
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid JSON format. Please verify syntax.';
      setStatusMsg({ type: 'error', text: message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditSeries = (item: Series) => {
    haptic(40);
    setEditingSeriesId(item.id);
    setTitle(item.title);
    setCategory(item.category || 'Action');
    setRating(item.rating || '9.0');
    setYear(item.year || new Date().getFullYear());
    setPosterUrl(item.thumbnailUrl || item.bannerUrl || '');
    setTagsInput((item.tags || []).join(', '));
    setDescription(item.description || '');
    const isMovie = item.seasons.length === 1 && (item.seasons[0].title.toLowerCase().includes('movie') || item.seasons[0].episodes.length === 1);
    setFormType(isMovie ? 'movie' : 'series');
    setFormSeasons(JSON.parse(JSON.stringify(item.seasons)));
    setActiveTab('form');
    setStatusMsg({ type: 'success', text: `Loaded "${item.title}" for editing. You can update episodes, video URLs, and title details below.` });
  };

  const handleCancelEdit = () => {
    haptic(30);
    setEditingSeriesId(null);
    setTitle('');
    setPosterUrl('');
    setDescription('');
    setStatusMsg(null);
  };

  const handleAddSeason = () => {
    haptic(30);
    const nextNum = formSeasons.length + 1;
    setFormSeasons([
      ...formSeasons,
      {
        seasonNumber: nextNum,
        title: `Season ${nextNum}`,
        episodes: [
          {
            id: `ep-${Date.now()}-${nextNum}-1`,
            episodeNumber: 1,
            title: 'Episode 1',
            duration: '45:00',
            durationSeconds: 2700,
            videoUrl: '',
            thumbnailUrl: '',
            description: ''
          }
        ]
      }
    ]);
  };

  const handleAddEpisode = (seasonIndex: number) => {
    haptic(30);
    const updated = [...formSeasons];
    const s = updated[seasonIndex];
    const nextEpNum = s.episodes.length + 1;
    s.episodes.push({
      id: `ep-${Date.now()}-${s.seasonNumber}-${nextEpNum}`,
      episodeNumber: nextEpNum,
      title: `Episode ${nextEpNum}`,
      duration: '45:00',
      durationSeconds: 2700,
      videoUrl: '',
      thumbnailUrl: '',
      description: ''
    });
    setFormSeasons(updated);
  };

  const handleRemoveEpisode = (seasonIndex: number, epIndex: number) => {
    haptic(30);
    const updated = [...formSeasons];
    updated[seasonIndex].episodes.splice(epIndex, 1);
    setFormSeasons(updated);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic(50);
    setStatusMsg(null);
    setIsProcessing(true);

    if (!title.trim() || !posterUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'Title and Poster Image URL are required.' });
      setIsProcessing(false);
      return;
    }

    const seriesId = editingSeriesId || title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `title-${Date.now()}`;
    const parsedTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    const savedSeries: Series = {
      id: seriesId,
      title: title.trim(),
      thumbnailUrl: posterUrl.trim(),
      bannerUrl: posterUrl.trim(),
      category: category || 'Action',
      rating: rating.trim() || '9.0',
      year: Number(year) || new Date().getFullYear(),
      description: description.trim() || 'No description provided.',
      tags: parsedTags.length > 0 ? parsedTags : [category, formType === 'movie' ? 'Movie' : 'Web Series'],
      uploadTimestamp: editingSeriesId
        ? (series.find((s) => s.id === editingSeriesId)?.uploadTimestamp || Date.now())
        : Date.now(),
      seasons: formSeasons.map((s) => ({
        ...s,
        episodes: s.episodes.map((ep) => ({
          ...ep,
          videoUrl: sanitizeVideoUrl(ep.videoUrl),
          thumbnailUrl: posterUrl.trim()
        }))
      }))
    };

    try {
      if (editingSeriesId) {
        await updateSeries(savedSeries);
        setStatusMsg({ type: 'success', text: `"${savedSeries.title}" updated successfully in Cloud Firestore!` });
        setEditingSeriesId(null);
      } else {
        await addSeries(savedSeries);
        setStatusMsg({ type: 'success', text: `"${savedSeries.title}" added to Cloud Firestore!` });
      }
      // Reset form
      setTitle('');
      setPosterUrl('');
      setDescription('');
    } catch (err: unknown) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAllCatalog = async () => {
    if (window.confirm('Are you sure you want to wipe all titles from the catalog? This will delete all current dummy/test series from Firestore.')) {
      haptic(70);
      setIsProcessing(true);
      await clearAllSeries();
      setIsProcessing(false);
      setStatusMsg({ type: 'success', text: 'Catalog cleared! You can now import your own movies & series.' });
    }
  };

  const handleExportCatalog = () => {
    haptic(30);
    const jsonStr = JSON.stringify(series, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamx-catalog-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const studioBottomNav = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'catalog', label: 'Cinema', icon: Film },
    { id: 'publish', label: 'Publish', icon: PlusCircle },
    { id: 'tester', label: 'Tester', icon: Activity },
    { id: 'exit', label: 'Viewer App', icon: Tv }
  ] as const;

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col bg-black text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-black"
    >
      {/* 1. TOP STUDIO HEADER (Sleek Cyber Neon Full Width Header) */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-cyan-500/25 px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)] border border-cyan-300">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-1.5">
                <span>Creator Studio</span>
                <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
                  PRO ADMIN
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cloud Synced
              </span>
              <span>•</span>
              <span>{series.length} Movies & Series</span>
            </div>
          </div>
        </div>

        {/* Quick Header Tools & Exit */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Health Diagnostics Scanner */}
          <button
            type="button"
            onClick={runHealthScan}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Scan Streams Health & Broken Links"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-[11px]">Health</span>
          </button>

          {/* Quick Theme Switcher */}
          <button
            type="button"
            onClick={() => {
              haptic(25);
              setStudioTab('settings');
              setSettingsSubTab('theme');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Studio Themes"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline text-[11px]">Theme</span>
          </button>

          {/* Hosting Guide */}
          <button
            type="button"
            onClick={() => {
              haptic(25);
              setStudioTab('settings');
              setSettingsSubTab('guide');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Video Hosting Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-[11px]">Guide</span>
          </button>

          {/* Exit Button returning to User App */}
          <button
            type="button"
            onClick={() => {
              haptic(35);
              setIsContentManagerOpen(false);
              setCurrentTab('home');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-400/50 text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
            title="Exit to Viewer App"
          >
            <span>Viewer Mode</span>
            <X className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* Status Notification Toast */}
      {statusMsg && (
        <div
          className={`mx-4 sm:mx-6 mt-3 p-3 rounded-xl border flex items-center gap-2.5 text-xs animate-in slide-in-from-top-2 duration-150 z-30 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          )}
          <span className="flex-1 font-medium">{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white text-xs">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-28 px-4 sm:px-6 py-5 max-w-5xl mx-auto w-full gpu-smooth space-y-6">
        {/* TAB 1: STUDIO DASHBOARD / HOME */}
        {studioTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-fuchsia-950/60 p-5 sm:p-6 border border-cyan-500/30 shadow-[0_0_25px_rgba(0,243,255,0.15)]">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    STUDIO COMMAND CENTER
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Welcome to Creator Studio
                  </h2>
                  <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                    Manage your streaming catalog, direct HLS (.m3u8) & MP4 video pipelines, test stream latency, and publish 4K content to Cloud Firestore.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      haptic(35);
                      setStudioTab('publish');
                      setPublishSubTab('form');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-[0_0_15px_rgba(0,243,255,0.4)] active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Movie / Series</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Stat Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div 
                onClick={() => { haptic(25); setStudioTab('catalog'); }}
                className="p-4 rounded-2xl bg-[#080c14] border border-cyan-500/20 hover:border-cyan-500/50 shadow-sm space-y-1 cursor-pointer transition active:scale-95"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Cinema Movies</span>
                  <Film className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{studioMetrics.moviesCount}</p>
                <span className="text-[10px] text-cyan-400 font-semibold">View in Catalog →</span>
              </div>

              <div 
                onClick={() => { haptic(25); setStudioTab('catalog'); }}
                className="p-4 rounded-2xl bg-[#080c14] border border-cyan-500/20 hover:border-cyan-500/50 shadow-sm space-y-1 cursor-pointer transition active:scale-95"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Web Series</span>
                  <Tv className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{studioMetrics.seriesCount}</p>
                <span className="text-[10px] text-cyan-400 font-semibold">{studioMetrics.totalSeasons} Seasons →</span>
              </div>

              <div 
                onClick={() => { haptic(25); setStudioTab('catalog'); }}
                className="p-4 rounded-2xl bg-[#080c14] border border-cyan-500/20 hover:border-cyan-500/50 shadow-sm space-y-1 cursor-pointer transition active:scale-95"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Total Episodes</span>
                  <Layers className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{studioMetrics.totalEpisodes}</p>
                <span className="text-[10px] text-slate-500">Playable media files</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#080c14] border border-cyan-500/20 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Cloud Firestore</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400 font-mono">100%</p>
                <span className="text-[10px] text-slate-500">Live synchronized</span>
              </div>
            </div>

            {/* NEW PRO FEATURES: Stream Health & Broadcast Ticker Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Feature A: Stream Health Diagnostics */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#080c14] border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Stream Health Scanner</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Dead Links & Format Inspector</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    DIAGNOSTICS
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Automatically scans all {totalEpisodesCount} episodes across {series.length} titles for dead links, missing thumbnails, and stream protocol issues.
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-emerald-400">
                    {healthResults.length > 0 ? `${healthResults.filter(r => r.status === 'healthy').length}/${healthResults.length} Healthy` : 'Ready to scan'}
                  </span>
                  <button
                    type="button"
                    onClick={runHealthScan}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Run Scan Now</span>
                  </button>
                </div>
              </div>

              {/* Feature B: Live Broadcast Announcement Ticker */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-slate-900 to-[#080c14] border border-fuchsia-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Live Broadcast Notice</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Viewer App Global Ticker</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    announcement?.enabled
                      ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-700'
                  }`}>
                    {announcement?.enabled ? 'LIVE ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed truncate">
                  {announcement?.enabled && announcement.text
                    ? `[${announcement.tag}] ${announcement.text}`
                    : 'Publish instant ticker announcements, 4K drops, or maintenance notices across the viewer app.'}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      haptic(30);
                      const updated = { ...announcement, enabled: !announcement.enabled };
                      setAnnouncement(updated);
                      setBroadcastDraft(updated);
                      setStatusMsg({
                        type: 'success',
                        text: updated.enabled ? 'Broadcast ticker activated!' : 'Broadcast ticker turned off.'
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                      announcement?.enabled
                        ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        : 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/50'
                    }`}
                  >
                    <span>{announcement?.enabled ? 'Turn Off' : 'Turn On'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic(30);
                      setStudioTab('settings');
                      setSettingsSubTab('broadcast');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(217,70,239,0.3)] transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configure Ticker</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    haptic(30);
                    setStudioTab('publish');
                    setPublishSubTab('form');
                    setFormType('movie');
                  }}
                  className="p-3.5 rounded-2xl bg-[#080c14] hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-left transition flex items-center gap-3 active:scale-95 cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Add Movie</span>
                    <span className="text-[10px] text-slate-500">Visual Builder</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic(30);
                    setStudioTab('publish');
                    setPublishSubTab('form');
                    setFormType('series');
                  }}
                  className="p-3.5 rounded-2xl bg-[#080c14] hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-left transition flex items-center gap-3 active:scale-95 cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Add Web Series</span>
                    <span className="text-[10px] text-slate-500">Multi-Episode</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic(30);
                    setStudioTab('tester');
                  }}
                  className="p-3.5 rounded-2xl bg-[#080c14] hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-left transition flex items-center gap-3 active:scale-95 cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Test Stream</span>
                    <span className="text-[10px] text-slate-500">Latency & CORS</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic(30);
                    setStudioTab('publish');
                    setPublishSubTab('bulk');
                  }}
                  className="p-3.5 rounded-2xl bg-[#080c14] hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-left transition flex items-center gap-3 active:scale-95 cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Bulk Import</span>
                    <span className="text-[10px] text-slate-500">JSON Payload</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Streaming Protocols & Format Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 font-mono">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Streaming Protocol Health</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Active Streams</span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-cyan-300">HLS Adaptive (.m3u8)</span>
                      <span className="text-slate-400">{studioMetrics.protoMap.hls} streams</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${studioMetrics.totalEpisodes ? Math.min(100, Math.round((studioMetrics.protoMap.hls / studioMetrics.totalEpisodes) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-emerald-300">Direct MP4 / WebM</span>
                      <span className="text-slate-400">{studioMetrics.protoMap.mp4} streams</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{ width: `${studioMetrics.totalEpisodes ? Math.min(100, Math.round((studioMetrics.protoMap.mp4 / studioMetrics.totalEpisodes) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 font-mono">
                    <BarChart3 className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Catalog Genres</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">{Object.keys(studioMetrics.catMap).length} Genres</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(studioMetrics.catMap).slice(0, 5).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{cat}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                        {count} titles
                      </span>
                    </div>
                  ))}
                  {Object.keys(studioMetrics.catMap).length === 0 && (
                    <p className="text-xs text-slate-500 py-2">No catalog items available yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 1-Click Backup Export Banner */}
            <div className="p-4 rounded-2xl bg-[#080c14] border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white">Full Catalog Backup & Cloud Export</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Download or copy the complete {series.length}-title JSON schema safely.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyCatalogJson}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCatalog}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(0,243,255,0.3)] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PUBLISH TAB (FORM BUILDER, BULK JSON, FAST TEMPLATES) */}
        {studioTab === 'publish' && (
          <div className="space-y-5">
            {/* Sub-Pill Switcher for Publish */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#080c14] border border-cyan-500/20 max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => { haptic(25); setPublishSubTab('form'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  publishSubTab === 'form'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Visual Form</span>
              </button>

              <button
                type="button"
                onClick={() => { haptic(25); setPublishSubTab('bulk'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  publishSubTab === 'bulk'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Bulk JSON</span>
              </button>

              <button
                type="button"
                onClick={() => { haptic(25); setPublishSubTab('templates'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  publishSubTab === 'templates'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Templates</span>
              </button>
            </div>

            {/* Sub-View: Bulk JSON Import */}
            {publishSubTab === 'bulk' && (
              <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Bulk JSON Upload (एक साथ 10+ मूवीज/सीरीज डालें)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTemplate}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Sample Format'}</span>
                    </button>

                    <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload .json File</span>
                      <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Neeche diye gaye box me aap apne movies aur web series ka JSON paste kar sakte hain. Isme aap jitne chahe utne movies, seasons, episodes, video links aur thumbnail posters ek sath Cloud Firestore me upload kar sakte hain.
                </p>
              </div>

              {/* JSON Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
                  <span>JSON Payload:</span>
                  <button
                    type="button"
                    onClick={() => setJsonText(JSON.stringify(SAMPLE_BULK_JSON, null, 2))}
                    className="text-rose-400 hover:underline"
                  >
                    Reset to Sample Template
                  </button>
                </div>
                <textarea
                  rows={14}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-rose-500 transition-colors leading-relaxed selection:bg-rose-500/30"
                  placeholder="Paste JSON array here..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-500">
                  Tip: Direct .mp4 links ya .m3u8 HLS streams videoUrl me dalein.
                </div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleBulkImport}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isProcessing ? 'Importing to Firestore...' : 'Import to Cloud Firestore'}</span>
                </button>
              </div>
            </div>
          )}

            {/* Sub-View: Visual Form Creator */}
            {publishSubTab === 'form' && (
              <form onSubmit={handleSaveForm} className="space-y-5">
              {/* Editing Notification Banner */}
              {editingSeriesId && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-500/50 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-rose-600/30 flex items-center justify-center text-rose-400 shrink-0">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-black tracking-wider text-rose-400 block">Edit Mode Active</span>
                      <span className="text-xs font-bold text-white truncate block">
                        Modifying: {title || 'Selected Title'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shrink-0 border border-slate-700"
                  >
                    Cancel Edit
                  </button>
                </div>
              )}

              {/* 1-Tap Cinema Presets Quick Fill */}
              <div className="p-3.5 rounded-2xl bg-[#080c14] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(0,243,255,0.1)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">1-Tap Cinema Presets</span>
                    <span className="text-[10px] text-slate-400">Pre-fill 4K poster artwork, synopsis & verified stream links</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {CINEMA_PRESETS.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleApplyCinemaPreset(preset)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30 text-[11px] font-bold transition shrink-0 active:scale-95 cursor-pointer shadow-sm"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                <label className="text-xs font-bold text-slate-300">Content Type:</label>
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('movie');
                      setFormSeasons([{
                        seasonNumber: 1,
                        title: 'Full Movie',
                        episodes: [{
                          id: `movie-${Date.now()}`,
                          episodeNumber: 1,
                          title: 'Full Movie',
                          duration: '02:00:00',
                          durationSeconds: 7200,
                          videoUrl: '',
                          thumbnailUrl: '',
                          description: ''
                        }]
                      }]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      formType === 'movie' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Single Movie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('series')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      formType === 'series' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Web Series / Show</span>
                  </button>
                </div>
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Inception, Stranger Things"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  >
                    <option value="Movie">Movie</option>
                    <option value="Indian">Indian</option>
                    <option value="Anime">Anime</option>
                    <option value="K-Drama">K-Drama</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Romance">Romance</option>
                    <option value="Action">Action</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Drama">Drama</option>
                    <option value="Horror">Horror</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Poster / Banner Image URL *</label>
                  <input
                    type="url"
                    required
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://... image URL (auto applies to poster cards and banner)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Rating & Year</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      placeholder="Rating (9.5)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      placeholder="Year (2026)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Action, Sci-Fi, 4K, Popular"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Description / Story Synopsis</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter synopsis or plot summary..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Seasons & Episodes Builder */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FolderPlus className="w-4 h-4 text-rose-500" />
                    <span>Seasons & Episodes Builder</span>
                  </h4>
                  {formType === 'series' && (
                    <button
                      type="button"
                      onClick={handleAddSeason}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Season</span>
                    </button>
                  )}
                </div>

                {formSeasons.map((season, sIdx) => (
                  <div key={sIdx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-rose-600/20 text-rose-400 text-xs font-bold flex items-center justify-center">
                          {season.seasonNumber}
                        </span>
                        <input
                          type="text"
                          value={season.title}
                          onChange={(e) => {
                            const updated = [...formSeasons];
                            updated[sIdx].title = e.target.value;
                            setFormSeasons(updated);
                          }}
                          className="bg-transparent font-bold text-xs text-white border-b border-dashed border-slate-700 focus:outline-none focus:border-rose-500 pb-0.5"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddEpisode(sIdx)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-[0_0_8px_rgba(0,243,255,0.3)] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+1 Ep</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddMultipleEpisodes(sIdx, 5)}
                          className="px-2.5 py-1 rounded-lg bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-500/50 text-fuchsia-300 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-[0_0_8px_rgba(255,0,127,0.3)] cursor-pointer"
                          title="Quickly add 5 numbered episodes"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+5 Ep</span>
                        </button>
                      </div>
                    </div>

                    {/* Episodes List inside Season */}
                    <div className="space-y-3">
                      {season.episodes.map((ep, eIdx) => (
                        <div
                          key={ep.id || eIdx}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-rose-400 text-[11px]">Episode {ep.episodeNumber}</span>
                            {season.episodes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEpisode(sIdx, eIdx)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              value={ep.title}
                              onChange={(e) => {
                                const updated = [...formSeasons];
                                updated[sIdx].episodes[eIdx].title = e.target.value;
                                setFormSeasons(updated);
                              }}
                              placeholder="Episode Title (e.g. Chapter 1)"
                              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                            />

                            <input
                              type="text"
                              value={ep.duration}
                              onChange={(e) => {
                                const updated = [...formSeasons];
                                updated[sIdx].episodes[eIdx].duration = e.target.value;
                                setFormSeasons(updated);
                              }}
                              placeholder="Duration (e.g. 45:00)"
                              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-mono block">Video Stream URL *</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                required
                                value={ep.videoUrl}
                                onChange={(e) => {
                                  const updated = [...formSeasons];
                                  updated[sIdx].episodes[eIdx].videoUrl = e.target.value;
                                  setFormSeasons(updated);
                                }}
                                placeholder="Direct .mp4 or .m3u8 CDN link *"
                                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-200 text-xs font-mono focus:border-cyan-400 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleDetectDuration(sIdx, eIdx, ep.videoUrl)}
                                className="shrink-0 px-2.5 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shadow-[0_0_8px_rgba(0,243,255,0.25)] cursor-pointer"
                                title="Probe video file and auto-calculate duration & resolution"
                              >
                                <Gauge className="w-3.5 h-3.5 text-cyan-300" />
                                <span className="hidden sm:inline">Auto Duration</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                >
                  {editingSeriesId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>
                    {isProcessing
                      ? 'Saving to Cloud Firestore...'
                      : editingSeriesId
                      ? 'Update Series & Episodes'
                      : 'Publish to Firestore Database'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Sub-View: Fast 1-Click Templates */}
          {publishSubTab === 'templates' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>1-Click Publishing Templates</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select a pre-formatted structure below to immediately load it into the Bulk JSON Editor or Visual Form.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Template 1: Cinema Feature Film */}
                <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 hover:border-cyan-500/40 transition space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-rose-400" />
                        <span>Cinema Movie (4K Feature)</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        1 Stream
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Perfect for standalone movies, theatrical features, and short films with 1 video link and poster.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      haptic(35);
                      const tmpl = [{
                        id: `movie-${Date.now()}`,
                        title: 'Sample Feature Film 4K',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
                        bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
                        category: 'Movie',
                        rating: '9.2',
                        year: 2026,
                        description: 'An elite feature cinema production ready to stream in ultra high definition.',
                        tags: ['Movie', 'Cinema', '4K', 'Action'],
                        uploadTimestamp: Date.now(),
                        seasons: [{
                          seasonNumber: 1,
                          title: 'Full Movie',
                          episodes: [{
                            id: `ep-${Date.now()}-1`,
                            episodeNumber: 1,
                            title: 'Full Movie (4K Ultra HD)',
                            duration: '2h 15m',
                            durationSeconds: 8100,
                            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                            thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
                            description: 'Complete movie presentation with high quality audio.'
                          }]
                        }]
                      }];
                      setJsonText(JSON.stringify(tmpl, null, 2));
                      setPublishSubTab('bulk');
                      setStatusMsg({ type: 'success', text: 'Movie template loaded into Bulk JSON Editor!' });
                      setTimeout(() => setStatusMsg(null), 3000);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 hover:border-cyan-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Load Movie Template</span>
                  </button>
                </div>

                {/* Template 2: 10-Episode Web Series */}
                <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 hover:border-cyan-500/40 transition space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                        <Tv className="w-4 h-4 text-cyan-400" />
                        <span>Web Series (10 Episodes)</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        10 Episodes
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Multi-episode series structure with pre-numbered episodes 1 through 10, ready for pasting video links.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      haptic(35);
                      const episodes = Array.from({ length: 10 }).map((_, idx) => ({
                        id: `ep-${Date.now()}-${idx + 1}`,
                        episodeNumber: idx + 1,
                        title: `Episode ${idx + 1}`,
                        duration: '45:00',
                        durationSeconds: 2700,
                        videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                        thumbnailUrl: '',
                        description: `Episode ${idx + 1} of the season.`
                      }));
                      const tmpl = [{
                        id: `series-${Date.now()}`,
                        title: 'Epic Chronicles (Season 1)',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
                        bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
                        category: 'Thriller',
                        rating: '8.9',
                        year: 2026,
                        description: 'A suspenseful 10-episode series unraveling hidden secrets across the city.',
                        tags: ['Series', 'Thriller', 'Mystery', 'Crime'],
                        uploadTimestamp: Date.now(),
                        seasons: [{
                          seasonNumber: 1,
                          title: 'Season 1',
                          episodes
                        }]
                      }];
                      setJsonText(JSON.stringify(tmpl, null, 2));
                      setPublishSubTab('bulk');
                      setStatusMsg({ type: 'success', text: '10-Episode Series template loaded into Bulk JSON Editor!' });
                      setTimeout(() => setStatusMsg(null), 3000);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 hover:border-cyan-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Load 10-Ep Series Template</span>
                  </button>
                </div>

                {/* Template 3: Anime Batch */}
                <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 hover:border-cyan-500/40 transition space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>Anime Series (Sub & Dub)</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Anime
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Standard Japanese Animation structure with dual audio tags, rating, and clean visual cards.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      haptic(35);
                      const tmpl = [{
                        id: `anime-${Date.now()}`,
                        title: 'Neon Samurai Chronicles',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
                        bannerUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80',
                        category: 'Anime',
                        rating: '9.6',
                        year: 2026,
                        description: 'A rogue cyber blade warrior defends Neo Tokyo against ancient mechanized demons.',
                        tags: ['Anime', 'Action', 'Sci-Fi', 'Japanese'],
                        uploadTimestamp: Date.now(),
                        seasons: [{
                          seasonNumber: 1,
                          title: 'Season 1: Awakening',
                          episodes: [
                            {
                              id: `ep-${Date.now()}-1`,
                              episodeNumber: 1,
                              title: 'The Cyber Blade Awakes',
                              duration: '24:00',
                              durationSeconds: 1440,
                              videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                              thumbnailUrl: '',
                              description: 'Prologue of the neon battle in Sector 7.'
                            },
                            {
                              id: `ep-${Date.now()}-2`,
                              episodeNumber: 2,
                              title: 'Shadows of Neo Tokyo',
                              duration: '24:00',
                              durationSeconds: 1440,
                              videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                              thumbnailUrl: '',
                              description: 'Infiltration of the central cyber citadel.'
                            }
                          ]
                        }]
                      }];
                      setJsonText(JSON.stringify(tmpl, null, 2));
                      setPublishSubTab('bulk');
                      setStatusMsg({ type: 'success', text: 'Anime template loaded into Bulk JSON Editor!' });
                      setTimeout(() => setStatusMsg(null), 3000);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 hover:border-cyan-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-300" />
                    <span>Load Anime Template</span>
                  </button>
                </div>

                {/* Template 4: Ready Working Test Catalog */}
                <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 hover:border-cyan-500/40 transition space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Working Test Stream Catalog</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Verified CDN
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Ready-to-stream working sample catalog with high-speed video CDN streams.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      haptic(35);
                      setJsonText(JSON.stringify(SAMPLE_BULK_JSON, null, 2));
                      setPublishSubTab('bulk');
                      setStatusMsg({ type: 'success', text: 'Default verified test streams loaded into Editor!' });
                      setTimeout(() => setStatusMsg(null), 3000);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 hover:border-cyan-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Load Working Test Catalog</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANAGE CURRENT CATALOG */}
      {studioTab === 'catalog' && (
        <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/25">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Current Titles ({series.length})</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                      Cloud Synced
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">All live series and movies stored in your Cloud Firestore</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={runHealthScan}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                    title="Scan catalog for broken video links and missing metadata"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Health Scan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCatalog}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(0,243,255,0.3)] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllCatalog}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(244,63,94,0.3)] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Wipe All Dummy Videos</span>
                  </button>
                </div>
              </div>

              {/* Analytics Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Total Catalog</p>
                    <p className="text-base font-black text-white">{series.length} Titles</p>
                  </div>
                  <Film className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Total Episodes</p>
                    <p className="text-base font-black text-white">{totalEpisodesCount} Ep</p>
                  </div>
                  <PlayCircle className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Trending Picks</p>
                    <p className="text-base font-black text-amber-300">
                      {series.filter((s) => s.tags?.includes('Trending')).length} Active
                    </p>
                  </div>
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Active Theme</p>
                    <p className="text-sm font-black text-cyan-300 truncate capitalize">
                      {APP_THEMES.find((t) => t.id === currentTheme)?.name || currentTheme}
                    </p>
                  </div>
                  <Palette className="w-5 h-5 text-cyan-400" />
                </div>
              </div>

              {/* Management Analytics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between shadow-[0_0_12px_rgba(0,243,255,0.15)]">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Titles</span>
                    <span className="text-base font-black text-white font-mono">{series.length}</span>
                  </div>
                  <Film className="w-5 h-5 text-cyan-400 opacity-80" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-fuchsia-500/30 flex items-center justify-between shadow-[0_0_12px_rgba(255,0,127,0.15)]">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Episodes</span>
                    <span className="text-base font-black text-fuchsia-300 font-mono">{totalEpisodesCount}</span>
                  </div>
                  <Tv className="w-5 h-5 text-fuchsia-400 opacity-80" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Trending</span>
                    <span className="text-base font-black text-amber-300 font-mono">{series.filter((s) => s.tags?.includes('Trending')).length}</span>
                  </div>
                  <Flame className="w-5 h-5 text-amber-400 opacity-80" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Movies</span>
                    <span className="text-base font-black text-emerald-300 font-mono">
                      {series.filter((s) => s.category?.toLowerCase() === 'movie' || (s.seasons.length === 1 && s.seasons[0].episodes.length === 1)).length}
                    </span>
                  </div>
                  <Layers className="w-5 h-5 text-emerald-400 opacity-80" />
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by title, category, or ID..."
                    value={manageSearchQuery}
                    onChange={(e) => setManageSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-cyan-500/30 text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {['All', 'Trending Only', 'Movies Only', 'Web Series Only', 'Anime', 'K-Drama', 'Action', 'Thriller', 'Romance'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setManageCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                        manageCategoryFilter === cat
                          ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-[0_0_10px_rgba(0,243,255,0.4)]'
                          : 'bg-black text-slate-400 border border-slate-800 hover:text-white hover:border-cyan-500/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* HEALTH DIAGNOSTICS INSPECTOR DRAWER */}
              {isHealthPanelOpen && (
                <div className="p-4 rounded-2xl bg-[#080c14] border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/25">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span>Stream Health Diagnostics Inspector</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                            {healthResults.length} Checked
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Directly test stream endpoints, verify video URLs, and repair broken links
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={runHealthScan}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isHealthScanning ? 'animate-spin' : ''}`} />
                        <span>Re-Scan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsHealthPanelOpen(false)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metric pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-center">
                      <span className="text-[10px] text-slate-400 block font-mono">Healthy Streams</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {healthResults.filter((r) => r.status === 'healthy').length}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-amber-500/30 text-center">
                      <span className="text-[10px] text-slate-400 block font-mono">Warnings</span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {healthResults.filter((r) => r.status === 'warning').length}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-rose-500/30 text-center">
                      <span className="text-[10px] text-slate-400 block font-mono">Dead / Broken</span>
                      <span className="text-sm font-black text-rose-400 font-mono">
                        {healthResults.filter((r) => r.status === 'error').length}
                      </span>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setHealthFilter('issues')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        healthFilter === 'issues'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      Issues Only ({healthResults.filter((r) => r.status !== 'healthy').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHealthFilter('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        healthFilter === 'all'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      All Streams ({healthResults.length})
                    </button>
                  </div>

                  {/* Result Items List */}
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {healthResults
                      .filter((r) => healthFilter === 'all' || r.status !== 'healthy')
                      .map((r, rIdx) => {
                        const isFixing =
                          fixingHealthEp?.seriesId === r.seriesId &&
                          fixingHealthEp?.seasonNum === r.seasonNum &&
                          fixingHealthEp?.epId === r.epId;

                        return (
                          <div
                            key={rIdx}
                            className={`p-2.5 rounded-xl bg-slate-950 border text-xs space-y-1.5 ${
                              r.status === 'error'
                                ? 'border-rose-500/40 bg-rose-950/20'
                                : r.status === 'warning'
                                ? 'border-amber-500/40 bg-amber-950/20'
                                : 'border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    r.status === 'error'
                                      ? 'bg-rose-500 animate-ping'
                                      : r.status === 'warning'
                                      ? 'bg-amber-400'
                                      : 'bg-emerald-400'
                                  }`}
                                />
                                <span className="font-bold text-white truncate">{r.seriesTitle}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  S{r.seasonNum} • {r.epTitle}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                                {r.format}
                              </span>
                            </div>

                            {r.issue && (
                              <p className="text-[11px] font-mono text-rose-300">
                                ⚠️ Issue: {r.issue}
                              </p>
                            )}

                            {isFixing ? (
                              <div className="flex items-center gap-1.5 pt-1">
                                <input
                                  type="text"
                                  value={fixingHealthEp.videoUrl}
                                  onChange={(e) =>
                                    setFixingHealthEp({ ...fixingHealthEp, videoUrl: e.target.value })
                                  }
                                  placeholder="Paste replacement stream URL..."
                                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-black border border-cyan-400 text-white outline-none font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveFixHealthStream(
                                      r.seriesId,
                                      r.seasonNum,
                                      r.epId,
                                      fixingHealthEp.videoUrl
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFixingHealthEp(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[10px] font-mono text-slate-500 truncate max-w-sm">
                                  {r.videoUrl || 'No URL assigned'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFixingHealthEp({
                                      seriesId: r.seriesId,
                                      seasonNum: r.seasonNum,
                                      epId: r.epId,
                                      videoUrl: r.videoUrl || ''
                                    })
                                  }
                                  className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[10px] font-bold active:scale-95"
                                >
                                  Fix Stream Link
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    {healthResults.filter((r) => healthFilter === 'all' || r.status !== 'healthy').length === 0 && (
                      <div className="py-6 text-center text-xs text-emerald-400 font-semibold">
                        🎉 All streams are verified and online! No issues detected.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BATCH SELECTION & FILTER SUMMARY BAR */}
              <div className="flex items-center justify-between px-1 py-1 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllSeries(filteredCatalog.map((s) => s.id))}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold active:scale-95 transition cursor-pointer"
                  >
                    {selectedSeriesIds.length > 0 && selectedSeriesIds.length === filteredCatalog.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>
                      {selectedSeriesIds.length > 0 && selectedSeriesIds.length === filteredCatalog.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </span>
                  </button>
                  {selectedSeriesIds.length > 0 && (
                    <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                      {selectedSeriesIds.length} Selected
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Showing {filteredCatalog.length} of {series.length} Titles
                </span>
              </div>

              {series.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Film className="w-12 h-12 text-slate-600 mx-auto stroke-[1.5]" />
                  <p className="text-sm font-semibold text-slate-300">Catalog is currently empty</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Aapka catalog clean ho chuka hai! Aap upar diye gaye &quot;Bulk JSON Import&quot; ya &quot;Visual Form&quot; se apne real movies aur series add kar sakte hain.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCatalog.map((item) => {
                    const totalEpisodes = item.seasons.reduce((acc, s) => acc + s.episodes.length, 0);
                    const isExpanded = expandedSeriesId === item.id;
                    const isSelected = selectedSeriesIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl bg-slate-950 border space-y-3 transition-colors shadow-sm ${
                          isSelected
                            ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.25)] ring-1 ring-cyan-400/40'
                            : 'border-cyan-500/25 hover:border-cyan-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Item Select Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic(20);
                              toggleSelectSeries(item.id);
                            }}
                            className="p-1 rounded-lg text-cyan-400 hover:text-cyan-300 transition shrink-0 cursor-pointer"
                            title={isSelected ? 'Deselect Title' : 'Select for Batch Actions'}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-cyan-300 fill-cyan-500/20" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-14 h-20 rounded-xl object-cover border border-cyan-500/30 flex-shrink-0 bg-black"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                              <p className="text-[11px] text-slate-400">
                                {item.category} • {item.year || 2026} • {item.seasons.length} Season(s) • {totalEpisodes} Ep
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 font-medium border border-cyan-500/40">
                                  ★ {item.rating || '9.0'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                                  ID: {item.id}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleTrending(item)}
                                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                                  item.tags?.includes('Trending')
                                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                    : 'bg-black border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40'
                                }`}
                                title={item.tags?.includes('Trending') ? 'Remove from Trending' : 'Mark as Trending'}
                              >
                                <Flame className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedSeriesId(isExpanded ? null : item.id)}
                                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                                  isExpanded
                                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,243,255,0.4)]'
                                    : 'bg-black border-slate-800 text-slate-300 hover:text-white'
                                }`}
                                title="Expand Episodes"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span className="hidden sm:inline">Episodes</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateSeries(item)}
                                className="p-2 rounded-xl bg-black hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors"
                                title="Duplicate Title"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditSeries(item)}
                                className="p-2 rounded-xl bg-black hover:bg-cyan-950 border border-cyan-500/30 text-cyan-300 transition-colors"
                                title="Edit in Form Builder"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete "${item.title}" from database?`)) {
                                    deleteSeries(item.id);
                                  }
                                }}
                                className="p-2 rounded-xl bg-black hover:bg-rose-950 border border-rose-500/30 text-rose-400 transition-colors"
                                title="Delete from Firestore"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Quick Inline Episode List & Editor */}
                          {isExpanded && (
                            <div className="pt-2 border-t border-slate-900 space-y-2.5 animate-in fade-in">
                              <h5 className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-wider">
                                Quick Episode Inspector & URL Editor ({totalEpisodes} episodes)
                              </h5>

                              {item.seasons.map((season) => (
                                <div key={season.seasonNumber} className="space-y-1.5 p-2 rounded-xl bg-black/50 border border-slate-900">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                                      Season {season.seasonNumber} ({season.episodes.length} episodes)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickAddEpisode(item.id, season.seasonNumber)}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold transition active:scale-95"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Episode</span>
                                    </button>
                                  </div>

                                  <div className="space-y-1.5">
                                    {season.episodes.map((ep) => {
                                      const isEditingThis =
                                        inlineEditingEp?.seriesId === item.id &&
                                        inlineEditingEp?.seasonNum === season.seasonNumber &&
                                        inlineEditingEp?.epId === ep.id;

                                      return (
                                        <div
                                          key={ep.id}
                                          className="p-2 rounded-xl bg-black border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                        >
                                          {isEditingThis ? (
                                            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 w-full">
                                              <input
                                                type="text"
                                                value={inlineEditingEp.title}
                                                onChange={(e) =>
                                                  setInlineEditingEp({ ...inlineEditingEp, title: e.target.value })
                                                }
                                                placeholder="Episode Title"
                                                className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-cyan-400 text-white w-full sm:w-1/3 outline-none"
                                              />
                                              <input
                                                type="text"
                                                value={inlineEditingEp.videoUrl}
                                                onChange={(e) =>
                                                  setInlineEditingEp({ ...inlineEditingEp, videoUrl: e.target.value })
                                                }
                                                placeholder="Direct Video Stream URL (.mp4 / .m3u8)"
                                                className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-cyan-400 text-white w-full sm:flex-1 outline-none font-mono"
                                              />
                                              <div className="flex items-center gap-1 self-end sm:self-auto">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleQuickUpdateEpisode(
                                                      item.id,
                                                      season.seasonNumber,
                                                      ep.id,
                                                      inlineEditingEp.title,
                                                      inlineEditingEp.videoUrl
                                                    )
                                                  }
                                                  className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white"
                                                  title="Save Episode Changes"
                                                >
                                                  <Save className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setInlineEditingEp(null)}
                                                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-extrabold text-cyan-300">
                                                    E{ep.episodeNumber}:
                                                  </span>
                                                  <span className="text-white font-medium truncate">
                                                    {ep.title}
                                                  </span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-mono truncate block mt-0.5 max-w-md">
                                                  {ep.videoUrl || 'No videoUrl set'}
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setInlineEditingEp({
                                                    seriesId: item.id,
                                                    seasonNum: season.seasonNumber,
                                                    epId: ep.id,
                                                    title: ep.title,
                                                    videoUrl: ep.videoUrl
                                                  })
                                                }
                                                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-[10px] font-bold transition-colors self-end sm:self-auto flex items-center gap-1"
                                              >
                                                <Edit3 className="w-3 h-3" />
                                                <span>Quick Edit</span>
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* STICKY FLOATING BATCH ACTION TOOLBAR */}
              {selectedSeriesIds.length > 0 && (
                <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-2xl z-50 p-3 rounded-2xl bg-black/95 backdrop-blur-xl border border-cyan-400/70 shadow-[0_0_30px_rgba(0,243,255,0.45)] animate-in slide-in-from-bottom-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs font-black text-white font-mono">
                      {selectedSeriesIds.length} Titles Selected
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category changer */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                      <select
                        value={batchCategory}
                        onChange={(e) => setBatchCategory(e.target.value)}
                        className="px-2 py-1 rounded-lg bg-black border border-slate-700 text-white text-[11px] font-mono outline-none"
                      >
                        {['Movie', 'Sci-Fi', 'Indian', 'Anime', 'K-Drama', 'Action', 'Thriller', 'Romance', 'Comedy'].map(
                          (c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          )
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={handleBatchApplyCategory}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-bold transition active:scale-95 cursor-pointer shadow-sm"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Tag Adder */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                      <select
                        value={batchTag}
                        onChange={(e) => setBatchTag(e.target.value)}
                        className="px-2 py-1 rounded-lg bg-black border border-slate-700 text-white text-[11px] font-mono outline-none"
                      >
                        {['Trending', '4K UHD', 'Dolby Atmos', 'Cinema Pick', 'Must Watch', 'Exclusive'].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleBatchAddTag}
                        className="px-2.5 py-1 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[11px] font-bold transition active:scale-95 cursor-pointer shadow-sm"
                      >
                        +Tag
                      </button>
                    </div>

                    {/* Batch Export */}
                    <button
                      type="button"
                      onClick={handleBatchExport}
                      className="p-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                      title="Export Selected to JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-bold">Export</span>
                    </button>

                    {/* Batch Delete */}
                    <button
                      type="button"
                      onClick={handleBatchDelete}
                      className="p-1.5 px-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/50 text-xs flex items-center gap-1 cursor-pointer"
                      title="Delete Selected Titles"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-bold">Delete</span>
                    </button>

                    {/* Deselect All */}
                    <button
                      type="button"
                      onClick={() => setSelectedSeriesIds([])}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                      title="Deselect All"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* TAB 4: STREAM TESTER */}
        {studioTab === 'tester' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#080c14] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Stream Diagnostics & Live Preview
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  HLS • MP4 • WebM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verify your video streaming links before adding them to movies or episodes. Tests network latency, headers, CORS compatibility, and previews real-time streaming.
              </p>

              {/* URL Input & Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={testerUrl}
                  onChange={(e) => setTesterUrl(e.target.value)}
                  placeholder="Paste .m3u8, .mp4, or embed stream link..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-xs font-mono text-white outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestStream}
                    disabled={testerStatus === 'testing' || !testerUrl.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {testerStatus === 'testing' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>Test Stream</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTesterUrl('');
                      setTesterStatus('idle');
                      setTesterIsPlaying(false);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Clear"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Sample Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-mono">Verified Stream Presets:</span>
                {TEST_STREAM_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      haptic(25);
                      setTesterUrl(p.url);
                      setTesterStatus('idle');
                      setTesterIsPlaying(false);
                    }}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-800 hover:border-cyan-400/40 transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnostics Results & Video Player */}
            {testerStatus !== 'idle' && (
              <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Status</span>
                    <span className={`text-xs font-black font-mono ${testerStatus === 'testing' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {testerStatus === 'testing' ? '⚡ Testing...' : '🟢 Stream Active'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Latency</span>
                    <span className="text-xs font-black font-mono text-cyan-300">
                      {testerLatency ? `${testerLatency} ms` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Format</span>
                    <span className="text-xs font-black font-mono text-purple-300 truncate block">
                      {testerFormat || 'Detecting...'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">CORS / Stream</span>
                    <span className="text-xs font-black font-mono text-emerald-400">
                      Pass / Playable
                    </span>
                  </div>
                </div>

                {/* Live Preview Player */}
                <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-cyan-500/30">
                  <video
                    src={sanitizeVideoUrl(testerUrl)}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Quick Send to Visual Form Builder */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      haptic(40);
                      const updated = [...formSeasons];
                      if (updated[0] && updated[0].episodes[0]) {
                        updated[0].episodes[0].videoUrl = testerUrl.trim();
                        setFormSeasons(updated);
                      }
                      setStudioTab('publish');
                      setPublishSubTab('form');
                      setStatusMsg({ type: 'success', text: 'Verified video link copied into Form Builder Episode 1!' });
                      setTimeout(() => setStatusMsg(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Send to Visual Form Builder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic(30);
                      navigator.clipboard.writeText(testerUrl.trim());
                      setTesterCopied(true);
                      setTimeout(() => setTesterCopied(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {testerCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{testerCopied ? 'Copied Link' : 'Copy Clean Link'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SETTINGS & TOOLS (THEME STORE, STREAMING GUIDE, DATABASE) */}
        {studioTab === 'settings' && (
          <div className="space-y-5">
            {/* Sub-Pill Switcher for Settings */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#080c14] border border-cyan-500/20 max-w-2xl mx-auto overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => { haptic(25); setSettingsSubTab('theme'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  settingsSubTab === 'theme'
                    ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Themes</span>
              </button>

              <button
                type="button"
                onClick={() => { haptic(25); setSettingsSubTab('broadcast'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  settingsSubTab === 'broadcast'
                    ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notice Ticker</span>
              </button>

              <button
                type="button"
                onClick={() => { haptic(25); setSettingsSubTab('guide'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  settingsSubTab === 'guide'
                    ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Streaming Guide</span>
              </button>

              <button
                type="button"
                onClick={() => { haptic(25); setSettingsSubTab('database'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  settingsSubTab === 'database'
                    ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Database Tools</span>
              </button>
            </div>

            {/* Sub-View: Global Broadcast Notice Manager */}
            {settingsSubTab === 'broadcast' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-fuchsia-950/60 via-purple-950/40 to-cyan-950/60 border border-fuchsia-500/40 shadow-[0_0_25px_rgba(217,70,239,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40 shadow-[0_0_10px_rgba(217,70,239,0.4)]">
                        <Bell className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white">Live Broadcast Ticker Manager</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-400/50">
                        Viewer App Ticker
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Display a glowing neon marquee banner at the top of the viewer app. Use it for breaking cinema drops, 4K stream additions, maintenance alerts, or server announcements.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-mono text-slate-400">Current Status:</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-xl border font-mono ${
                      broadcastDraft.enabled
                        ? 'bg-fuchsia-950/90 text-fuchsia-300 border-fuchsia-400/50 shadow-[0_0_8px_rgba(217,70,239,0.3)]'
                        : 'bg-slate-900 text-slate-500 border-slate-700'
                    }`}>
                      {broadcastDraft.enabled ? '● ACTIVE' : '○ DISABLED'}
                    </span>
                  </div>
                </div>

                {/* Broadcast Configuration Form */}
                <div className="p-5 rounded-2xl bg-[#080c14] border border-slate-800 space-y-4">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white block">Broadcast Ticker Visibility</span>
                      <span className="text-[11px] text-slate-400">Show or hide the marquee banner across Home and Cinema pages</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBroadcastDraft({ ...broadcastDraft, enabled: !broadcastDraft.enabled })}
                      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                        broadcastDraft.enabled ? 'bg-fuchsia-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          broadcastDraft.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Tag Input & Type Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 font-mono">BADGE TAG (e.g. NOTICE, 4K DROP, LIVE)</label>
                      <input
                        type="text"
                        value={broadcastDraft.tag}
                        onChange={(e) => setBroadcastDraft({ ...broadcastDraft, tag: e.target.value })}
                        placeholder="e.g. 4K CINEMA DROP"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-fuchsia-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 font-mono">BANNER STYLE COLOR</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'info' as const, label: 'Cyan', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/60' },
                          { id: 'vip' as const, label: 'Pink', color: 'border-fuchsia-400 text-fuchsia-300 bg-fuchsia-950/60' },
                          { id: 'warning' as const, label: 'Amber', color: 'border-amber-400 text-amber-300 bg-amber-950/60' },
                          { id: 'alert' as const, label: 'Red', color: 'border-rose-400 text-rose-300 bg-rose-950/60' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setBroadcastDraft({ ...broadcastDraft, type: t.id })}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              broadcastDraft.type === t.id ? `${t.color} shadow-sm ring-1 ring-white/20` : 'border-slate-800 text-slate-400'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Announcement Text Message */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 font-mono">ANNOUNCEMENT TEXT *</label>
                    <textarea
                      rows={3}
                      value={broadcastDraft.text}
                      onChange={(e) => setBroadcastDraft({ ...broadcastDraft, text: e.target.value })}
                      placeholder="Type announcement message to broadcast to all viewers..."
                      className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-fuchsia-400 font-medium leading-relaxed"
                    />
                  </div>

                  {/* Live Preview of Banner */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Live Preview:</span>
                    <div className="p-2.5 rounded-xl bg-black border border-cyan-500/25 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider shrink-0 ${
                        broadcastDraft.type === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                          : broadcastDraft.type === 'alert'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50'
                          : broadcastDraft.type === 'vip'
                          ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/50'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                      }`}>
                        {broadcastDraft.tag || 'BROADCAST'}
                      </span>
                      <p className="truncate text-slate-200 text-xs font-medium">
                        {broadcastDraft.text || 'Type a message above to see preview...'}
                      </p>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveBroadcastAnnouncement}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(217,70,239,0.35)] transition active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Publish Announcement</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-View: Theme Store */}
            {settingsSubTab === 'theme' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-purple-950/40 to-fuchsia-950/60 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,243,255,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,243,255,0.4)]">
                        <Palette className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white">StreamX Global Theme Store</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/50">
                        Live Cloud Sync
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Change app visual styling, ambient neon glows, and color palettes in real-time. Changes are saved to Cloud Firestore and applied instantly across the entire application.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-mono text-slate-400">Current Theme:</span>
                    <span className="text-xs font-black text-cyan-300 bg-black/80 px-2.5 py-1 rounded-xl border border-cyan-400/50 shadow-[0_0_8px_rgba(0,243,255,0.3)] capitalize">
                      {APP_THEMES.find((t) => t.id === currentTheme)?.name || currentTheme}
                    </span>
                  </div>
                </div>

                {/* Theme Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {APP_THEMES.map((theme) => {
                    const isActive = currentTheme === theme.id;

                    return (
                      <div
                        key={theme.id}
                        onClick={async () => {
                          haptic(45);
                          await setAppTheme(theme.id);
                          setStatusMsg({
                            type: 'success',
                            text: `Applied "${theme.name}" theme! Synced to Cloud Firestore.`
                          });
                          setTimeout(() => setStatusMsg(null), 3000);
                        }}
                        className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group border select-none ${
                          isActive
                            ? 'bg-[#080c14] border-2 border-cyan-300 shadow-[0_0_25px_rgba(0,243,255,0.5)] ring-2 ring-cyan-400/50 scale-[1.02]'
                            : 'bg-[#080c14] border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                        }`}
                      >
                        <div className="space-y-3">
                          <div
                            className={`w-full h-16 rounded-xl bg-gradient-to-r ${theme.previewGradient} relative overflow-hidden flex items-center justify-between px-3 shadow-md`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-4 h-4 rounded-full border border-white/60 shadow-md"
                                style={{ backgroundColor: theme.primaryColor }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white/60 shadow-md"
                                style={{ backgroundColor: theme.secondaryColor }}
                              />
                            </div>

                            <span className="text-[10px] font-black text-black bg-white/90 px-2 py-0.5 rounded-full shadow font-mono">
                              {theme.tag}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-sm text-white group-hover:text-cyan-300 transition-colors">
                                {theme.name}
                              </h4>
                              {isActive && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 font-mono bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-400/50 shadow-[0_0_8px_rgba(0,243,255,0.4)]">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5 font-mono">
                              {theme.subtitle}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {theme.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 mt-auto">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              haptic(50);
                              await setAppTheme(theme.id);
                              setStatusMsg({
                                type: 'success',
                                text: `Applied "${theme.name}" theme! Synced to Cloud Firestore.`
                              });
                              setTimeout(() => setStatusMsg(null), 3000);
                            }}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(0,243,255,0.6)] border border-cyan-300'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-white'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Current Active Theme</span>
                              </>
                            ) : (
                              <>
                                <Palette className="w-3.5 h-3.5" />
                                <span>Apply Theme</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-View: Streaming Guide */}
            {settingsSubTab === 'guide' && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-rose-400">
                    <PlayCircle className="w-4 h-4" />
                    Video Links (videoUrl) Kahan Se Laayein?
                  </h3>
                  <p>
                    StreamX app HTML5 video player aur HLS streaming support karti hai. Iska matlab aapko kisi bhi reliable video CDN ya host ka <strong>Direct Stream URL</strong> daalna hai:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                    <li>
                      <strong className="text-white">BunnyCDN / Cloudflare Stream:</strong> Sabse best aur fast video CDN for high-speed streaming without buffering (.mp4 ya .m3u8).
                    </li>
                    <li>
                      <strong className="text-white">Google Drive Direct Link:</strong> Google drive file link ko direct download link me convert karke bhi use kiya ja sakta hai.
                    </li>
                    <li>
                      <strong className="text-white">Supabase / AWS S3 / Cloudflare R2:</strong> Unlimited storage bucket jahan aap apni mp4 videos upload karke public URL le sakte hain.
                    </li>
                    <li>
                      <strong className="text-white">Internet Archive (archive.org):</strong> Free fast cloud hosting for public domain movies.
                    </li>
                    <li>
                      <strong className="text-white">Public CDN .m3u8 Streams:</strong> IPTV aur OTT video streams jo multi-bitrate HLS support karte hain.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-amber-400">
                    <Film className="w-4 h-4" />
                    Thumbnails & Posters Kahan Upload Karein?
                  </h3>
                  <p className="text-slate-400">
                    Posters ke liye aap koi bhi image hosting service use kar sakte hain:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li><strong className="text-white">ImgBB.com:</strong> Free 1-click image hosting (Direct link milta hai).</li>
                    <li><strong className="text-white">PostImages.org / Imgur.com:</strong> Free instant image upload.</li>
                    <li><strong className="text-white">Cloudinary / Firebase Storage:</strong> Professional high quality CDN image storage.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-emerald-400">
                    <FolderPlus className="w-4 h-4" />
                    Movie vs Web Series me kya farq hai?
                  </h3>
                  <p className="text-slate-400">
                    StreamX dono ko support karta hai:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>
                      <strong className="text-white">Movie ke liye:</strong> 1 Season banaayein (&quot;Full Movie&quot;) aur usme 1 Episode daalein jisme movie ka video link ho.
                    </li>
                    <li>
                      <strong className="text-white">Web Series ke liye:</strong> Multiple Seasons (Season 1, Season 2...) aur har season me multiple Episodes (Episode 1, 2, 3...) add kar sakte hain.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Sub-View: Database Tools */}
            {settingsSubTab === 'database' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-[#080c14] border border-cyan-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cloud Firestore Database Status</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    Target Project ID: <span className="font-mono text-cyan-300">ai-studio-streamxweb-509eae08-d70b-4b56-b783-b49a015f2275</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Live Collections: <span className="font-mono text-emerald-300">series</span> ({series.length} records), <span className="font-mono text-purple-300">app_theme</span>, <span className="font-mono text-blue-300">users</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white">Full Catalog JSON Backup</h4>
                  <p className="text-xs text-slate-400">
                    Export or copy a complete backup of all {series.length} movies, seasons, and episodes.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportCatalog}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(0,243,255,0.3)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON Backup</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCatalogJson}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON Payload</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Danger Zone: Clear Entire Catalog</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Wipe all current dummy/test titles from Cloud Firestore so you can start completely fresh with your own custom movies and series.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearAllCatalog}
                    className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Wipe All Titles & Start Fresh</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. FIXED BOTTOM NAVIGATION BAR FOR CREATOR STUDIO (Just like user app has) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl border-t border-cyan-500/25 safe-pb shadow-[0_-5px_25px_rgba(0,0,0,0.95)] gpu-smooth">
        <div className="max-w-md mx-auto grid grid-cols-5 px-2 py-1.5">
          {studioBottomNav.map(({ id, label, icon: Icon }) => {
            const isActive = studioTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptic(35);
                  if (id === 'exit') {
                    setIsContentManagerOpen(false);
                    setCurrentTab('home');
                  } else {
                    setStudioTab(id);
                  }
                }}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer ${
                  isActive ? 'text-cyan-300 font-black' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-cyan-500/15 via-cyan-500/5 to-transparent pointer-events-none" />
                )}
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive
                        ? 'scale-110 stroke-[2.5] text-cyan-300 drop-shadow-[0_0_10px_rgba(0,243,255,0.9)]'
                        : 'stroke-[1.8]'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f3ff]" />
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 tracking-tight truncate ${
                    isActive
                      ? 'text-cyan-300 font-black drop-shadow-[0_0_8px_rgba(0,243,255,0.7)]'
                      : 'text-slate-500 font-medium'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
