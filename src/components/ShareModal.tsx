import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, MessageCircle, ExternalLink, Send, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Determine base URL (handles localhost, custom domains, or Vercel)
  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://m-shopping-hub-1-two.vercel.app';

  // Construct target link
  const shareUrl = product
    ? `${currentOrigin}/?product=${encodeURIComponent(product.id)}`
    : `${currentOrigin}/`;

  const shareTitle = product
    ? `${product.title} | M Shopping Hub`
    : 'M Shopping Hub | Premium Direct Purchase Marketplace';

  const shareText = product
    ? `✨ Check out "${product.title}" (${product.currency || '$'}${product.price}) on M Shopping Hub!\nClick the link to view details & buy directly:\n`
    : `🛍️ Discover curated products with 100% direct official store purchase links on M Shopping Hub:\n`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers / iframe restrictions
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn('Copy to clipboard failed:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // Ignore user cancel
      }
    } else {
      handleCopyLink();
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-sky-100 overflow-hidden"
        >
          {/* Close button */}
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-['Outfit',sans-serif]">
                {product ? 'Share Product' : 'Share Website'}
              </h3>
              <p className="text-xs text-slate-500">
                Share this link to bring visitors directly to this product
              </p>
            </div>
          </div>

          {/* Product Preview Card (if sharing a product) */}
          {product && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
              <img
                src={product.imageUrl}
                alt={product.title}
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-white"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                  {product.category}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {product.title}
                </h4>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-['Outfit',sans-serif]">
                    {product.currency || '$'}
                    {product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-[11px] text-slate-400 line-through">
                      {product.currency || '$'}
                      {product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Direct Social Share Buttons */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Share directly to:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all text-center group"
                title="Share on WhatsApp"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-xs">
                  <MessageCircle className="w-4 h-4 fill-white" />
                </div>
                <span className="text-[11px] font-bold">WhatsApp</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all text-center group"
                title="Share on Facebook"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-xs font-black text-xs">
                  f
                </div>
                <span className="text-[11px] font-bold">Facebook</span>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 transition-all text-center group"
                title="Share on Twitter / X"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-xs font-bold text-xs">
                  𝕏
                </div>
                <span className="text-[11px] font-bold">X (Twitter)</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 transition-all text-center group"
                title="Share on Telegram"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-xs">
                  <Send className="w-3.5 h-3.5 fill-white" />
                </div>
                <span className="text-[11px] font-bold">Telegram</span>
              </a>
            </div>
          </div>

          {/* Copy Link Input Section */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Copy Direct Web Link:
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-700 font-mono select-all outline-none truncate"
              />
              <button
                id="copy-share-link-btn"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Native Share Sheet Button (Mobile friendly) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 mb-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Open Device Share Menu (Instagram, Chat, etc.)</span>
            </button>
          )}

          {/* Explanatory Note */}
          <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100/80 text-[11px] text-sky-800 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <span>
              <strong>Direct Link:</strong> Jab koi is link par click karega to wo sidha aapki website par aayega aur ye product screen par khul jayega!
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
