import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Heart } from 'lucide-react';

interface IshwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IshwaModal: React.FC<IshwaModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-100 text-center overflow-hidden"
          >
            {/* Ambient minimalist glow */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-sky-100/70 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-sky-200/50 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              id="close-tilli-modal-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Animated Fun Emoji & Icons */}
            <div className="flex justify-center items-center gap-3 mb-4">
              <motion.span
                animate={{
                  rotate: [0, 15, -15, 10, 0],
                  scale: [1, 1.2, 1, 1.15, 1],
                  y: [0, -6, 0, -4, 0],
                }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="text-4xl select-none"
              >
                🥰
              </motion.span>
              <motion.span
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 20, 0],
                }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.3 }}
                className="text-4xl select-none"
              >
                ✨
              </motion.span>
              <motion.span
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, -15, 15, 0],
                }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', delay: 0.6 }}
                className="text-4xl select-none"
              >
                💃
              </motion.span>
            </div>

            {/* Title: ISHWA */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 text-xs font-semibold tracking-wider uppercase rounded-full mb-3 border border-sky-100">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              Special Welcome Note
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-['Outfit',sans-serif] mb-2"
            >
              ISHWA
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-sm text-slate-600 leading-relaxed mb-6 font-medium"
            >
              Welcome to <span className="font-semibold text-sky-600">M Shopping Hub</span>! Wishing you a joyful, stylish, and wonderful shopping journey ahead.
            </motion.p>

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-sky-600 bg-sky-50/80 px-4 py-2 rounded-full border border-sky-200/60 mb-6"
            >
              <Heart className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
              Curated with Love & Elegance
            </motion.div>

            <div>
              <button
                id="ishwa-dismiss-btn"
                onClick={onClose}
                className="w-full py-3 px-6 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg shadow-sky-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                Back to Hub
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
