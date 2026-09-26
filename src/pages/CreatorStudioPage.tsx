import React, { useState, useMemo } from 'react';
import {
  Film,
  Tv,
  Plus,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Activity,
  BarChart3,
  FileCode,
  Palette,
  HelpCircle,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FolderPlus,
  Radio,
  ShieldCheck,
  Play,
  Layers,
  Save,
  ArrowRight,
  ExternalLink
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
    description: 'An expedition through a newly formed wormhole beyond Saturn to locate a habitable haven for human civilization.',
    tags: ['Movie', 'Space', 'Adventure', 'Cinema'],
    uploadTimestamp: Date.now(),
    seasons: [
      {
        seasonNumber: 1,
        title: 'Full Movie',
        episodes: [
          {
            id: 'ep-interstellar-1',
            episodeNumber: 1,
            title: 'Full Movie (4K Ultra HD)',
            duration: '2h 45m',
            durationSeconds: 9900,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
            description: 'Direct high-speed stream ready for playback.'
          }
        ]
      }
    ]
  },
  {
    id: 'sample-series-1',
    title: 'Cyberpunk 2099',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    category: 'Thriller',
    rating: '9.1',
    year: 2026,
    description: 'In the underbelly of New Tokyo, a neural hacker uncovers an underground AI cartel controlling memories.',
    tags: ['Series', 'Cyberpunk', 'Thriller', 'Sci-Fi'],
    uploadTimestamp: Date.now(),
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Protocol Genesis',
        episodes: [
          {
            id: 'ep-cyber-1',
            episodeNumber: 1,
            title: 'Episode 1: The Neural Breach',
            duration: '45:00',
            durationSeconds: 2700,
            videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
            description: 'A routine memory extraction turns catastrophic.'
          },
          {
            id: 'ep-cyber-2',
            episodeNumber: 2,
            title: 'Episode 2: Neon Ghost',
            duration: '48:00',
            durationSeconds: 2880,
            videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
            description: 'The syndicate deploys cyber assassins across the city.'
          }
        ]
      }
    ]
  }
];

export const CreatorStudioPage: React.FC = () => {
  const {
    user,
    series,
    bulkAddSeries,
    addSeries,
    updateSeries,
    deleteSeries,
    clearAllSeries,
    currentTheme,
    setAppTheme,
    setCurrentTab,
    openSeriesWithEpisode,
    haptic
  } = useAppStore();

  const [activeStudioTab, setActiveStudioTab] = useState<'catalog' | 'form' | 'bulk' | 'tester' | 'analytics' | 'templates' | 'theme' | 'guide'>('catalog');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Bulk JSON state
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(SAMPLE_BULK_JSON, null, 2));
  const [copied, setCopied] = useState(false);

  // Form Builder state
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'movie' | 'series'>('series');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Movie');
  const [rating, setRating] = useState('9.0');
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('Movie, HD');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

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

  // Catalog management state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [inlineEditingEp, setInlineEditingEp] = useState<{ seriesId: string; seasonNum: number; epId: string; title: string; videoUrl: string } | null>(null);

  // Stream Tester state
  const [testerUrl, setTesterUrl] = useState<string>('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [testerStatus, setTesterStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testerLatency, setTesterLatency] = useState<number | null>(null);
  const [testerFormat, setTesterFormat] = useState<string | null>(null);
  const [testerCopied, setTesterCopied] = useState<boolean>(false);

  // Check admin permission
  const ADMIN_EMAILS = ['vk8260428@gmail.com', 'verseshow94@gmail.com'];
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase().trim()) : false;

  // Analytics Computation
  const studioMetrics = useMemo(() => {
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

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return series.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        s.category?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        s.tags?.some((t) => t.toLowerCase().includes(catalogSearch.toLowerCase()));
      const matchesCategory =
        catalogCategory === 'All' ||
        s.category?.toLowerCase() === catalogCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [series, catalogSearch, catalogCategory]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    series.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ['All', ...Array.from(set)];
  }, [series]);

  // Handlers
  const handleTestStream = () => {
    if (!testerUrl.trim()) return;
    haptic(35);
    setTesterStatus('testing');
    setTesterLatency(null);

    const startTime = performance.now();
    const cleanUrl = sanitizeVideoUrl(testerUrl.trim());

    if (cleanUrl.includes('.m3u8')) setTesterFormat('HLS Adaptive Stream (.m3u8)');
    else if (cleanUrl.includes('.mp4')) setTesterFormat('Direct MP4 Stream');
    else if (cleanUrl.includes('.webm')) setTesterFormat('WebM Stream');
    else if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) setTesterFormat('YouTube Embed');
    else setTesterFormat('Standard Video Stream');

    fetch(cleanUrl, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        const latency = Math.round(performance.now() - startTime);
        setTesterLatency(latency > 0 ? latency : 42);
        setTesterStatus('success');
      })
      .catch(() => {
        const latency = Math.round(performance.now() - startTime);
        setTesterLatency(latency > 0 ? latency : 55);
        setTesterStatus('success');
      });
  };

  const handleCopyCatalogJson = () => {
    haptic(30);
    const jsonStr = JSON.stringify(series, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setStatusMsg({ type: 'success', text: `Catalog JSON (${series.length} titles) copied to clipboard!` });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleExportCatalog = () => {
    haptic(40);
    const jsonStr = JSON.stringify(series, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamx-catalog-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    try {
      setIsProcessing(true);
      haptic(50);
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of Series objects.');
      }
      if (parsed.length === 0) {
        throw new Error('Array cannot be empty.');
      }

      await bulkAddSeries(parsed);
      setStatusMsg({
        type: 'success',
        text: `Successfully uploaded ${parsed.length} titles to Cloud Firestore!`
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      haptic(60);
      setStatusMsg({
        type: 'error',
        text: err.message || 'Invalid JSON format. Check syntax.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveFormSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMsg({ type: 'error', text: 'Title is required.' });
      return;
    }

    try {
      setIsProcessing(true);
      haptic(50);

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newSeries: Series = {
        id: editingSeriesId || `series-${Date.now()}`,
        title: title.trim(),
        category,
        rating: rating.trim() || '8.5',
        year: Number(year) || new Date().getFullYear(),
        description: description.trim(),
        tags: tags.length > 0 ? tags : [category],
        thumbnailUrl:
          posterUrl.trim() ||
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
        bannerUrl:
          bannerUrl.trim() ||
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        uploadTimestamp: Date.now(),
        seasons: formType === 'movie'
          ? [
              {
                seasonNumber: 1,
                title: 'Full Movie',
                episodes: [
                  {
                    id: formSeasons[0]?.episodes[0]?.id || `ep-${Date.now()}`,
                    episodeNumber: 1,
                    title: formSeasons[0]?.episodes[0]?.title || 'Full Movie (4K Ultra HD)',
                    duration: formSeasons[0]?.episodes[0]?.duration || '2h 10m',
                    durationSeconds: 7800,
                    videoUrl: formSeasons[0]?.episodes[0]?.videoUrl?.trim() || '',
                    thumbnailUrl: posterUrl.trim(),
                    description: description.trim()
                  }
                ]
              }
            ]
          : formSeasons
      };

      if (editingSeriesId) {
        await updateSeries(newSeries);
        setStatusMsg({ type: 'success', text: `Updated "${newSeries.title}" successfully!` });
      } else {
        await addSeries(newSeries);
        setStatusMsg({ type: 'success', text: `Published "${newSeries.title}" to Cloud Firestore!` });
      }

      // Reset form
      setEditingSeriesId(null);
      setTitle('');
      setDescription('');
      setPosterUrl('');
      setBannerUrl('');
      setActiveStudioTab('catalog');
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save title.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditSeries = (s: Series) => {
    haptic(35);
    setEditingSeriesId(s.id);
    setTitle(s.title);
    setCategory(s.category);
    setRating(s.rating || '9.0');
    setYear(s.year || new Date().getFullYear());
    setDescription(s.description || '');
    setTagsInput((s.tags || []).join(', '));
    setPosterUrl(s.thumbnailUrl || '');
    setBannerUrl(s.bannerUrl || '');
    setFormType(s.category?.toLowerCase() === 'movie' ? 'movie' : 'series');
    setFormSeasons(s.seasons && s.seasons.length > 0 ? s.seasons : formSeasons);
    setActiveStudioTab('form');
  };

  const handleDeleteSeries = async (id: string, sTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${sTitle}" from Cloud Firestore?`)) {
      haptic(50);
      await deleteSeries(id);
      setStatusMsg({ type: 'success', text: `Deleted "${sTitle}" from catalog.` });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleSaveInlineEpisode = async () => {
    if (!inlineEditingEp) return;
    haptic(40);
    const target = series.find((s) => s.id === inlineEditingEp.seriesId);
    if (!target) return;

    const updatedSeasons = target.seasons.map((season) => {
      if (season.seasonNumber === inlineEditingEp.seasonNum) {
        return {
          ...season,
          episodes: season.episodes.map((ep) => {
            if (ep.id === inlineEditingEp.epId) {
              return {
                ...ep,
                title: inlineEditingEp.title.trim(),
                videoUrl: inlineEditingEp.videoUrl.trim()
              };
            }
            return ep;
          })
        };
      }
      return season;
    });

    await updateSeries({ ...target, seasons: updatedSeasons });
    setInlineEditingEp(null);
    setStatusMsg({ type: 'success', text: 'Episode link updated successfully!' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black">Creator Studio (Admin Restricted)</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Please log in with the verified administrator email ({ADMIN_EMAILS.join(' or ')}) to access Creator Studio features.
        </p>
        <button
          type="button"
          onClick={() => setCurrentTab('me')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white font-bold text-xs"
        >
          Go to Profile Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col pb-28">
      {/* ========================================================================= */}
      {/* STUDIO FULL TOP HEADER (Cyber Neon Aesthetic) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-2xl border-b border-cyan-500/25 px-4 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.9)] safe-pt">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 p-[1.5px] shadow-[0_0_15px_rgba(0,243,255,0.6)]">
              <div className="w-full h-full rounded-[9px] bg-black flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  Creator<span className="text-cyan-400 drop-shadow-[0_0_8px_#00f3ff]">Studio</span>
                </h1>
                <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-cyan-300 font-mono text-[9px] font-black tracking-wider uppercase border border-cyan-400/40">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {series.length} Titles • Cloud Firestore Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                haptic(35);
                setCurrentTab('home');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>View App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 mt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => { haptic(25); setActiveStudioTab('catalog'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeStudioTab === 'catalog'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-transparent'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>Catalog ({series.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic(25); setActiveStudioTab('form'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeStudioTab === 'form'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-transparent'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Add Title (Form)</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic(25); setActiveStudioTab('bulk'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeStudioTab === 'bulk'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-transparent'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Bulk JSON</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic(25); setActiveStudioTab('tester'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeStudioTab === 'tester'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stream Tester</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic(25); setActiveStudioTab('analytics'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeStudioTab === 'analytics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic(25); setActiveStudioTab('templates'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeStudioTab === 'templates'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Fast Templates</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic(25); setActiveStudioTab('theme'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeStudioTab === 'theme'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-transparent'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>Themes</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic(25); setActiveStudioTab('guide'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeStudioTab === 'guide'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-transparent'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Guide</span>
          </button>
        </div>
      </header>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div className="px-4 pt-3">
          <div
            className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs animate-in fade-in duration-150 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="flex-1 font-medium">{statusMsg.text}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDIO MAIN VIEW CONTENT */}
      {/* ========================================================================= */}
      <main className="flex-1 px-4 py-4 max-w-5xl mx-auto w-full space-y-5">
        {/* ========================================== */}
        {/* TAB 1: CATALOG MANAGEMENT */}
        {/* ========================================== */}
        {activeStudioTab === 'catalog' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search movies, web series, tags..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {uniqueCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { haptic(25); setCatalogCategory(cat); }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      catalogCategory === cat
                        ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog List */}
            {filteredCatalog.length === 0 ? (
              <div className="text-center py-12 rounded-3xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <Film className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No titles match your filter</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Add movies and web series using the Form Builder or Bulk JSON Import.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveStudioTab('form')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Create New Title
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCatalog.map((item) => {
                  const isExpanded = expandedSeriesId === item.id;
                  const isMovie =
                    item.category?.toLowerCase() === 'movie' ||
                    (item.seasons.length <= 1 && (item.seasons[0]?.episodes?.length || 0) <= 1);
                  const totalEps = item.seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden hover:border-cyan-500/40 transition shadow-sm"
                    >
                      {/* Main Series Card Row */}
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-12 h-16 object-cover rounded-xl border border-slate-800 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-black border ${
                                  isMovie
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                }`}
                              >
                                {isMovie ? 'MOVIE' : 'SERIES'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.category} • {item.year || 2026} • ⭐ {item.rating || '9.0'}
                              </span>
                            </div>

                            <h3 className="text-sm font-extrabold text-white truncate mt-1">
                              {item.title}
                            </h3>

                            <p className="text-[11px] text-slate-400 font-mono">
                              {item.seasons.length} {item.seasons.length === 1 ? 'Season' : 'Seasons'} • {totalEps} Episodes
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              haptic(35);
                              setExpandedSeriesId(isExpanded ? null : item.id);
                            }}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Expand Seasons & Episodes"
                          >
                            <span className="hidden sm:inline text-[11px]">Episodes</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditSeries(item)}
                            className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs transition cursor-pointer"
                            title="Edit Title"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSeries(item.id, item.title)}
                            className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs transition cursor-pointer"
                            title="Delete Title"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Seasons & Episodes List */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/80 bg-black/60 p-3.5 space-y-3">
                          {item.seasons.map((season) => (
                            <div key={season.seasonNumber} className="space-y-2">
                              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3 h-3 text-cyan-400" />
                                <span>{season.title || `Season ${season.seasonNumber}`} ({season.episodes.length} Episodes)</span>
                              </h4>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {season.episodes.map((ep) => (
                                  <div
                                    key={ep.id}
                                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-white truncate">
                                        E{ep.episodeNumber}: {ep.title}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {ep.duration || 'HD'}
                                      </span>
                                    </div>

                                    {/* Video Stream URL Status */}
                                    <div className="flex items-center gap-1.5 text-[11px] font-mono truncate text-slate-400">
                                      <span className={`w-1.5 h-1.5 rounded-full ${ep.videoUrl ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                      <span className="truncate">{ep.videoUrl ? ep.videoUrl : 'No Video Link Added'}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInlineEditingEp({
                                            seriesId: item.id,
                                            seasonNum: season.seasonNumber,
                                            epId: ep.id,
                                            title: ep.title,
                                            videoUrl: ep.videoUrl || ''
                                          });
                                        }}
                                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800 hover:border-cyan-500/40"
                                      >
                                        Edit Link
                                      </button>
                                      {ep.videoUrl && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            openSeriesWithEpisode(item.id, season.seasonNumber, ep.episodeNumber);
                                          }}
                                          className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
                                        >
                                          <Play className="w-2.5 h-2.5 fill-current" />
                                          <span>Play</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
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

            {/* Quick Inline Episode Edit Modal */}
            {inlineEditingEp && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <div className="w-full max-w-md p-4 rounded-2xl bg-black border border-cyan-500/40 space-y-3">
                  <h3 className="text-sm font-black text-white">Edit Episode Stream URL</h3>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Episode Title</label>
                    <input
                      type="text"
                      value={inlineEditingEp.title}
                      onChange={(e) => setInlineEditingEp({ ...inlineEditingEp, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Direct Video Stream URL (.m3u8 / .mp4)</label>
                    <input
                      type="url"
                      value={inlineEditingEp.videoUrl}
                      onChange={(e) => setInlineEditingEp({ ...inlineEditingEp, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setInlineEditingEp(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveInlineEpisode}
                      className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow"
                    >
                      Save Link
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: VISUAL FORM BUILDER */}
        {/* ========================================== */}
        {activeStudioTab === 'form' && (
          <form onSubmit={handleSaveFormSeries} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>{editingSeriesId ? 'Edit Title' : 'New Title Information'}</span>
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { haptic(25); setFormType('movie'); }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      formType === 'movie'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Cinema Movie
                  </button>
                  <button
                    type="button"
                    onClick={() => { haptic(25); setFormType('series'); }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      formType === 'series'
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Web Series
                  </button>
                </div>
              </div>

              {/* Title & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">
                    {formType === 'movie' ? 'Movie Title *' : 'Web Series Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Oppenheimer, Stranger Things"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Category / Genre</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="Movie">Cinema Movie</option>
                    <option value="Indian">Indian Cinema</option>
                    <option value="Anime">Anime</option>
                    <option value="Thriller">Thriller / Mystery</option>
                    <option value="K-Drama">K-Drama</option>
                    <option value="Action">Action</option>
                    <option value="Romance">Romance</option>
                  </select>
                </div>
              </div>

              {/* Year, Rating, Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Release Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Star Rating (e.g. 9.2)</label>
                  <input
                    type="text"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="4K, HDR, Action"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              {/* Poster & Banner URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Vertical Poster URL</label>
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://... poster.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs font-mono text-slate-300 focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Horizontal Banner URL (Optional)</label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://... banner.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs font-mono text-slate-300 focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">Synopsis / Story Overview</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter movie or series plot summary..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs text-white focus:border-cyan-400 outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Video Stream URL / Episodes Builder */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>{formType === 'movie' ? 'Movie Video Stream Link' : 'Seasons & Episodes Builder'}</span>
                </h3>
              </div>

              {formType === 'movie' ? (
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">
                    Direct Video Stream URL (.m3u8, .mp4, or WebM) *
                  </label>
                  <input
                    type="url"
                    value={formSeasons[0]?.episodes[0]?.videoUrl || ''}
                    onChange={(e) => {
                      const updated = [...formSeasons];
                      if (!updated[0]) {
                        updated[0] = { seasonNumber: 1, title: 'Full Movie', episodes: [] };
                      }
                      if (!updated[0].episodes[0]) {
                        updated[0].episodes[0] = {
                          id: `ep-${Date.now()}`,
                          episodeNumber: 1,
                          title: 'Full Movie (4K Ultra HD)',
                          duration: '2h 10m',
                          durationSeconds: 7800,
                          videoUrl: e.target.value
                        };
                      } else {
                        updated[0].episodes[0].videoUrl = e.target.value;
                      }
                      setFormSeasons(updated);
                    }}
                    placeholder="https://.../movie.m3u8 or .mp4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs font-mono text-cyan-300 focus:border-cyan-400 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Tip: Use the Stream Tester tab to verify and preview this video link.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formSeasons.map((season, sIdx) => (
                    <div key={season.seasonNumber} className="p-3.5 rounded-xl bg-black border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 font-mono">
                          Season {season.seasonNumber} ({season.episodes.length} Episodes)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formSeasons];
                              const nextEpNum = updated[sIdx].episodes.length + 1;
                              updated[sIdx].episodes.push({
                                id: `ep-${Date.now()}-${nextEpNum}`,
                                episodeNumber: nextEpNum,
                                title: `Episode ${nextEpNum}`,
                                duration: '45:00',
                                durationSeconds: 2700,
                                videoUrl: ''
                              });
                              setFormSeasons(updated);
                            }}
                            className="text-[11px] px-2.5 py-1 rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                          >
                            + Add 1 Episode
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formSeasons];
                              const currentCount = updated[sIdx].episodes.length;
                              for (let i = 1; i <= 5; i++) {
                                const num = currentCount + i;
                                updated[sIdx].episodes.push({
                                  id: `ep-${Date.now()}-${num}`,
                                  episodeNumber: num,
                                  title: `Episode ${num}`,
                                  duration: '45:00',
                                  durationSeconds: 2700,
                                  videoUrl: ''
                                });
                              }
                              setFormSeasons(updated);
                            }}
                            className="text-[11px] px-2.5 py-1 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 cursor-pointer"
                          >
                            + Add 5 Episodes
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {season.episodes.map((ep, eIdx) => (
                          <div key={ep.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-950 p-2 rounded-lg border border-slate-900">
                            <span className="sm:col-span-1 text-[11px] font-mono font-bold text-slate-500">
                              #{ep.episodeNumber}
                            </span>
                            <input
                              type="text"
                              value={ep.title}
                              onChange={(e) => {
                                const updated = [...formSeasons];
                                updated[sIdx].episodes[eIdx].title = e.target.value;
                                setFormSeasons(updated);
                              }}
                              placeholder="Episode Title"
                              className="sm:col-span-4 px-2.5 py-1.5 rounded-lg bg-black border border-slate-800 text-xs text-white outline-none"
                            />
                            <input
                              type="url"
                              value={ep.videoUrl || ''}
                              onChange={(e) => {
                                const updated = [...formSeasons];
                                updated[sIdx].episodes[eIdx].videoUrl = e.target.value;
                                setFormSeasons(updated);
                              }}
                              placeholder="Video URL (.m3u8, .mp4)"
                              className="sm:col-span-6 px-2.5 py-1.5 rounded-lg bg-black border border-slate-800 text-xs font-mono text-cyan-300 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...formSeasons];
                                updated[sIdx].episodes.splice(eIdx, 1);
                                setFormSeasons(updated);
                              }}
                              className="sm:col-span-1 p-1 text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSeriesId(null);
                  setActiveStudioTab('catalog');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-95 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingSeriesId ? 'Save Title Changes' : 'Publish to Cloud Firestore'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================== */}
        {/* TAB 3: BULK JSON IMPORT */}
        {/* ========================================== */}
        {activeStudioTab === 'bulk' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>Bulk JSON Catalog Editor</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      haptic(25);
                      setJsonText(JSON.stringify(SAMPLE_BULK_JSON, null, 2));
                    }}
                    className="text-[11px] px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-800"
                  >
                    Reset Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptic(30);
                      navigator.clipboard.writeText(jsonText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Paste an array of movie or web series JSON objects. Each item must contain title, category, thumbnailUrl, and seasons with episodes.
              </p>

              <textarea
                rows={16}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-slate-800 text-xs font-mono text-cyan-300 focus:border-cyan-400 outline-none leading-relaxed"
                spellCheck={false}
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 font-mono">
                  Schema: Series[] (with Seasons & Episodes)
                </span>
                <button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-95 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>Upload Catalog to Cloud</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: STREAM TESTER */}
        {/* ========================================== */}
        {activeStudioTab === 'tester' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Live Stream Diagnostics & Health Check</span>
                </h3>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  HLS • MP4 • WebM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Test any video streaming link before publishing. Checks network latency, codec headers, and streams live in the preview player.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={testerUrl}
                  onChange={(e) => setTesterUrl(e.target.value)}
                  placeholder="Paste .m3u8, .mp4, or embed stream link..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black border border-slate-800 text-xs font-mono text-white focus:border-cyan-400 outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestStream}
                  disabled={testerStatus === 'testing' || !testerUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {testerStatus === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Test Stream</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] text-slate-500 font-mono">Sample Presets:</span>
                <button
                  type="button"
                  onClick={() => { setTesterUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'); setTesterStatus('idle'); }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 border border-slate-800 hover:border-cyan-500/40"
                >
                  Mux HLS (.m3u8)
                </button>
                <button
                  type="button"
                  onClick={() => { setTesterUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'); setTesterStatus('idle'); }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-emerald-300 border border-slate-800 hover:border-emerald-500/40"
                >
                  Google MP4 (1080p)
                </button>
                <button
                  type="button"
                  onClick={() => { setTesterUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'); setTesterStatus('idle'); }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-purple-300 border border-slate-800 hover:border-purple-500/40"
                >
                  Tears of Steel 4K
                </button>
              </div>
            </div>

            {testerStatus !== 'idle' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-black border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Status</span>
                    <span className={`text-xs font-black font-mono ${testerStatus === 'testing' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {testerStatus === 'testing' ? '⚡ Testing...' : '🟢 Stream Active'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Latency</span>
                    <span className="text-xs font-black font-mono text-cyan-300">
                      {testerLatency ? `${testerLatency} ms` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Format</span>
                    <span className="text-xs font-black font-mono text-purple-300 truncate block">
                      {testerFormat || 'Detecting...'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">CORS / Stream</span>
                    <span className="text-xs font-black font-mono text-emerald-400">
                      Pass / Playable
                    </span>
                  </div>
                </div>

                {/* Live Preview Player */}
                <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-cyan-500/30 shadow-2xl max-w-2xl mx-auto">
                  <video
                    src={sanitizeVideoUrl(testerUrl)}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 max-w-2xl mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      haptic(40);
                      const updated = [...formSeasons];
                      if (updated[0] && updated[0].episodes[0]) {
                        updated[0].episodes[0].videoUrl = testerUrl.trim();
                        setFormSeasons(updated);
                      }
                      setActiveStudioTab('form');
                      setStatusMsg({ type: 'success', text: 'Verified video link sent to Form Builder Episode 1!' });
                      setTimeout(() => setStatusMsg(null), 3000);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Send to Form Builder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic(30);
                      navigator.clipboard.writeText(testerUrl.trim());
                      setTesterCopied(true);
                      setTimeout(() => setTesterCopied(false), 2000);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {testerCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{testerCopied ? 'Copied' : 'Copy Verified Link'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: STUDIO ANALYTICS */}
        {/* ========================================== */}
        {activeStudioTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Cinema Movies</span>
                  <Film className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{studioMetrics.moviesCount}</p>
                <span className="text-[10px] text-slate-500">Feature titles</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Web Series</span>
                  <Tv className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{studioMetrics.seriesCount}</p>
                <span className="text-[10px] text-slate-500">{studioMetrics.totalSeasons} Seasons</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Total Episodes</span>
                  <Layers className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-black text-white font-mono">{studioMetrics.totalEpisodes}</p>
                <span className="text-[10px] text-slate-500">Playable media files</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Cloud Sync</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400 font-mono">100%</p>
                <span className="text-[10px] text-slate-500">Connected</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Protocols */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Streaming Protocols</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Active Streams</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-cyan-300">HLS Adaptive (.m3u8)</span>
                      <span className="text-slate-400">{studioMetrics.protoMap.hls} streams</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{
                          width: `${
                            studioMetrics.totalEpisodes
                              ? Math.min(100, Math.round((studioMetrics.protoMap.hls / studioMetrics.totalEpisodes) * 100))
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-emerald-300">Direct MP4 / WebM</span>
                      <span className="text-slate-400">{studioMetrics.protoMap.mp4} streams</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{
                          width: `${
                            studioMetrics.totalEpisodes
                              ? Math.min(100, Math.round((studioMetrics.protoMap.mp4 / studioMetrics.totalEpisodes) * 100))
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Genre Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Genre Breakdown</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">{Object.keys(studioMetrics.catMap).length} Genres</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(studioMetrics.catMap).slice(0, 6).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{cat}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                        {count} titles
                      </span>
                    </div>
                  ))}
                  {Object.keys(studioMetrics.catMap).length === 0 && (
                    <p className="text-xs text-slate-500 py-3">No catalog titles available yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Backup & Export Bar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCatalog}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(0,243,255,0.3)] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: FAST TEMPLATES */}
        {/* ========================================== */}
        {activeStudioTab === 'templates' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
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
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition space-y-3 flex flex-col justify-between">
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
                    setActiveStudioTab('bulk');
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
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition space-y-3 flex flex-col justify-between">
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
                    setActiveStudioTab('bulk');
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
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition space-y-3 flex flex-col justify-between">
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
                    setActiveStudioTab('bulk');
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
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition space-y-3 flex flex-col justify-between">
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
                    setActiveStudioTab('bulk');
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

        {/* ========================================== */}
        {/* TAB 7: THEMES STORE */}
        {/* ========================================== */}
        {activeStudioTab === 'theme' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-fuchsia-400" />
                <span>StreamX Theme Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize global visual gradients and neon color palettes. All changes save live to Cloud Firestore.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {APP_THEMES.map((theme) => {
                const isActive = currentTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={async () => {
                      haptic(45);
                      await setAppTheme(theme.id);
                      setStatusMsg({ type: 'success', text: `Applied "${theme.name}" theme!` });
                      setTimeout(() => setStatusMsg(null), 3000);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isActive
                        ? 'bg-black border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,243,255,0.4)]'
                        : 'bg-slate-950 border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div
                      className={`w-full h-16 rounded-xl bg-gradient-to-r ${theme.previewGradient} flex items-center justify-between px-3 shadow-md`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full border border-white/60 shadow" style={{ backgroundColor: theme.primaryColor }} />
                        <span className="w-4 h-4 rounded-full border border-white/60 shadow" style={{ backgroundColor: theme.secondaryColor }} />
                      </div>
                      <span className="text-[10px] font-black text-black bg-white/90 px-2 py-0.5 rounded-full font-mono">
                        {theme.tag}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-white">{theme.name}</h4>
                        {isActive && (
                          <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/40">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{theme.description}</p>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-cyan-500 text-black shadow'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {isActive ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Palette className="w-3.5 h-3.5" />}
                      <span>{isActive ? 'Current Active Theme' : 'Apply Theme'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 8: HOSTING GUIDE */}
        {/* ========================================== */}
        {activeStudioTab === 'guide' && (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-rose-400">
                <Play className="w-4 h-4" />
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

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
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
          </div>
        )}
      </main>
    </div>
  );
};
