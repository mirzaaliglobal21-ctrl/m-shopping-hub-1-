import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Bookmark, MessageCircle, ShieldCheck, Loader2, User } from 'lucide-react';
import { AppUser } from '../types';
import { loginWithGoogle, loginAsGuest } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  actionReason?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  actionReason,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      console.warn('Firebase Google popup sign-in attempt:', err);
      // If popup was blocked by browser or closed by user, offer one-click guest login
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google popup window was closed or blocked. You can also sign in instantly as a guest below.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not yet authorized in Firebase Console (Authentication > Settings > Authorized Domains). You can sign in instantly below as a shopper!');
      } else {
        setErrorMsg('Sign-in failed. You can sign in instantly with one click as a shopper.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const user = await loginAsGuest();
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      console.error('Instant sign-in error:', err);
      // Fallback local user
      const fallbackUser: AppUser = {
        id: 'shopper-' + Date.now().toString(36),
        name: 'Shopper',
        email: 'shopper@mshoppinghub.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        role: 'user',
      };
      onLoginSuccess(fallbackUser);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-100 text-center overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-sky-100 rounded-full blur-2xl pointer-events-none" />

            <button
              id="close-auth-modal-btn"
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Brand Logo & Heading */}
            <div className="mx-auto w-14 h-14 mb-4 rounded-full overflow-hidden border-2 border-sky-200 shadow-md">
              <img src="/logo.png" alt="M Shopping Hub" className="w-full h-full object-cover" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 font-['Outfit',sans-serif] mb-1">
              Sign In to Continue
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              {actionReason || 'Join M Shopping Hub to like items, save products to your personal wishlist, and participate in reviews.'}
            </p>

            {/* Feature Perks Pills */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100 flex flex-col items-center gap-1">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span className="text-[11px] font-semibold text-slate-700">Like Picks</span>
              </div>
              <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100 flex flex-col items-center gap-1">
                <Bookmark className="w-4 h-4 text-sky-600 fill-sky-600" />
                <span className="text-[11px] font-semibold text-slate-700">Save Items</span>
              </div>
              <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100 flex flex-col items-center gap-1">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-semibold text-slate-700">Add Reviews</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl text-left">
                {errorMsg}
              </div>
            )}

            {/* "Continue with Google" Button (Firebase Auth) */}
            <motion.button
              id="continue-with-google-btn"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Connecting to Firebase...' : 'Continue with Google'}</span>
            </motion.button>

            {/* Quick Instant Sign-In Alternative */}
            <button
              id="instant-shopper-signin-btn"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="mt-3 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Instant Shopper Sign In (No password needed)</span>
            </button>

            <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Powered by Google Firebase Authentication</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
