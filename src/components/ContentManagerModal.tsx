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
  TrendingUp
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

  const [activeTab, setActiveTab] = useState<'bulk' | 'form' | 'manage' | 'theme' | 'guide'>('bulk');
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(SAMPLE_BULK_JSON, null, 2));
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

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
                  {['All', 'Movie', 'Anime', 'K-Drama', 'Action', 'Thriller', 'Romance'].map((cat) => (
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
                      const matchesCategory =
                        manageCategoryFilter === 'All' ||
                        item.category.toLowerCase() === manageCategoryFilter.toLowerCase();
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
                                <div key={season.seasonNumber} className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                                    Season {season.seasonNumber} ({season.episodes.length} episodes)
                                  </span>

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
