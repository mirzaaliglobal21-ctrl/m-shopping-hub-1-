import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageCircle, LogIn, ExternalLink } from 'lucide-react';
import { Product, CommentItem, AppUser } from '../types';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  comments: CommentItem[];
  currentUser: AppUser | null;
  onAddComment: (productId: string, text: string) => void;
  onPromptLogin: (reason: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  product,
  comments,
  currentUser,
  onAddComment,
  onPromptLogin,
}) => {
  const [commentText, setCommentText] = useState('');

  if (!product) return null;

  const productComments = comments.filter((c) => c.productId === product.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onPromptLogin('Please sign in with Google to post a comment on this product.');
      return;
    }
    if (!commentText.trim()) return;

    onAddComment(product.id, commentText.trim());
    setCommentText('');
  };

  const handleBuyNow = () => {
    if (product.directPurchaseUrl) {
      window.open(product.directPurchaseUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-sky-100 flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-sky-600">
                      {product.currency}
                      {product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={handleBuyNow}
                      className="text-[11px] font-semibold text-slate-500 hover:text-sky-600 inline-flex items-center gap-0.5"
                    >
                      Buy Now <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                id="close-comments-modal-btn"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <MessageCircle className="w-4 h-4 text-sky-600" />
                <span>Community Reviews & Discussions ({productComments.length})</span>
              </div>

              {productComments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No comments yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Be the first to share your thoughts on this product!</p>
                </div>
              ) : (
                productComments.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <img
                      src={item.userAvatar}
                      alt={item.userName}
                      className="w-9 h-9 rounded-full object-cover border border-sky-200"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{item.userName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Footer / Auth Prompt */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50">
              {currentUser ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-sky-300"
                  />
                  <input
                    id="comment-input-field"
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                  <button
                    id="post-comment-btn"
                    type="submit"
                    disabled={!commentText.trim()}
                    className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all cursor-pointer"
                    title="Post Comment"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-sky-200">
                  <div className="text-xs text-slate-600 pl-2">
                    <span className="font-semibold block text-slate-800">Only logged-in users can comment</span>
                    <span className="text-[11px] text-slate-500">Sign in with Google to post reviews</span>
                  </div>
                  <button
                    id="login-to-comment-btn"
                    onClick={() => onPromptLogin('Please sign in with Google to comment and review products.')}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
