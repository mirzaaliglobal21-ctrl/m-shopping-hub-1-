import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Bookmark,
  PlusCircle,
  ShieldCheck,
  Lock,
  BarChart3,
  User as UserIcon,
  LogOut,
  Sparkles,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { AppUser } from '../types';

interface NavbarProps {
  currentUser: AppUser | null;
  savedCount: number;
  isAdmin: boolean;
  onOpenAuth: () => void;
  onLogoutUser: () => void;
  onOpenAdminAuth: () => void;
  onOpenAdminUpload: () => void;
  onOpenAdminDashboard: () => void;
  onOpenSavedDrawer: () => void;
  onBackToWelcome: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  savedCount,
  isAdmin,
  onOpenAuth,
  onLogoutUser,
  onOpenAdminAuth,
  onOpenAdminUpload,
  onOpenAdminDashboard,
  onOpenSavedDrawer,
  onBackToWelcome,
  searchQuery,
  onSearchChange,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={onBackToWelcome}>
          <div className="relative">
            <img
              src="/logo.png"
              alt="M Shopping Hub"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-sky-400/50 shadow-md bg-white"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-xl text-slate-900 tracking-tight font-['Outfit',sans-serif]">
                M Shopping Hub
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-700 rounded-md">
                Direct
              </span>
            </div>
            <span className="text-[10px] text-sky-600 block font-semibold">
              Welcome from Raza
            </span>
          </div>
        </div>

        {/* Center: Desktop Search Input */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="navbar-desktop-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products by title or keyword..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            className="p-2 md:hidden text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Toggle search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Welcome Screen Back Button */}
          <button
            id="nav-welcome-home-btn"
            onClick={onBackToWelcome}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 hover:bg-sky-50/70 rounded-xl transition-colors"
            title="Return to Welcome Page"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          {/* Wishlist / Saved Button with counter */}
          <button
            id="nav-saved-items-btn"
            onClick={onOpenSavedDrawer}
            className="relative p-2 sm:px-3 sm:py-2 text-slate-700 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors flex items-center gap-1.5"
            title="View saved items"
          >
            <Bookmark className="w-5 h-5" />
            <span className="hidden sm:inline-block text-xs font-bold">Saved</span>
            {savedCount > 0 && (
              <span className="sm:relative sm:top-0 sm:right-0 absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-black bg-sky-600 text-white rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          {/* Admin Exclusive: Visitor Analytics Dashboard */}
          {isAdmin && (
            <button
              id="admin-dashboard-nav-btn"
              onClick={onOpenAdminDashboard}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Admin: Visitors & Traffic Dashboard"
            >
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Dashboard</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}

          {/* Admin Exclusive: Upload Product Button (Strictly hidden from public users) */}
          {isAdmin && (
            <button
              id="admin-upload-product-nav-btn"
              onClick={onOpenAdminUpload}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              title="Admin: Upload New Product"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Product</span>
            </button>
          )}

          {/* Admin Role Status / Gate Button */}
          <button
            id="nav-admin-gate-btn"
            onClick={onOpenAdminAuth}
            className={`p-2 sm:px-3 sm:py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-white text-slate-600 hover:text-sky-600 hover:bg-slate-50 border-slate-200'
            }`}
            title={isAdmin ? 'Admin mode active' : 'Admin passcode gate'}
          >
            {isAdmin ? <ShieldCheck className="w-4 h-4 text-sky-600" /> : <Lock className="w-4 h-4" />}
            <span className="hidden sm:inline-block">{isAdmin ? 'Admin' : 'Admin Gate'}</span>
          </button>

          {/* User Profile / "Continue with Google" */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-sky-300"
              />
              <span className="hidden md:inline-block text-xs font-bold text-slate-800 max-w-[90px] truncate">
                {currentUser.name}
              </span>
              <button
                onClick={onLogoutUser}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="nav-login-google-btn"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              {/* Google G icon mini */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#fff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 sm:hidden text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {showSearchInput && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden px-4 py-3 border-t border-slate-100 bg-white space-y-2">
          <button
            onClick={() => {
              onBackToWelcome();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            <Home className="w-4 h-4 text-sky-600" />
            <span>Welcome Intro</span>
          </button>

          <button
            onClick={() => {
              onOpenSavedDrawer();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-sky-600" />
              <span>Saved Items</span>
            </div>
            {savedCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-600 text-white rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => {
                  onOpenAdminDashboard();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <span>Visitors & Analytics Dashboard</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              <button
                onClick={() => {
                  onOpenAdminUpload();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Upload New Product (Admin)</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              onOpenAdminAuth();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            <Lock className="w-4 h-4 text-sky-600" />
            <span>{isAdmin ? 'Admin Status (Active)' : 'Admin Security Gate'}</span>
          </button>
        </div>
      )}
    </header>
  );
};
