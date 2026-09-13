import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, CommentItem, AppUser } from './types';
import { INITIAL_PRODUCTS, INITIAL_COMMENTS, CATEGORIES } from './data/initialProducts';
import {
  getPublicProducts,
  createPublicProduct,
  updatePublicProduct,
  deletePublicProduct,
  toggleProductLikeOnServer,
  getPublicComments,
  postPublicComment,
} from './api';
import { subscribeToAuth, logoutUser } from './lib/firebase';
import { WelcomePage } from './components/WelcomePage';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CommentsModal } from './components/CommentsModal';
import { SavedDrawer } from './components/SavedDrawer';
import { AuthModal } from './components/AuthModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminUploadModal } from './components/AdminUploadModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { recordVisitorEvent } from './lib/visitorTracker';
import {
  SlidersHorizontal,
  Package,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  RotateCcw,
  RefreshCw,
  Globe,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Page Navigation State: 'welcome' | 'marketplace'
  const [currentPage, setCurrentPage] = useState<'welcome' | 'marketplace'>('welcome');

  // Persistence: Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('m_shopping_hub_products_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore error
    }
    return INITIAL_PRODUCTS;
  });

  // Persistence: Comments
  const [comments, setComments] = useState<CommentItem[]>(() => {
    try {
      const saved = localStorage.getItem('m_shopping_hub_comments_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore error
    }
    return INITIAL_COMMENTS;
  });

  // Persistence: User Likes (array of product IDs)
  const [likedProductIds, setLikedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('m_shopping_hub_likes_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore error
    }
    return [];
  });

  // Persistence: User Saves / Bookmarks (array of product IDs)
  const [savedProductIds, setSavedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('m_shopping_hub_saves_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore error
    }
    return [];
  });

  // Current User (Regular logged-in user)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('m_shopping_hub_user_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore error
    }
    return null;
  });

  // Admin Mode Gate (Password '420225' strictly limits role)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('m_shopping_hub_admin_v1');
      if (saved) return JSON.parse(saved) === true;
    } catch {
      // Ignore error
    }
    return false;
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'likes'>('featured');

  // Modals & Drawers State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState('');
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdminUploadOpen, setIsAdminUploadOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [activeCommentProduct, setActiveCommentProduct] = useState<Product | null>(null);
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);

  // Automatically record visitor session on load
  useEffect(() => {
    recordVisitorEvent('Home / Catalog', 'Page View', currentUser);
  }, []);

  // Server & Public Visibility Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Public Catalog from Server on Mount & Sync
  const refreshCatalog = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const [remoteProducts, remoteComments] = await Promise.all([
        getPublicProducts(),
        getPublicComments(),
      ]);
      if (remoteProducts && remoteProducts.length > 0) {
        setProducts(remoteProducts);
      }
      if (remoteComments && remoteComments.length > 0) {
        setComments(remoteComments);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Sync with public server failed, relying on local cache:', err);
      setSyncStatus('offline');
    } finally {
      if (!isSilent) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount
    refreshCatalog(true);

    // Auto-sync polling every 12 seconds so all users get newly uploaded products seamlessly
    const interval = setInterval(() => {
      refreshCatalog(true);
    }, 12000);

    // Refresh immediately when user returns to the tab or app
    const handleFocus = () => refreshCatalog(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshCatalog]);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('m_shopping_hub_products_v1', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('m_shopping_hub_comments_v1', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('m_shopping_hub_likes_v1', JSON.stringify(likedProductIds));
  }, [likedProductIds]);

  useEffect(() => {
    localStorage.setItem('m_shopping_hub_saves_v1', JSON.stringify(savedProductIds));
  }, [savedProductIds]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('m_shopping_hub_user_v1', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('m_shopping_hub_user_v1');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('m_shopping_hub_admin_v1', JSON.stringify(isAdmin));
  }, [isAdmin]);

  // Auth Protection Helper
  const requireAuth = (reason: string, callback: () => void) => {
    if (!currentUser) {
      setAuthReason(reason);
      setIsAuthOpen(true);
      return;
    }
    callback();
  };

  // Like Toggle (Requires login, syncs with server)
  const handleToggleLike = (productId: string) => {
    requireAuth('Please sign in with Google to like products and personalize recommendations.', () => {
      const isCurrentlyLiked = likedProductIds.includes(productId);
      const action = isCurrentlyLiked ? 'unlike' : 'like';

      setLikedProductIds((prev) =>
        isCurrentlyLiked ? prev.filter((id) => id !== productId) : [...prev, productId]
      );

      // Optimistic count update
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, likesCount: Math.max(0, p.likesCount + (action === 'like' ? 1 : -1)) }
            : p
        )
      );

      // Background server sync
      toggleProductLikeOnServer(productId, action).catch((err) => {
        console.warn('Background like sync failed:', err);
      });
    });
  };

  // Save Toggle (Requires login)
  const handleToggleSave = (productId: string) => {
    requireAuth('Please sign in with Google to save products to your personal wishlist.', () => {
      setSavedProductIds((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
    });
  };

  // Open Comments Modal (Viewing is open, posting prompts login)
  const handleOpenComments = (product: Product) => {
    setActiveCommentProduct(product);
  };

  // Add Comment (Requires login, persists publicly on server)
  const handleAddComment = async (productId: string, text: string) => {
    if (!currentUser) return;
    const tempId = 'comm-' + Date.now();
    const newComment: CommentItem = {
      id: tempId,
      productId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [newComment, ...prev]);

    // Update product comments count
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );

    try {
      const persistedComment = await postPublicComment({
        productId,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        text,
      });
      setComments((prev) => prev.map((c) => (c.id === tempId ? persistedComment : c)));
    } catch (err) {
      console.warn('Comment server persistence note:', err);
    }
  };

  // Admin: Save or Update Product - PUBLICLY PERSISTED TO SERVER
  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (!isAdmin) return;

    if (editingProduct) {
      const updatedLocal: Product = {
        ...editingProduct,
        ...productData,
      } as Product;

      // Optimistically update
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? updatedLocal : p))
      );
      setEditingProduct(null);

      try {
        const persisted = await updatePublicProduct(editingProduct.id, productData);
        setProducts((prev) =>
          prev.map((p) => (p.id === persisted.id ? persisted : p))
        );
        setToastMessage(`Product "${persisted.title}" updated & publicly visible to all visitors!`);
      } catch (err) {
        console.error('Error updating product on server:', err);
        setToastMessage(`Product updated locally. Server will sync on next refresh.`);
      }
    } else {
      const tempId = 'prod-' + Date.now();
      const newProduct: Product = {
        id: tempId,
        title: productData.title || 'Untitled Product',
        description: productData.description || '',
        price: productData.price || 0,
        originalPrice: productData.originalPrice,
        currency: productData.currency || '$',
        category: productData.category || 'Tech & Audio',
        imageUrl:
          productData.imageUrl ||
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        directPurchaseUrl: productData.directPurchaseUrl || '#',
        likesCount: 0,
        savesCount: 0,
        commentsCount: 0,
        featured: true,
        createdAt: new Date().toISOString(),
      };

      // Optimistically add to top of list
      setProducts((prev) => [newProduct, ...prev]);

      try {
        const published = await createPublicProduct(newProduct);
        setProducts((prev) =>
          prev.map((p) => (p.id === tempId ? published : p))
        );
        setToastMessage(`Product "${published.title}" published! It is now publicly visible to all visitors after deployment.`);
      } catch (err) {
        console.error('Error creating product on server:', err);
        setToastMessage(`Product created locally. Check connection to sync publicly.`);
      }
    }
  };

  // Admin: Delete Product - REMOVED PUBLICLY FROM SERVER
  const handleDeleteProduct = async (productId: string) => {
    if (!isAdmin) return;
    if (
      window.confirm(
        'Are you sure you want to remove this product from the marketplace? It will be removed for all public visitors across all devices.'
      )
    ) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setSavedProductIds((prev) => prev.filter((id) => id !== productId));
      setLikedProductIds((prev) => prev.filter((id) => id !== productId));

      try {
        await deletePublicProduct(productId);
        setToastMessage('Product removed from the public marketplace.');
      } catch (err) {
        console.error('Error deleting product from server:', err);
      }
    }
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'All Products' || p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch =
          !searchQuery.trim() ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'likes') return b.likesCount - a.likesCount;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const savedProducts = useMemo(() => {
    return products.filter((p) => savedProductIds.includes(p.id));
  }, [products, savedProductIds]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* 1. Welcome Page View */}
      {currentPage === 'welcome' ? (
        <WelcomePage
          onStartShopping={() => setCurrentPage('marketplace')}
          onOpenAdminLogin={() => setIsAdminAuthOpen(true)}
          isAdmin={isAdmin}
        />
      ) : (
        /* 2. Main Product Marketplace View */
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Responsive Header Navigation */}
          <Navbar
            currentUser={currentUser}
            savedCount={savedProductIds.length}
            isAdmin={isAdmin}
            onOpenAuth={() => {
              setAuthReason('Sign in with Google to personalize your experience, like products, and save items.');
              setIsAuthOpen(true);
            }}
            onLogoutUser={() => {
              logoutUser().catch(() => {});
              setCurrentUser(null);
            }}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            onOpenAdminUpload={() => {
              setEditingProduct(null);
              setIsAdminUploadOpen(true);
            }}
            onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
            onOpenSavedDrawer={() => setIsSavedDrawerOpen(true)}
            onBackToWelcome={() => setCurrentPage('welcome')}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Marketplace Content Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
            {/* Top Banner with Brand Logo and Animated Girl in Background, Text preserved */}
            <HeroBanner
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categories={CATEGORIES}
            />

            {/* Admin Management Status Bar (Visible ONLY to Admin) */}
            {isAdmin && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-sky-800">
                        Admin Control Center
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Public Deployment Sync Active
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-700 rounded-full">
                        Authorized (PIN 420225)
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 mt-0.5 block">
                      Uploaded products are stored on the server and immediately visible to all public visitors after deployment.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    id="admin-sync-catalog-btn"
                    onClick={() => refreshCatalog(false)}
                    disabled={isSyncing}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    title="Refresh and sync latest public catalog from server"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Catalog'}</span>
                  </button>
                  <button
                    id="admin-bar-upload-btn"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsAdminUploadOpen(true);
                    }}
                    className="flex-1 md:flex-none px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Upload New Product</span>
                  </button>
                  <button
                    onClick={() => setIsAdmin(false)}
                    className="px-3 py-2 bg-white text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Lock Admin
                  </button>
                </div>
              </div>
            )}

            {/* Catalog Toolbar: Results Count & Sorting */}
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {selectedCategory}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  ({filteredProducts.length} items)
                </span>
                {searchQuery && (
                  <span className="hidden sm:inline-block text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-200">
                    Matching "{searchQuery}"
                  </span>
                )}
              </div>

              {/* Sorting Filter & Quick Sync */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshCatalog(false)}
                  disabled={isSyncing}
                  title="Check for newly published products"
                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-600' : ''}`} />
                </button>
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  id="catalog-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="likes">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Product Grid: HIGHLY OPTIMIZED FOR MOBILE - Exactly TWO product cards per row on small screens */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isLiked={likedProductIds.includes(product.id)}
                    isSaved={savedProductIds.includes(product.id)}
                    onToggleLike={handleToggleLike}
                    onToggleSave={handleToggleSave}
                    onOpenComments={handleOpenComments}
                    onProductClick={setActiveDetailProduct}
                    isAdmin={isAdmin}
                    onEditProduct={(p) => {
                      setEditingProduct(p);
                      setIsAdminUploadOpen(true);
                    }}
                    onDeleteProduct={handleDeleteProduct}
                  />
                ))}
              </div>
            ) : (
              /* Empty Search State */
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  Try adjusting your keywords or clearing the category filter to explore more items.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Products');
                  }}
                  className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </main>

          {/* Marketplace Footer */}
          <footer className="mt-12 border-t border-slate-200 bg-white py-8 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="M Shopping Hub"
                  className="w-8 h-8 rounded-full object-cover border border-sky-200"
                />
                <div>
                  <span className="font-bold text-slate-800 block">M Shopping Hub</span>
                  <span className="text-[11px] text-slate-400">Direct Purchase Platform</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => setCurrentPage('welcome')}
                  className="hover:text-sky-600 transition-colors"
                >
                  Welcome Screen
                </button>
                <button
                  onClick={() => setIsSavedDrawerOpen(true)}
                  className="hover:text-sky-600 transition-colors"
                >
                  Saved Items ({savedProductIds.length})
                </button>
                <button
                  onClick={() => setIsAdminAuthOpen(true)}
                  className="hover:text-sky-600 transition-colors font-semibold text-slate-700"
                >
                  {isAdmin ? 'Admin Active' : 'Admin Gate'}
                </button>
              </div>

              <p className="text-[11px]">
                © 2026 M Shopping Hub. All "Buy Now" links redirect to official brand stores.
              </p>
            </div>
          </footer>
        </div>
      )}

      {/* Global Modals & Drawers */}
      {/* 1. Comments Drawer / Modal */}
      <CommentsModal
        isOpen={Boolean(activeCommentProduct)}
        onClose={() => setActiveCommentProduct(null)}
        product={activeCommentProduct}
        comments={comments}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onPromptLogin={(reason) => {
          setAuthReason(reason);
          setIsAuthOpen(true);
        }}
      />

      {/* 2. Product Detail Modal */}
      <ProductDetailModal
        isOpen={Boolean(activeDetailProduct)}
        onClose={() => setActiveDetailProduct(null)}
        product={activeDetailProduct}
        isLiked={activeDetailProduct ? likedProductIds.includes(activeDetailProduct.id) : false}
        isSaved={activeDetailProduct ? savedProductIds.includes(activeDetailProduct.id) : false}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
        onOpenComments={handleOpenComments}
      />

      {/* 3. User Google Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        actionReason={authReason}
      />

      {/* 4. Admin Auth Gate (Masked passcode '420225') */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        isAdmin={isAdmin}
        onAdminLoginSuccess={() => {
          setIsAdmin(true);
        }}
        onAdminLogout={() => {
          setIsAdmin(false);
        }}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      {/* 5. Admin Visitors & Analytics Dashboard (Strictly Admin only) */}
      {isAdmin && (
        <AdminDashboardModal
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
          products={products}
          onOpenUploadProduct={() => {
            setEditingProduct(null);
            setIsAdminUploadOpen(true);
          }}
        />
      )}

      {/* 6. Admin Upload / Edit Product Modal (Strictly Admin only) */}
      <AdminUploadModal
        isOpen={isAdminUploadOpen}
        onClose={() => {
          setIsAdminUploadOpen(false);
          setEditingProduct(null);
        }}
        onSaveProduct={handleSaveProduct}
        editingProduct={editingProduct}
      />

      {/* 6. Saved / Wishlist Drawer */}
      <SavedDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedProducts={savedProducts}
        onRemoveSave={(id) => setSavedProductIds((prev) => prev.filter((pId) => pId !== id))}
      />

      {/* Floating Public Deployment Sync Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-sky-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-white block">Public Marketplace Updated</span>
            <span className="text-slate-300">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
