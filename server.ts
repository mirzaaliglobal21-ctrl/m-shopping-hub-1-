import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, INITIAL_COMMENTS } from './src/data/initialProducts';
import { Product, CommentItem } from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

// Ensure data directory exists
function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// In-Memory fallback & persistent store
let productsStore: Product[] = [];
let commentsStore: CommentItem[] = [];

// Load products from storage or initialize with defaults
function loadInitialData() {
  ensureDataDirectory();

  // 1. Products
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        productsStore = parsed;
        console.log(`Loaded ${productsStore.length} products from persistent storage.`);
      } else {
        productsStore = [...INITIAL_PRODUCTS];
        saveProductsToDisk();
      }
    } else {
      productsStore = [...INITIAL_PRODUCTS];
      saveProductsToDisk();
      console.log(`Initialized persistent storage with ${productsStore.length} default products.`);
    }
  } catch (err) {
    console.error('Error loading products.json, falling back to defaults:', err);
    productsStore = [...INITIAL_PRODUCTS];
  }

  // 2. Comments
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      const data = fs.readFileSync(COMMENTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        commentsStore = parsed;
      } else {
        commentsStore = [...INITIAL_COMMENTS];
        saveCommentsToDisk();
      }
    } else {
      commentsStore = [...INITIAL_COMMENTS];
      saveCommentsToDisk();
    }
  } catch (err) {
    console.error('Error loading comments.json:', err);
    commentsStore = [...INITIAL_COMMENTS];
  }
}

// Save products to disk safely
function saveProductsToDisk() {
  try {
    ensureDataDirectory();
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(productsStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist products to disk:', err);
  }
}

// Save comments to disk safely
function saveCommentsToDisk() {
  try {
    ensureDataDirectory();
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(commentsStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist comments to disk:', err);
  }
}

// Convert base64 data URIs into lightweight public asset files to keep database fast & small
function processBase64Image(imageUrl?: string): string {
  if (!imageUrl || !imageUrl.startsWith('data:image/')) {
    return imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
  }
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const matches = imageUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (matches) {
      let ext = matches[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      const filename = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const buffer = Buffer.from(matches[2], 'base64');
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      console.log(`Saved uploaded image to public asset: /uploads/${filename} (${buffer.length} bytes)`);
      return `/uploads/${filename}`;
    }
  } catch (err) {
    console.error('Failed to write base64 image to public/uploads:', err);
  }
  return imageUrl;
}

async function startServer() {
  loadInitialData();

  const app = express();

  // Body parsers: allow up to 50MB for uploaded product images (base64)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      productsCount: productsStore.length,
      commentsCount: commentsStore.length,
    });
  });

  // Admin Passcode Verification Endpoint
  app.post('/api/admin/verify', (req, res) => {
    const { passcode } = req.body;
    if (passcode === '420225') {
      res.json({ success: true, message: 'Admin authorized' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid administrative passcode' });
    }
  });

  // GET /api/products - Publicly accessible for ALL users and visitors
  app.get('/api/products', (req, res) => {
    res.json({
      success: true,
      products: productsStore,
      total: productsStore.length,
    });
  });

  // GET /api/products/:id - Single product details
  app.get('/api/products/:id', (req, res) => {
    const product = productsStore.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  });

  // POST /api/products - Admin creates new product
  // Persists to server storage so that EVERY visitor after deployment sees it publicly!
  app.post('/api/products', (req, res) => {
    const productData = req.body;

    if (!productData.title || !productData.price) {
      return res.status(400).json({ success: false, message: 'Title and price are required' });
    }

    const newProduct: Product = {
      id: productData.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: productData.title.trim(),
      description: productData.description?.trim() || '',
      price: Number(productData.price) || 0,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
      currency: productData.currency || '$',
      category: productData.category || 'Tech & Audio',
      imageUrl: processBase64Image(productData.imageUrl),
      directPurchaseUrl: productData.directPurchaseUrl?.trim() || '#',
      likesCount: Number(productData.likesCount) || 0,
      savesCount: Number(productData.savesCount) || 0,
      commentsCount: Number(productData.commentsCount) || 0,
      featured: Boolean(productData.featured),
      createdAt: productData.createdAt || new Date().toISOString(),
    };

    // Prepend new product so it appears at the top of the marketplace
    productsStore = [newProduct, ...productsStore];
    saveProductsToDisk();

    console.log(`[Admin] Successfully created and published product "${newProduct.title}" (ID: ${newProduct.id})`);
    res.status(201).json({
      success: true,
      message: 'Product created and published publicly',
      product: newProduct,
    });
  });

  // PUT /api/products/:id - Admin updates existing product
  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const productIndex = productsStore.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const current = productsStore[productIndex];
    const updateData = req.body;

    const updatedProduct: Product = {
      ...current,
      ...updateData,
      id: current.id, // Preserve ID
      imageUrl: updateData.imageUrl ? processBase64Image(updateData.imageUrl) : current.imageUrl,
      price: updateData.price !== undefined ? Number(updateData.price) : current.price,
      originalPrice:
        updateData.originalPrice !== undefined
          ? updateData.originalPrice
            ? Number(updateData.originalPrice)
            : undefined
          : current.originalPrice,
    };

    productsStore[productIndex] = updatedProduct;
    saveProductsToDisk();

    console.log(`[Admin] Successfully updated product "${updatedProduct.title}" (ID: ${id})`);
    res.json({
      success: true,
      message: 'Product updated publicly',
      product: updatedProduct,
    });
  });

  // DELETE /api/products/:id - Admin deletes product
  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = productsStore.length;
    productsStore = productsStore.filter((p) => p.id !== id);

    if (productsStore.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Also clean up associated comments
    commentsStore = commentsStore.filter((c) => c.productId !== id);
    saveProductsToDisk();
    saveCommentsToDisk();

    console.log(`[Admin] Deleted product ID: ${id}`);
    res.json({
      success: true,
      message: 'Product removed publicly',
      id,
    });
  });

  // POST /api/products/:id/like - Like toggle increment/decrement
  app.post('/api/products/:id/like', (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'like' | 'unlike'
    const product = productsStore.find((p) => p.id === id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (action === 'like') {
      product.likesCount += 1;
    } else if (action === 'unlike' && product.likesCount > 0) {
      product.likesCount -= 1;
    }

    saveProductsToDisk();
    res.json({ success: true, likesCount: product.likesCount });
  });

  // GET /api/comments - Get all comments or for specific product
  app.get('/api/comments', (req, res) => {
    const { productId } = req.query;
    if (productId) {
      const filtered = commentsStore.filter((c) => c.productId === productId);
      return res.json({ success: true, comments: filtered });
    }
    res.json({ success: true, comments: commentsStore });
  });

  // POST /api/comments - Add user comment
  app.post('/api/comments', (req, res) => {
    const { productId, userId, userName, userAvatar, text } = req.body;

    if (!productId || !text?.trim()) {
      return res.status(400).json({ success: false, message: 'Product ID and text are required' });
    }

    const newComment: CommentItem = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId,
      userId: userId || 'anonymous',
      userName: userName || 'Customer',
      userAvatar: userAvatar || undefined,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    commentsStore = [newComment, ...commentsStore];

    // Increment comment count on product
    const product = productsStore.find((p) => p.id === productId);
    if (product) {
      product.commentsCount += 1;
      saveProductsToDisk();
    }

    saveCommentsToDisk();
    res.status(201).json({ success: true, comment: newComment });
  });

  // Reset to default initial products (Admin utility)
  app.post('/api/admin/reset-default-products', (req, res) => {
    const { passcode } = req.body;
    if (passcode !== '420225') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    productsStore = [...INITIAL_PRODUCTS];
    saveProductsToDisk();
    res.json({
      success: true,
      message: 'Catalog reset to default products',
      products: productsStore,
    });
  });

  // Serve static assets from /public folder (e.g., uploaded product photos)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`M Shopping Hub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
