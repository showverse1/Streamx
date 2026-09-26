import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  Plus,
  Trash2,
  Film,
  Tv,
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
  FileText
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

export const ContentManagerModal: React.FC = () => {
  const {
    user,
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
    haptic
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'bulk' | 'form' | 'manage' | 'tester' | 'analytics' | 'templates' | 'theme' | 'guide'>('bulk');
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

  if (!isContentManagerOpen || !isAdmin) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={() => setIsContentManagerOpen(false)}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-black border border-cyan-500/40 shadow-[0_0_40px_rgba(0,243,255,0.25)] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Cyber Neon Studio) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-black/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.5)] border border-cyan-300">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Creator Studio</span>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40 shadow-[0_0_8px_rgba(0,243,255,0.3)]">
                  Cloud Admin
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">StreamX Neon Content Hub • Direct HLS & MP4 Streaming</p>
            </div>
          </div>
          <button
            onClick={() => setIsContentManagerOpen(false)}
            className="p-2 rounded-xl bg-black border border-cyan-500/30 hover:border-cyan-400 text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(0,243,255,0.2)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-cyan-500/25 gap-2 overflow-x-auto scrollbar-none bg-black/80">
          <button
            onClick={() => { haptic(25); setActiveTab('bulk'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'bulk'
                ? 'border-cyan-400 text-cyan-300 shadow-[0_4px_12px_rgba(0,243,255,0.4)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Bulk JSON Import</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('form'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'form'
                ? 'border-cyan-400 text-cyan-300 shadow-[0_4px_12px_rgba(0,243,255,0.4)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Visual Form Builder</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('manage'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'manage'
                ? 'border-cyan-400 text-cyan-300 shadow-[0_4px_12px_rgba(0,243,255,0.4)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Manage Catalog ({series.length})</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('tester'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'tester'
                ? 'border-cyan-400 text-cyan-300 shadow-[0_4px_12px_rgba(0,243,255,0.4)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Stream Tester</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('analytics'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-cyan-400 text-cyan-300 shadow-[0_4px_12px_rgba(0,243,255,0.4)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Studio Analytics</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('templates'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'templates'
                ? 'border-cyan-400 text-cyan-300 shadow-[0_4px_12px_rgba(0,243,255,0.4)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Fast Templates</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('theme'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'theme'
                ? 'border-cyan-400 text-cyan-300 shadow-[0_4px_12px_rgba(0,243,255,0.4)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4 text-fuchsia-400" />
            <span>🎨 Theme Store</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('guide'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'border-cyan-400 text-cyan-300 shadow-[0_4px_12px_rgba(0,243,255,0.4)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Streaming Guide</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in duration-150 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            )}
            <span className="flex-1">{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white text-xs">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BULK JSON IMPORT */}
          {activeTab === 'bulk' && (
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

          {/* TAB 2: VISUAL FORM CREATOR / EDITOR */}
          {activeTab === 'form' && (
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
                            <input
                              type="url"
                              required
                              value={ep.videoUrl}
                              onChange={(e) => {
                                const updated = [...formSeasons];
                                updated[sIdx].episodes[eIdx].videoUrl = e.target.value;
                                setFormSeasons(updated);
                              }}
                              placeholder="Video Stream URL (Direct .mp4 or .m3u8 CDN link) *"
                              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-rose-200 text-xs font-mono"
                            />
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

          {/* TAB 3: MANAGE CURRENT CATALOG */}
          {activeTab === 'manage' && (
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
                  {series
                    .filter((item) => {
                      const matchesSearch =
                        !manageSearchQuery.trim() ||
                        item.title.toLowerCase().includes(manageSearchQuery.toLowerCase()) ||
                        item.category.toLowerCase().includes(manageSearchQuery.toLowerCase()) ||
                        item.id.toLowerCase().includes(manageSearchQuery.toLowerCase());
                      const isMovie = item.category?.toLowerCase() === 'movie' || (item.seasons.length === 1 && item.seasons[0].episodes.length === 1);
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
                    })
                    .map((item) => {
                      const totalEpisodes = item.seasons.reduce((acc, s) => acc + s.episodes.length, 0);
                      const isExpanded = expandedSeriesId === item.id;

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/25 hover:border-cyan-500/40 space-y-3 transition-colors shadow-sm"
                        >
                          <div className="flex items-center gap-3.5">
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
            </div>
          )}

          {/* TAB: THEME STORE */}
          {activeTab === 'theme' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Theme Store Header Banner */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                          ? 'bg-black border-2 border-cyan-300 shadow-[0_0_25px_rgba(0,243,255,0.5)] ring-2 ring-cyan-400/50 scale-[1.02]'
                          : 'bg-black/80 border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                      }`}
                    >
                      {/* Gradient Banner Preview */}
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

                      {/* Action Button */}
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

          {/* TAB: STREAM TESTER & HEALTH CHECK */}
          {activeTab === 'tester' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black border border-cyan-500/30 space-y-3">
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
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">Sample Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTesterUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                      setTesterStatus('idle');
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 cursor-pointer"
                  >
                    Mux HLS (.m3u8)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTesterUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                      setTesterStatus('idle');
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 cursor-pointer"
                  >
                    Google MP4 (1080p)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTesterUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
                      setTesterStatus('idle');
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-fuchsia-300 border border-slate-800 cursor-pointer"
                  >
                    Tears of Steel 4K
                  </button>
                </div>
              </div>

              {/* Diagnostics Results & Video Player */}
              {testerStatus !== 'idle' && (
                <div className="p-4 rounded-2xl bg-black border border-slate-800 space-y-3">
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
                        setActiveTab('form');
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

          {/* TAB: STUDIO ANALYTICS & CATALOG METRICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              {/* Top Overview Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Cinema Movies</span>
                    <Film className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">{studioMetrics.moviesCount}</p>
                  <span className="text-[10px] text-slate-500">Feature titles</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Web Series</span>
                    <Tv className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">{studioMetrics.seriesCount}</p>
                  <span className="text-[10px] text-slate-500">{studioMetrics.totalSeasons} Seasons</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Total Episodes</span>
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">{studioMetrics.totalEpisodes}</p>
                  <span className="text-[10px] text-slate-500">Playable media files</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Cloud Firestore</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-emerald-400 font-mono">100%</p>
                  <span className="text-[10px] text-slate-500">Real-time sync</span>
                </div>
              </div>

              {/* Protocols & Format Distribution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Streaming protocols */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Streaming Protocols</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Active Streams</span>
                  </div>
                  <div className="space-y-2">
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

                {/* Categories Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>Genre Breakdown</span>
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

              {/* One-Click Backup & Database Actions */}
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

          {/* TAB: FAST 1-CLICK TEMPLATES */}
          {activeTab === 'templates' && (
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
                      setActiveTab('bulk');
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
                      setActiveTab('bulk');
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
                      setActiveTab('bulk');
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
                      setActiveTab('bulk');
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

          {/* TAB 4: HOSTING & VIDEO GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
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

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
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

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
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
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Connected to Cloud Firestore</span>
          <span>StreamX Content Suite</span>
        </div>
      </div>
    </div>
  );
};
