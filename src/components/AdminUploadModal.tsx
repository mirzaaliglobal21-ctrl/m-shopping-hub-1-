import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Link2,
  DollarSign,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Loader2,
  Wand2,
} from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../data/initialProducts';
import { extractProductFromLink } from '../api';

interface AdminUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: Partial<Product>) => void;
  editingProduct?: Product | null;
}

const PRESET_IMAGES = [
  { label: 'Smart Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80' },
  { label: 'Designer Bag', url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sunglasses', url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Luxury Perfume', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80' },
];

export const AdminUploadModal: React.FC<AdminUploadModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  editingProduct,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [currency, setCurrency] = useState('$');
  const [category, setCategory] = useState('Tech & Audio');
  const [imageUrl, setImageUrl] = useState('');
  const [directPurchaseUrl, setDirectPurchaseUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');

  // Magic Affiliate Auto-Extract state
  const [affiliateLinkInput, setAffiliateLinkInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccessMsg, setExtractSuccessMsg] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title);
      setDescription(editingProduct.description);
      setPrice(editingProduct.price.toString());
      setOriginalPrice(editingProduct.originalPrice ? editingProduct.originalPrice.toString() : '');
      setCurrency(editingProduct.currency || '$');
      setCategory(editingProduct.category);
      setImageUrl(editingProduct.imageUrl);
      setImagePreview(editingProduct.imageUrl);
      setDirectPurchaseUrl(editingProduct.directPurchaseUrl);
      setAffiliateLinkInput(editingProduct.directPurchaseUrl);
    } else {
      resetForm();
    }
  }, [editingProduct, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setCurrency('$');
    setCategory('Tech & Audio');
    setImageUrl('');
    setImagePreview('');
    setDirectPurchaseUrl('');
    setAffiliateLinkInput('');
    setError('');
    setExtractSuccessMsg('');
    setIsExtracting(false);
  };

  // Magic Auto-Extract handler
  const handleAutoExtract = async (linkToUse?: string) => {
    const target = (linkToUse || affiliateLinkInput).trim();
    if (!target) {
      setError('Please paste a product or affiliate link first (e.g. AliExpress, Amazon, Daraz, etc.)');
      return;
    }
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      setError('Link must start with http:// or https://');
      return;
    }

    setIsExtracting(true);
    setError('');
    setExtractSuccessMsg('');

    try {
      const data = await extractProductFromLink(target, '420225');

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.price !== undefined && data.price > 0) setPrice(data.price.toString());
      if (data.originalPrice) setOriginalPrice(data.originalPrice.toString());
      if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        setImagePreview(data.imageUrl);
      }
      if (data.currency) setCurrency(data.currency);
      setDirectPurchaseUrl(target);
      setAffiliateLinkInput(target);

      setExtractSuccessMsg(
        `✨ Details extracted! Title, Price (${data.currency || '$'}${data.price}), Image & Category auto-populated below.`
      );
    } catch (err: any) {
      console.error('Auto extract error:', err);
      setError(err.message || 'Could not auto-fetch from this link. You can still fill the fields manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageUrl(base64String);
        setImagePreview(base64String);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a product title');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    if (!imageUrl.trim()) {
      setError('Please upload or select an image for this product');
      return;
    }
    if (!directPurchaseUrl.trim()) {
      setError('Please specify the direct purchase store URL');
      return;
    }

    onSaveProduct({
      title: title.trim(),
      description: description.trim() || 'Premium curated product with authentic direct store link.',
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      category,
      imageUrl: imageUrl.trim(),
      directPurchaseUrl: directPurchaseUrl.trim(),
      currency: currency || '$',
    });

    onClose();
  };

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
            {/* Close Button */}
            <button
              id="close-admin-upload-modal-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100/80 text-sky-800 text-xs font-bold rounded-full">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Admin Exclusive Portal</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Publicly Visible After Deployment</span>
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-['Outfit',sans-serif]">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Product to Marketplace'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Upload items with authentic direct purchase links. Products are stored on the server and immediately visible to all visitors.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ⚡ Magic Auto-Fill from Affiliate / Product Link (ADMIN EXCLUSIVE) */}
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-sky-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Magic Auto-Fill from Link</span>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full border border-amber-200">
                        Admin Only
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      بس پروڈکٹ یا ایفلی ایٹ لنک ڈالیں — ٹائٹل، قیمت، تصویر، ڈسکرپشن سب خودکار آ جائے گا!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="admin-affiliate-autofill-input"
                    type="url"
                    value={affiliateLinkInput}
                    onChange={(e) => setAffiliateLinkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAutoExtract();
                      }
                    }}
                    placeholder="Paste store/affiliate link (AliExpress, Amazon, Daraz, eBay, Shopify...)"
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium placeholder:text-slate-400"
                  />
                </div>

                <button
                  id="admin-auto-fetch-btn"
                  type="button"
                  disabled={isExtracting || !affiliateLinkInput.trim()}
                  onClick={() => handleAutoExtract()}
                  className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Fetching details...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-amber-300" />
                      <span>Auto-Fetch Details</span>
                    </>
                  )}
                </button>
              </div>

              {extractSuccessMsg && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{extractSuccessMsg}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product Title *
                </label>
                <input
                  id="admin-product-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Apple iPad Air 11-inch M2"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
                  required
                />
              </div>

              {/* Category & Pricing Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    id="admin-product-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
                  >
                    {CATEGORIES.filter((c) => c !== 'All Products').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Price ({currency}) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">Currency: {currency}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currency}
                    </span>
                    <input
                      id="admin-product-price-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="99.99"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Original Price ({currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currency}
                    </span>
                    <input
                      id="admin-product-original-price-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="129.99"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Purchase Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Direct Purchase Store Link *</span>
                  <span className="text-[10px] text-sky-600 font-semibold normal-case">Affiliate or official store URL</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="admin-product-direct-link-input"
                      type="url"
                      value={directPurchaseUrl}
                      onChange={(e) => {
                        setDirectPurchaseUrl(e.target.value);
                        if (!affiliateLinkInput) setAffiliateLinkInput(e.target.value);
                      }}
                      placeholder="https://www.brandstore.com/product/item-link"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    title="Auto-fetch all fields using this link"
                    disabled={isExtracting || !directPurchaseUrl.trim().startsWith('http')}
                    onClick={() => handleAutoExtract(directPurchaseUrl)}
                    className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span className="hidden sm:inline">Auto-Fetch</span>
                  </button>
                </div>
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  id="admin-product-description-textarea"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key features, craftsmanship details, dimensions, warranty highlights..."
                  className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>

              {/* Product Image Source (Upload, Preset, or URL) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product Image *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  {/* File Upload Box */}
                  <div className="border-2 border-dashed border-sky-200 rounded-2xl p-4 text-center hover:bg-sky-50/50 transition-colors relative cursor-pointer">
                    <input
                      id="admin-product-image-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 mx-auto text-sky-500 mb-1" />
                    <span className="block text-xs font-bold text-slate-700">Click to upload image</span>
                    <span className="block text-[10px] text-slate-400">PNG, JPG, WebP up to 5MB</span>
                  </div>

                  {/* Image Preview / URL input */}
                  <div>
                    <input
                      id="admin-product-image-url-input"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="Or paste image URL here"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl mb-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    {imagePreview ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                          Preview
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-xs">
                        <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                        <span>No image preview</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preset Fast Selection */}
                <div className="mt-2.5">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Quick Preset Images:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setImagePreview(preset.url);
                        }}
                        className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-sky-100 hover:text-sky-700 rounded-lg text-slate-700 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="admin-save-product-submit-btn"
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg shadow-sky-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingProduct ? 'Update Product' : 'Publish Product'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
