import { Product, CommentItem } from './types';
import { INITIAL_PRODUCTS, INITIAL_COMMENTS } from './data/initialProducts';
import {
  fetchProductsFromFirestore,
  saveProductToFirestore,
  updateProductInFirestore,
  deleteProductFromFirestore,
  fetchCommentsFromFirestore,
  addCommentToFirestore,
} from './lib/firebase';

const API_BASE = '/api';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// 1. Fetch public products from Firestore (with server & localStorage fallback)
export async function getPublicProducts(): Promise<Product[]> {
  // First attempt: Cloud Firestore
  try {
    const firestoreProducts = await fetchProductsFromFirestore();
    if (firestoreProducts && firestoreProducts.length > 0) {
      try {
        localStorage.setItem('m_shopping_hub_products_v1', JSON.stringify(firestoreProducts));
      } catch {
        // ignore
      }
      return firestoreProducts;
    }
  } catch (err) {
    console.warn('Firestore products fetch error, trying backend server:', err);
  }

  // Second attempt: Express Server API
  try {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { credentials: 'omit' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.products) && data.products.length > 0) {
        // If Firestore was empty, seed Firestore in the background
        data.products.forEach((p: Product) => {
          saveProductToFirestore(p).catch(() => {});
        });
        try {
          localStorage.setItem('m_shopping_hub_products_v1', JSON.stringify(data.products));
        } catch {
          // ignore
        }
        return data.products;
      }
    }
  } catch (err) {
    console.warn('API getPublicProducts failed, falling back to cached local storage:', err);
  }

  // Third attempt: Fallback to local cache or default catalog
  try {
    const cached = localStorage.getItem('m_shopping_hub_products_v1');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore parse error
  }

  // Seed default catalog to Firestore so all users get it
  INITIAL_PRODUCTS.forEach((p) => {
    saveProductToFirestore(p).catch(() => {});
  });

  return INITIAL_PRODUCTS;
}

// 2. Upload / Create new product to Firestore and public server
export async function createPublicProduct(productData: Partial<Product>): Promise<Product> {
  let createdProduct: Product | null = null;

  // 1. Send to server to handle local storage and asset saving
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.product) {
        createdProduct = data.product;
      }
    }
  } catch (err) {
    console.warn('Server product create warning:', err);
  }

  // If server didn't construct the product, build standard product object
  if (!createdProduct) {
    createdProduct = {
      id: 'prod-' + Date.now(),
      title: productData.title || 'Featured Product',
      description: productData.description || '',
      price: Number(productData.price) || 0,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
      currency: productData.currency || '$',
      category: productData.category || 'Trending Deals',
      imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      directPurchaseUrl: productData.directPurchaseUrl || '#',
      likesCount: 0,
      savesCount: 0,
      commentsCount: 0,
      featured: Boolean(productData.featured),
      createdAt: new Date().toISOString(),
    };
  }

  // 2. Persist to Cloud Firestore for permanent global syncing
  await saveProductToFirestore(createdProduct);

  return createdProduct;
}

// 3. Update existing product in Firestore and server
export async function updatePublicProduct(id: string, productData: Partial<Product>): Promise<Product> {
  let updatedProduct: Product | null = null;

  // Update in Firestore
  await updateProductInFirestore(id, productData);

  // Update on server
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.product) {
        updatedProduct = data.product;
      }
    }
  } catch (err) {
    console.warn(`Server update warning for ${id}:`, err);
  }

  if (updatedProduct) {
    return updatedProduct;
  }

  return productData as Product;
}

// 4. Delete product from Firestore and server
export async function deletePublicProduct(id: string): Promise<boolean> {
  // Delete from Cloud Firestore
  await deleteProductFromFirestore(id);

  // Delete from server
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.success);
    }
  } catch (err) {
    console.warn(`Server delete warning for ${id}:`, err);
  }

  return true;
}

// 5. Sync product like toggle to Firestore & server
export async function toggleProductLikeOnServer(id: string, action: 'like' | 'unlike'): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.likesCount !== undefined) {
        // Also update Firestore in background
        updateProductInFirestore(id, { likesCount: data.likesCount }).catch(() => {});
        return data.likesCount;
      }
    }
  } catch {
    // Expected on static hosting like Vercel
  }

  // Fallback for Vercel / serverless: update Firestore directly
  try {
    const cached = localStorage.getItem('m_shopping_hub_products_v1');
    if (cached) {
      const parsed: Product[] = JSON.parse(cached);
      const target = parsed.find((p) => p.id === id);
      if (target) {
        const newCount = Math.max(0, (target.likesCount || 0) + (action === 'like' ? 1 : -1));
        updateProductInFirestore(id, { likesCount: newCount }).catch(() => {});
        return newCount;
      }
    }
  } catch {
    // Ignore fallback errors
  }

  return null;
}

// 6. Fetch public comments from Firestore (with fallback)
export async function getPublicComments(): Promise<CommentItem[]> {
  try {
    const firestoreComments = await fetchCommentsFromFirestore();
    if (firestoreComments && firestoreComments.length > 0) {
      try {
        localStorage.setItem('m_shopping_hub_comments_v1', JSON.stringify(firestoreComments));
      } catch {
        // ignore
      }
      return firestoreComments;
    }
  } catch (err) {
    console.warn('Firestore comments fetch error:', err);
  }

  try {
    const res = await fetch(`${API_BASE}/comments`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.comments)) {
        try {
          localStorage.setItem('m_shopping_hub_comments_v1', JSON.stringify(data.comments));
        } catch {
          // ignore
        }
        return data.comments;
      }
    }
  } catch (err) {
    console.warn('Fetch comments failed, falling back:', err);
  }

  try {
    const cached = localStorage.getItem('m_shopping_hub_comments_v1');
    if (cached) return JSON.parse(cached);
  } catch {
    // ignore
  }

  return INITIAL_COMMENTS;
}

// 7. Post comment to Firestore and server
export async function postPublicComment(comment: {
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
}): Promise<CommentItem> {
  const newComment: CommentItem = {
    id: 'comm-' + Date.now(),
    productId: comment.productId,
    userId: comment.userId,
    userName: comment.userName,
    userAvatar: comment.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    text: comment.text,
    createdAt: new Date().toISOString(),
  };

  // Save to Cloud Firestore
  await addCommentToFirestore(newComment);

  // Also send to server
  fetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newComment),
  }).catch(() => {});

  return newComment;
}

// 8. Admin Reset Default Products
export async function resetDefaultProductsApi(passcode: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/admin/reset-default-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });

  if (!res.ok) {
    throw new Error('Failed to reset products catalog');
  }

  const data = await res.json();
  if (Array.isArray(data.products)) {
    // Sync each to Firestore
    data.products.forEach((p: Product) => {
      saveProductToFirestore(p).catch(() => {});
    });
    return data.products;
  }

  return INITIAL_PRODUCTS;
}
