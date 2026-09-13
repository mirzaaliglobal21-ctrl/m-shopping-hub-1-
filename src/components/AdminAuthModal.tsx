import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, KeyRound, AlertCircle, X, CheckCircle, LogOut, BarChart3 } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onAdminLoginSuccess: () => void;
  onAdminLogout: () => void;
  onOpenAdminDashboard?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onAdminLoginSuccess,
  onAdminLogout,
  onOpenAdminDashboard,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Strict check for password '420225'
    if (passwordInput.trim() === '420225') {
      setIsSuccess(true);
      setTimeout(() => {
        onAdminLoginSuccess();
        setPasswordInput('');
        setIsSuccess(false);
        onClose();
      }, 700);
    } else {
      setErrorMessage('Access Denied: Incorrect secret passcode. Only authorized administrators can access management tools.');
    }
  };

  const handleDeactivate = () => {
    onAdminLogout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-100 overflow-hidden"
          >
            {/* Ambient Background Accent */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-200/40 rounded-full blur-2xl pointer-events-none" />

            <button
              id="close-admin-auth-modal-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shadow-inner">
              {isAdmin ? <ShieldCheck className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 font-['Outfit',sans-serif]">
                {isAdmin ? 'Admin Portal Active' : 'Admin Security Gate'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isAdmin
                  ? 'You currently have Administrator access to add, edit, or remove catalog products.'
                  : 'Enter the master security key to unlock catalog management and product uploads.'}
              </p>
            </div>

            {isAdmin ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs sm:text-sm flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Role: Administrator</span>
                    <span>Product upload forms and deletion permissions are currently enabled for your session.</span>
                  </div>
                </div>

                {onOpenAdminDashboard && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdminDashboard();
                    }}
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    <span>Open Visitors & Traffic Dashboard</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                  </button>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
                  >
                    Continue as Admin
                  </button>
                  <button
                    onClick={handleDeactivate}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-semibold text-sm rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Lock Admin
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Security Passcode
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    {/* Password is fully masked so entered characters are never shown on screen, as explicitly instructed */}
                    <input
                      id="admin-passcode-input"
                      type="password"
                      autoComplete="off"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="••••••"
                      maxLength={12}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-900 text-center tracking-[0.4em] font-mono text-lg rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                    Protected by end-to-end masked authentication gate.
                  </p>
                </div>

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 text-left"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-center gap-2 font-bold"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Access Granted! Unlocking Admin Portal...</span>
                  </motion.div>
                )}

                <button
                  id="admin-submit-passcode-btn"
                  type="submit"
                  disabled={!passwordInput.trim() || isSuccess}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg shadow-sky-500/25 transition-all"
                >
                  Verify & Unlock Admin
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
