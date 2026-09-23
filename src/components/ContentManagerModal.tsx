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
  Edit3
} from 'lucide-react';
import { useAppStore } from '../store';
import { Series, Season, Episode } from '../types';

const SAMPLE_BULK_JSON: Series[] = [
  {
    id: 'sample-movie-1',
    title: 'Interstellar Odyssey',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    category: 'Sci-Fi',
    rating: '9.4',
    year: 2026,
    description: 'An expedition through a newly formed wormhole beyond Saturn to locate a habitable haven.',
    tags: ['Sci-Fi', 'Space', 'Adventure', 'Movie'],
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
            description: 'The journey beyond the known universe begins.'
          }
        ]
      }
    ]
  },
  {
    id: 'sample-series-1',
    title: 'Shadows of the City',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    category: 'Action',
    rating: '9.1',
    year: 2026,
    description: 'A vigilant detective unravels a high-stakes conspiracy in the heart of the metropolis.',
    tags: ['Action', 'Thriller', 'Crime', 'Web Series'],
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
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
            description: 'A mysterious phone call triggers a midnight investigation.'
          },
          {
            id: 'shadows-s1-e2',
            episodeNumber: 2,
            title: 'Episode 2: The Alleyway Chase',
            duration: '38:15',
            durationSeconds: 2295,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
    haptic
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'bulk' | 'form' | 'manage' | 'guide'>('bulk');
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(SAMPLE_BULK_JSON, null, 2));
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states for manual single entry / editing
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'movie' | 'series'>('series');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Action');
  const [rating, setRating] = useState('9.0');
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('Action, HD');
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

  // Strictly only show if open and user is vk8260428@gmail.com
  const isAdmin = user?.email?.toLowerCase().trim() === 'vk8260428@gmail.com';
  if (!isContentManagerOpen || !isAdmin) return null;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={() => setIsContentManagerOpen(false)}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Content Manager <span className="text-xs font-normal text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Cloud Admin</span>
              </h2>
              <p className="text-[11px] text-slate-400">Add & manage movies, web series, seasons, episodes & video URLs</p>
            </div>
          </div>
          <button
            onClick={() => setIsContentManagerOpen(false)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800/80 gap-2 overflow-x-auto scrollbar-none bg-slate-900/60">
          <button
            onClick={() => { haptic(25); setActiveTab('bulk'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'bulk'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Bulk JSON Import (एक साथ डालें)</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('form'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'form'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Visual Form (नया टाइटल)</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('manage'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'manage'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Manage Catalog ({series.length})</span>
          </button>

          <button
            onClick={() => { haptic(25); setActiveTab('guide'); }}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Hosting & Video Guide</span>
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
                    <option value="Action">Action</option>
                    <option value="Anime">Anime</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Romance">Romance</option>
                    <option value="K-Drama">K-Drama</option>
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
                      <button
                        type="button"
                        onClick={() => handleAddEpisode(sIdx)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Episode</span>
                      </button>
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Current Titles ({series.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">All live series and movies stored in your Cloud Firestore</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCatalog}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllCatalog}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Wipe All Dummy Videos</span>
                  </button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {series.map((item) => {
                    const totalEpisodes = item.seasons.reduce((acc, s) => acc + s.episodes.length, 0);
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-3.5"
                      >
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-14 h-20 rounded-xl object-cover border border-slate-800 flex-shrink-0 bg-slate-900"
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
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                              ★ {item.rating || '9.0'}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                              ID: {item.id}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditSeries(item)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-sky-950/60 border border-slate-800 hover:border-sky-700 text-slate-300 hover:text-sky-400 transition-colors"
                            title="Edit Series & Episodes"
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
                            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete from Firestore"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
