import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Heart, Bookmark, MessageCircle, ShieldCheck, Check, Share2 } from 'lucide-react';
import { Product } from '../types';
import { trackStoreClick } from '../lib/visitorTracker';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isLiked: boolean;
  isSaved: boolean;
  onToggleLike: (productId: string) => void;
  onToggleSave: (productId: string) => void;
  onOpenComments: (product: Product) => void;
  onShareProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  isLiked,
  isSaved,
  onToggleLike,
  onToggleSave,
  onOpenComments,
  onShareProduct,
}) => {
  if (!product) return null;

  const handleBuyNow = () => {
    trackStoreClick(product.id, product.title || 'Product');
    if (product.directPurchaseUrl) {
      window.open(product.directPurchaseUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-sky-100 my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Top Right: Share and Close Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                id="detail-modal-share-btn"
                onClick={() => onShareProduct?.(product)}
                className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors cursor-pointer border border-slate-200/60 bg-white/80"
                title="Share this product link"
                aria-label="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                id="close-product-detail-modal-btn"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Image Column */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                  alt={product.title || 'Product'}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold bg-rose-500 text-white rounded-full shadow-md">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Info Column */}
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full mb-2">
                    {product.category || 'Curated Store'}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit',sans-serif] leading-snug pr-12">
                    {product.title || 'Untitled Product'}
                  </h2>

                  <div className="flex items-baseline gap-3 my-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit',sans-serif]">
                      {product.currency || '$'}
                      {(product.price || 0).toFixed(2)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-slate-400 line-through">
                        {product.currency || '$'}
                        {product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {product.description || ''}
                  </p>

                  <div className="space-y-2 py-3 border-y border-slate-100 mb-5">
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <span>100% Authentic Product Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Direct Official Store Purchase Link</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Action row with Like, Save, Comments, and Share */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleLike(product.id)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        isLiked
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                      <span>{(product.likesCount || 0) + (isLiked ? 1 : 0)} Likes</span>
                    </button>

                    <button
                      onClick={() => onToggleSave(product.id)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-sky-50 border-sky-200 text-sky-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenComments(product);
                      }}
                      className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                      title="Read & post comments"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{product.commentsCount || 0}</span>
                    </button>

                    <button
                      onClick={() => onShareProduct?.(product)}
                      className="py-2.5 px-3.5 rounded-xl border border-sky-200 bg-sky-50/80 text-sky-700 hover:bg-sky-100 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                      title="Share product link"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>

                  {/* Big Buy Now Button */}
                  <button
                    id="detail-modal-buy-now-btn"
                    onClick={handleBuyNow}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Direct Store Purchase — Buy Now</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

