import React from 'react';
import { motion } from 'motion/react';
import { Heart, Bookmark, MessageCircle, ExternalLink, Trash2, Edit3, ShieldAlert, Share2 } from 'lucide-react';
import { Product } from '../types';
import { trackStoreClick } from '../lib/visitorTracker';

interface ProductCardProps {
  product: Product;
  isLiked: boolean;
  isSaved: boolean;
  onToggleLike: (productId: string) => void;
  onToggleSave: (productId: string) => void;
  onOpenComments: (product: Product) => void;
  onProductClick: (product: Product) => void;
  isAdmin: boolean;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onShareProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isLiked,
  isSaved,
  onToggleLike,
  onToggleSave,
  onOpenComments,
  onProductClick,
  isAdmin,
  onEditProduct,
  onDeleteProduct,
  onShareProduct,
}) => {
  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackStoreClick(product.id, product.title || 'Product');
    if (product.directPurchaseUrl) {
      window.open(product.directPurchaseUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const categoryLabel = (product.category || 'Curated').split(' ')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-sky-200 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
      onClick={() => onProductClick(product)}
    >
      {/* Product Image & Top Badges */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
          alt={product.title || 'Product'}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient overlay on bottom of image for contrast */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Category & Discount Tag */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-white/90 text-slate-800 backdrop-blur-md rounded-full shadow-xs border border-slate-100">
            {categoryLabel}
          </span>
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-rose-500 text-white rounded-full shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Top Right: Share & Save / Wishlist Buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <button
            id={`share-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onShareProduct?.(product);
            }}
            className="p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all bg-white/90 text-slate-600 hover:text-sky-600 hover:bg-white shadow-xs cursor-pointer"
            title="Share this product"
            aria-label="Share product"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            id={`save-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(product.id);
            }}
            className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
              isSaved
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'bg-white/85 text-slate-600 hover:text-sky-600 hover:bg-white shadow-xs'
            }`}
            title={isSaved ? 'Saved to collection' : 'Save product'}
            aria-label="Save product"
          >
            <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Admin Quick Control overlay if user is admin */}
        {isAdmin && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-end gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl z-20">
            <span className="text-[10px] text-sky-300 font-semibold mr-auto pl-1 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Admin
            </span>
            {onEditProduct && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProduct(product);
                }}
                className="p-1 rounded bg-sky-600 hover:bg-sky-500 text-white"
                title="Edit Product"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
            {onDeleteProduct && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProduct(product.id);
                }}
                className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                title="Delete Product"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base line-clamp-1 leading-snug group-hover:text-sky-600 transition-colors">
            {product.title || 'Untitled Product'}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description || ''}
          </p>
        </div>

        {/* Price & Discount info */}
        <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base md:text-lg font-black text-slate-900 font-['Outfit',sans-serif]">
            {product.currency || '$'}
            {(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
              {product.currency || '$'}
              {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* User Interaction Controls: Like, Comment, Share and Buy Now */}
        <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex flex-col gap-2">
          {/* Social Stats Row: Like, Comment & Share */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            {/* Like button */}
            <button
              id={`like-btn-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(product.id);
              }}
              className={`flex items-center gap-1 sm:gap-1.5 transition-colors p-1 rounded-lg cursor-pointer ${
                isLiked
                  ? 'text-rose-600 font-semibold'
                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  isLiked ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
              <span className="text-[11px] sm:text-xs">
                {(product.likesCount || 0) + (isLiked ? 1 : 0)}
              </span>
            </button>

            {/* Comment button */}
            <button
              id={`comment-btn-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments(product);
              }}
              className="flex items-center gap-1 sm:gap-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 p-1 rounded-lg transition-colors cursor-pointer"
              title="Read & post comments"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[11px] sm:text-xs">{product.commentsCount || 0}</span>
            </button>

            {/* Quick Share button in social row */}
            <button
              id={`share-row-btn-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onShareProduct?.(product);
              }}
              className="flex items-center gap-1 sm:gap-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 p-1 rounded-lg transition-colors cursor-pointer"
              title="Share product link"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[11px] sm:text-xs">Share</span>
            </button>
          </div>

          {/* "Buy Now" Button */}
          <button
            id={`buy-now-btn-${product.id}`}
            onClick={handleBuyNow}
            className="w-full py-2 sm:py-2.5 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Buy Now</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-90" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

