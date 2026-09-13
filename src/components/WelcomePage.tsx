import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight, Sparkles, ShieldCheck, Zap, Heart } from 'lucide-react';
import { IshwaModal } from './IshwaModal';

interface WelcomePageProps {
  onStartShopping: () => void;
  onOpenAdminLogin: () => void;
  isAdmin: boolean;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onStartShopping,
  onOpenAdminLogin,
  isAdmin,
}) => {
  const [isIshwaOpen, setIsIshwaOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-white text-slate-900 flex flex-col justify-between">
      {/* Background Ambient Slow-Motion Video & Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Slow-motion background looping video with elegant styling */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-[1px] mix-blend-multiply"
          poster="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=75"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-curved-blue-lines-moving-slowly-31804-large.mp4"
            type="video/mp4"
          />
        </video>

        {/* Slow motion ambient floating glowing orbs */}
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-300/35 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 40, -40, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-sky-200/50 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -30, 40, 0],
          }}
          transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut', delay: 4 }}
          className="absolute -bottom-32 left-1/4 w-[30rem] h-[30rem] rounded-full bg-sky-100/70 blur-3xl"
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        {/* Top Left: Logo + Brand Title */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="relative"
          >
            <img
              src="/logo.png"
              alt="M Shopping Hub Logo"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-lg shadow-sky-500/15 border-2 border-white bg-white"
            />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </motion.div>
          <div>
            <span className="block text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 font-['Outfit',sans-serif]">
              M Shopping Hub
            </span>
            <span className="block text-[11px] font-medium text-sky-600 tracking-wider uppercase">
              Direct Store Curation
            </span>
          </div>
        </div>

        {/* Top Right: (tilli) Small Box Button + Admin Quick Key */}
        <div className="flex items-center gap-2.5">
          {/* Requested '(tilli)' small box in top corner */}
          <motion.button
            id="tilli-welcome-box-btn"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsIshwaOpen(true)}
            className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200/80 shadow-sm backdrop-blur-md transition-all cursor-pointer"
            title="Click to open special welcome note"
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="font-mono tracking-tight lowercase font-bold text-sky-800">(tilli)</span>
            <Sparkles className="w-3.5 h-3.5 text-sky-500 group-hover:rotate-12 transition-transform" />
          </motion.button>

          {/* Admin Switch Indicator / Button */}
          <button
            id="admin-auth-open-btn"
            onClick={onOpenAdminLogin}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              isAdmin
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-500/30'
                : 'bg-white/80 text-slate-600 hover:text-sky-700 hover:bg-white border-slate-200/80'
            }`}
          >
            {isAdmin ? 'Admin Mode Active' : 'Admin Portal'}
          </button>
        </div>
      </header>

      {/* Main Welcome Hero Content */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Left Column: Typography, Tagline, Buttons */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="flex-1 text-center lg:text-left max-w-2xl"
        >
          {/* Prominent Logo Display for Welcome Page as requested */}
          <div className="inline-flex items-center gap-3 p-2 pr-5 bg-white/90 backdrop-blur-md rounded-full shadow-md shadow-sky-100 border border-sky-100 mb-6">
            <img
              src="/logo.png"
              alt="M Shopping Hub Official Emblem"
              className="w-10 h-10 rounded-full object-cover border border-sky-200"
            />
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 block">M SHOPPING HUB</span>
              <span className="text-[10px] text-sky-600 font-medium">100% Direct Store Purchases</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] font-['Outfit',sans-serif] mb-4">
            Discover What You Love,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-blue-700">
              Direct From The Source.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
            Welcome to <span className="font-semibold text-slate-900">M Shopping Hub</span> — your premier destination for handpicked tech, fashion, fragrance, and lifestyle essentials with instant direct purchase links.
          </p>

          {/* Action Buttons: "Start Shopping" and "Get Started" as requested */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
            <motion.button
              id="start-shopping-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartShopping}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-sky-500/25 flex items-center justify-center gap-3 transition-all duration-300"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Start Shopping</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              id="get-started-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartShopping}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-sky-50/80 text-sky-700 font-bold text-base rounded-2xl border-2 border-sky-200/80 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <Sparkles className="w-4 h-4 text-sky-500" />
            </motion.button>
          </div>

          {/* Trust Value Badges */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0 pt-4 border-t border-sky-200/60">
            <div className="flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-1 text-sky-600 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Direct</span>
              </div>
              <span className="text-xs text-slate-500 text-center lg:text-left">Official Store Links</span>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-1 text-sky-600 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <span>2-Col Mobile</span>
              </div>
              <span className="text-xs text-slate-500 text-center lg:text-left">Fast Browsing</span>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-1 text-sky-600 font-bold text-sm">
                <Heart className="w-4 h-4" />
                <span>Verified</span>
              </div>
              <span className="text-xs text-slate-500 text-center lg:text-left">Curated Picks</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Animated Female Shopping Character with Shopping Bag */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
          className="flex-1 relative flex justify-center items-center w-full max-w-md lg:max-w-lg"
        >
          {/* Slow-motion glowing halo behind character */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.6, 0.85, 0.6],
            }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 via-sky-300/30 to-blue-400/20 rounded-full blur-3xl"
          />

          {/* Character Frame with Slow Motion Floating Animation */}
          <motion.div
            animate={{
              y: [0, -14, 0],
              rotate: [0, 0.8, -0.8, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5.5,
              ease: 'easeInOut',
            }}
            className="relative z-10 w-72 sm:w-84 md:w-96 rounded-3xl overflow-hidden shadow-2xl shadow-sky-500/20 border-4 border-white bg-white/80 backdrop-blur-sm"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-sky-50 to-sky-100/70">
              <img
                src="/shopping_girl.jpg"
                alt="Elegant Animated Shopping Character"
                className="w-full h-full object-cover object-top filter contrast-[1.03]"
              />

              {/* Floating badges on character */}
              <motion.div
                animate={{
                  y: [0, -6, 0],
                }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
                className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-sky-100 flex items-center gap-2"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-slate-800">New Arrivals Ready</span>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 6, 0],
                }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-sky-100 flex items-center gap-2.5"
              >
                <div className="p-1.5 bg-sky-500 text-white rounded-xl">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-800">Direct Purchase</span>
                  <span className="block text-[10px] text-sky-600 font-semibold">Official Store Direct</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer info bar */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-sky-100/80">
        <p>© 2026 M Shopping Hub. All rights reserved. Direct purchase links powered by official brand stores.</p>
        <button
          onClick={onStartShopping}
          className="text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
        >
          Browse Marketplace Catalog <ArrowRight className="w-3 h-3" />
        </button>
      </footer>

      {/* ISHWA Special Modal triggered by '(tilli)' */}
      <IshwaModal isOpen={isIshwaOpen} onClose={() => setIsIshwaOpen(false)} />
    </div>
  );
};
