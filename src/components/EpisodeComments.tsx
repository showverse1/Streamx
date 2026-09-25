import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Send, Trash2, Sparkles, User as UserIcon } from 'lucide-react';
import { EpisodeComment } from '../types';
import {
  subscribeEpisodeComments,
  addEpisodeComment,
  toggleCommentLike,
  deleteEpisodeComment
} from '../firebase';
import { useAppStore } from '../store';

interface EpisodeCommentsProps {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
}

export const EpisodeComments: React.FC<EpisodeCommentsProps> = ({
  seriesId,
  seasonNumber,
  episodeNumber,
  episodeTitle
}) => {
  const { user, haptic } = useAppStore();
  const [comments, setComments] = useState<EpisodeComment[]>([]);
  const [newText, setNewText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to real-time comments for this specific episode
  useEffect(() => {
    const unsubscribe = subscribeEpisodeComments(
      seriesId,
      seasonNumber,
      episodeNumber,
      (list) => {
        setComments(list);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [seriesId, seasonNumber, episodeNumber]);

  const currentUserId = user?.uid || (typeof window !== 'undefined' ? localStorage.getItem('streamx_anon_uid') || '' : '');
  const ensureAnonId = () => {
    if (typeof window === 'undefined') return 'anon';
    let id = localStorage.getItem('streamx_anon_uid');
    if (!id) {
      id = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('streamx_anon_uid', id);
    }
    return id;
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed || isSubmitting) return;

    haptic(40);
    setIsSubmitting(true);

    const authorName = user?.name || guestName.trim() || 'StreamX Viewer';
    const authorId = user?.uid || ensureAnonId();

    try {
      await addEpisodeComment({
        seriesId,
        seasonNumber,
        episodeNumber,
        userId: authorId,
        userName: authorName,
        userAvatar: user?.avatarUrl,
        text: trimmed
      });
      setNewText('');
    } catch (err) {
      console.warn('Failed to send comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    haptic(30);
    const userIdOrAnon = user?.uid || ensureAnonId();
    await toggleCommentLike(commentId, userIdOrAnon, seriesId, seasonNumber, episodeNumber);
  };

  const handleDelete = async (commentId: string) => {
    haptic(40);
    await deleteEpisodeComment(commentId, seriesId, seasonNumber, episodeNumber);
  };

  const formatCommentTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="rounded-2xl bg-black border border-cyan-500/35 p-4 sm:p-5 space-y-4 shadow-[0_0_25px_rgba(0,243,255,0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.3)]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>Episode Discussion</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 font-mono font-bold border border-cyan-500/40">
                {comments.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Share your theories & reactions for E{episodeNumber}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-fuchsia-400 bg-black px-2 py-0.5 rounded border border-fuchsia-500/40 shadow-[0_0_8px_rgba(255,0,127,0.3)]">
          Live Community
        </span>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendComment} className="space-y-2.5">
        {!user && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Your Nickname:</span>
            <input
              type="text"
              placeholder="e.g. OtakuX, CyberFan"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={24}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white placeholder-slate-600 outline-none transition-colors w-40"
            />
          </div>
        )}

        <div className="relative">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={`Leave a comment on Episode ${episodeNumber}${episodeTitle ? ` (${episodeTitle})` : ''}...`}
            rows={2}
            maxLength={350}
            className="w-full p-3 pr-12 text-xs rounded-xl bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 text-white placeholder-slate-500 outline-none resize-none shadow-inner transition-colors"
          />

          <button
            type="submit"
            disabled={!newText.trim() || isSubmitting}
            className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all active:scale-95 cursor-pointer ${
              newText.trim() && !isSubmitting
                ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.6)]'
                : 'bg-slate-900 text-slate-600 cursor-not-allowed'
            }`}
            title="Post Comment"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 pt-1">
        {comments.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950/70 border border-slate-900 text-center space-y-1.5">
            <Sparkles className="w-6 h-6 text-cyan-400/60 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">
              No comments on this episode yet
            </p>
            <p className="text-[11px] text-slate-500">
              Be the first to share your thoughts on Episode {episodeNumber}!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isLiked = currentUserId && comment.likedBy?.includes(currentUserId);
            const isAuthor = currentUserId && comment.userId === currentUserId;
            const isAdmin = user?.email?.toLowerCase().trim() === 'vk8260428@gmail.com' || user?.email?.toLowerCase().trim() === 'verseshow94@gmail.com';

            return (
              <div
                key={comment.id}
                className="p-3 rounded-xl bg-slate-950 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-fuchsia-600 p-0.5 shadow-[0_0_6px_rgba(0,243,255,0.4)]">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-black text-cyan-300">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <span className="font-extrabold text-xs text-white">
                      {comment.userName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatCommentTime(comment.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Like button */}
                    <button
                      type="button"
                      onClick={() => handleLike(comment.id)}
                      className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full transition-all active:scale-95 cursor-pointer ${
                        isLiked
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                          : 'bg-black text-slate-400 hover:text-rose-400 border border-slate-800'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{comment.likes || 0}</span>
                    </button>

                    {/* Delete button (Owner or Admin) */}
                    {(isAuthor || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed pl-8 break-words">
                  {comment.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
