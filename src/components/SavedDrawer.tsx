import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark, ExternalLink, Trash2, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface SavedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedProducts: Product[];
  onRemoveSave: (productId: string) => void;
}

export const SavedDrawer: React.FC<SavedDrawerProps> = ({
  isOpen,
  onClose,
  savedProducts,
  onRemoveSave,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="absolute inset-y-0 right-0 max-w-full flex pl-10"
          >
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <Bookmark className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 font-['Outfit',sans-serif]">
                      Saved Products ({savedProducts.length})
                    </h2>
                    <p className="text-xs text-slate-500">Your curated personal wishlist</p>
                  </div>
                </div>
                <button
                  id="close-saved-drawer-btn"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Saved Items Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {savedProducts.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-base font-bold text-slate-700">No saved products yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Tap the bookmark icon on any product card in the marketplace to save items here.
                    </p>
                  </div>
                ) : (
                  savedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70 hover:border-sky-200 transition-all"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                        }}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {product.title}
                        </h4>
                        <span className="text-xs font-black text-sky-600 font-['Outfit',sans-serif] block mt-0.5">
                          {product.currency}
                          {product.price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={product.directPurchaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-xs"
                          >
                            <span>Buy Now</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => onRemoveSave(product.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Summary */}
              {savedProducts.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {savedProducts.length} items saved
                  </span>
                  <button
                    onClick={onClose}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700"
                  >
                    Continue Browsing
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
