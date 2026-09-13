import React from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles, ShoppingBag, Tag } from 'lucide-react';

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 text-white shadow-md shadow-sky-950/10 mb-4 sm:mb-5 border border-sky-400/30">
      {/* 1. Animated Shopping Girl as Background (with slow-motion breathing & floating effect) */}
      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          y: [0, -6, 0],
        }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <img
          src="/shopping_girl.jpg"
          alt="Shopping Character Background"
          className="w-full h-full object-cover object-[80%_20%] sm:object-[85%_25%] md:object-[80%_30%] filter brightness-90 contrast-105"
        />
      </motion.div>

      {/* 2. Color Gradient Overlay for Pristine Readability & Sky Blue Branding */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-950/95 via-sky-900/90 to-sky-700/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-sky-950/70 via-transparent to-sky-900/30 pointer-events-none" />

      {/* Ambient floating glow orb */}
      <motion.div
        animate={{
          x: [0, 20, 0],
          y: [0, -10, 0],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-sky-400/20 blur-2xl pointer-events-none"
      />

      {/* 3. Compact Banner Content (Previous Standalone Girl Box Removed) */}
      <div className="relative z-10 py-4 px-4 sm:py-5 sm:px-6 md:px-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Brand, Compact Title & Search */}
        <div className="w-full md:max-w-xl">
          {/* Top Brand Pill */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xs">
              <img
                src="/logo.png"
                alt="M Shopping Hub Emblem"
                className="w-5 h-5 rounded-full object-cover border border-white/40 bg-white"
              />
              <span className="text-[11px] font-bold tracking-wider uppercase text-sky-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                M Shopping Hub
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-sky-200/90 bg-sky-950/50 px-2 py-0.5 rounded-full border border-sky-400/20">
              <ShoppingBag className="w-3 h-3 text-sky-400" />
              Direct Official Stores
            </span>
          </div>

          {/* Compact Headline */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight font-['Outfit',sans-serif] leading-snug text-white">
            Curated Direct Purchase Marketplace
          </h1>
          <p className="text-xs text-sky-100/80 leading-normal line-clamp-1 mt-0.5 mb-2.5">
            Authentic brand products with verified direct store links and official discounts.
          </p>

          {/* Compact Search Bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="marketplace-banner-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products by title, category, or style..."
              className="w-full pl-9 pr-9 py-2 bg-white/95 hover:bg-white focus:bg-white text-slate-900 rounded-xl shadow-xs border border-white/80 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400 text-xs font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Compact Category Filter Chips */}
        <div className="w-full md:w-auto flex flex-col md:items-end justify-center">
          <span className="text-[10px] font-bold text-sky-200/75 uppercase tracking-wider mb-1 hidden md:block">
            Quick Categories
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-sky-700 shadow-xs font-bold'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/15 backdrop-blur-xs'
                }`}
              >
                <Tag className="w-2.5 h-2.5 opacity-70" />
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
