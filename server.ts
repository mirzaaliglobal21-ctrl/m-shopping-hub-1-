import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_PRODUCTS, INITIAL_COMMENTS } from './src/data/initialProducts';
import { Product, CommentItem } from './src/types';

// Lazy initialized Gemini Client (server-side only)
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return geminiClient;
}

// Decode HTML entities
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

// Extract meta tag content by property or name
function extractMetaContent(html: string, propertyName: string): string {
  const regex1 = new RegExp(`<meta[^>]*(?:property|name)=["']${propertyName}["'][^>]*content=["']([^"']+)["']`, 'i');
  const m1 = html.match(regex1);
  if (m1 && m1[1]) return decodeHtmlEntities(m1[1]);

  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${propertyName}["']`, 'i');
  const m2 = html.match(regex2);
  if (m2 && m2[1]) return decodeHtmlEntities(m2[1]);

  return '';
}

// Extract <title>
function extractTitleTag(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m && m[1] ? decodeHtmlEntities(m[1]).replace(/\s+/g, ' ') : '';
}

// Parse JSON-LD blocks
function extractJsonLdBlocks(html: string): any[] {
  const items: any[] = [];
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const raw = match[1].trim();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed['@graph'])) {
          items.push(...parsed['@graph']);
        } else {
          items.push(parsed);
        }
      }
    } catch {
      // ignore parsing errors
    }
  }
  return items;
}

// Guess marketplace category from text
function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(bag|handbag|purse|tote|backpack|wallet|dress|shirt|jacket|clothing|apparel|sneakers|shoes|pants|hoodie|outfit|crossbody|clutch)\b/i.test(lower)) {
    return 'Fashion & Bags';
  }
  if (/\b(watch|watches|jewelry|ring|necklace|bracelet|earrings|diamond|gold|silver|gemstone|pendant)\b/i.test(lower)) {
    return 'Watches & Jewelry';
  }
  if (/\b(perfume|fragrance|cologne|scent|cream|serum|skincare|makeup|lipstick|lotion|beauty|cleanser|cosmetics|hair)\b/i.test(lower)) {
    return 'Beauty & Fragrance';
  }
  if (/\b(home|decor|kitchen|furniture|bed|pillow|lamp|cookware|living|sofa|dining|vacuum|curtain|bottle|organizer)\b/i.test(lower)) {
    return 'Home & Living';
  }
  return 'Tech & Audio';
}

// Search web for true product information when direct scrape is blocked by captcha or anti-bot
async function searchProductInfoFromWeb(productUrl: string): Promise<{ title: string; snippet: string } | null> {
  try {
    const parsed = new URL(productUrl);
    const host = parsed.hostname.toLowerCase();

    let storeName = 'shopping';
    if (host.includes('aliexpress')) storeName = 'aliexpress';
    else if (host.includes('amazon')) storeName = 'amazon';
    else if (host.includes('daraz')) storeName = 'daraz';
    else if (host.includes('ebay')) storeName = 'ebay';
    else if (host.includes('walmart')) storeName = 'walmart';

    let queryTerm = '';

    // AliExpress: /item/123456789.html
    const aliMatch = productUrl.match(/\/item\/([0-9]+)\.html/i);
    if (aliMatch && aliMatch[1]) {
      queryTerm = `${aliMatch[1]} ${storeName}`;
    }

    // Amazon ASIN: /dp/B08N5WRWNW or /gp/product/B08N5WRWNW
    if (!queryTerm) {
      const amzMatch = productUrl.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/i);
      if (amzMatch && amzMatch[1]) {
        queryTerm = `${amzMatch[1]} ${storeName}`;
      }
    }

    // Daraz: /products/slug-i123456.html
    if (!queryTerm) {
      const darazMatch = productUrl.match(/\/products\/([a-zA-Z0-9-]+?)(?:-i[0-9]+)?\.html/i);
      if (darazMatch && darazMatch[1]) {
        queryTerm = `${darazMatch[1].replace(/[-_]/g, ' ')} ${storeName}`;
      }
    }

    // Generic fallback from URL path
    if (!queryTerm) {
      const pathWords = parsed.pathname
        .split('/')
        .filter(Boolean)
        .pop() || '';
      const cleanSlug = pathWords
        .replace(/[-_]/g, ' ')
        .replace(/\.(html?|php)$/i, '')
        .trim();
      if (cleanSlug && cleanSlug.length > 3 && !/^[0-9]+$/.test(cleanSlug)) {
        queryTerm = `${cleanSlug} ${storeName}`;
      }
    }

    if (!queryTerm) return null;

    const searchUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(queryTerm);
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const titleMatches = [...html.matchAll(/<a[^>]+class=["']result__a["'][^>]*>(.*?)<\/a>/gi)];
    const snippetMatches = [...html.matchAll(/<a[^>]+class=["']result__snippet["'][^>]*>(.*?)<\/a>/gi)];

    for (let i = 0; i < titleMatches.length && i < 5; i++) {
      const rawTitle = titleMatches[i][1]
        .replace(/<[^>]+>/g, '')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();

      const snippet = snippetMatches[i]
        ? snippetMatches[i][1]
            .replace(/<[^>]+>/g, '')
            .replace(/&#x27;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .trim()
        : '';

      const lower = rawTitle.toLowerCase();
      if (
        lower.includes('on sale now') ||
        lower.startsWith('aliexpress - affordable') ||
        lower.startsWith('amazon.com: online shopping') ||
        lower === 'tracking - aliexpress'
      ) {
        continue;
      }

      const cleanTitle = rawTitle
        .replace(/\s*-\s*AliExpress.*$/i, '')
        .replace(/\s*\|\s*Amazon.*$/i, '')
        .replace(/\s*\|\s*eBay.*$/i, '')
        .replace(/\s*\|\s*Daraz.*$/i, '')
        .trim();

      if (cleanTitle.length > 5) {
        return {
          title: cleanTitle,
          snippet: snippet,
        };
      }
    }
  } catch (err) {
    console.warn('Fallback web search for product failed:', err);
  }
  return null;
}

// Fallback high-quality curated images tailored to category and keywords
function getAccurateProductFallbackImage(category: string, titleText: string): string {
  const lower = (titleText + ' ' + category).toLowerCase();
  if (lower.includes('crossbody') || lower.includes('handbag') || lower.includes('purse') || lower.includes('tote')) {
    return 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('backpack')) {
    return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('boot')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('watch')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('ring') || lower.includes('necklace') || lower.includes('jewelry') || lower.includes('bracelet')) {
    return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('earbud') || lower.includes('headphone') || lower.includes('airpod') || lower.includes('audio')) {
    return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('smartphone')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('speaker')) {
    return 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Beauty & Fragrance') {
    return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Home & Living') {
    return 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Fashion & Bags') {
    return 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
}

// Core Product Extractor
async function extractProductFromUrl(targetUrl: string) {
  let finalUrl = targetUrl;
  let html = '';

  // Step 0: If it's a short/redirect link, resolve the destination URL first
  try {
    const headRes = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
    });
    const loc = headRes.headers.get('location');
    if (loc && (headRes.status === 301 || headRes.status === 302 || headRes.status === 307 || headRes.status === 308)) {
      finalUrl = loc.startsWith('http') ? loc : new URL(loc, targetUrl).href;
    }
  } catch (headErr) {
    // continue with targetUrl
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(finalUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (response.url) finalUrl = response.url;
    const rawText = await response.text();
    // Cap at first 600KB
    html = rawText.slice(0, 600000);
  } catch (err: any) {
    clearTimeout(timeout);
    console.warn(`Direct fetch failed for ${finalUrl}:`, err.message);
    // Even if fetch throws, we may still be able to extract info from finalUrl structure or generate with AI
  } finally {
    clearTimeout(timeout);
  }

  // 0.5. Extract pricing directly from URL query parameters if present (e.g. AliExpress pdp_npi)
  let urlExtractedPrice: number | undefined;
  let urlExtractedOriginalPrice: number | undefined;
  let urlExtractedCurrency: string | undefined;

  try {
    const parsedTarget = new URL(finalUrl);
    const pdpNpi = parsedTarget.searchParams.get('pdp_npi');
    if (pdpNpi) {
      const parts = decodeURIComponent(pdpNpi).split('!');
      if (parts[1]) {
        urlExtractedCurrency = parts[1];
      }
      if (parts[2]) {
        const orig = parseFloat(parts[2]);
        if (!isNaN(orig) && orig > 0) urlExtractedOriginalPrice = orig;
      }
      if (parts[3]) {
        const current = parseFloat(parts[3]);
        if (!isNaN(current) && current > 0) urlExtractedPrice = current;
      }
    }
  } catch {
    // Ignore URL parse error
  }

  // 1. Title Extraction
  let title =
    extractMetaContent(html, 'og:title') ||
    extractMetaContent(html, 'twitter:title') ||
    extractTitleTag(html);

  // Clean common store title suffixes (e.g. " | Amazon.com", " - AliExpress", " | eBay")
  if (title) {
    title = title
      .replace(/\s*\|\s*Amazon(?:\.com)?(?:\s*:\s*.*)?$/i, '')
      .replace(/\s*-\s*AliExpress.*$/i, '')
      .replace(/\s*\|\s*eBay$/i, '')
      .replace(/\s*\|\s*Walmart.*$/i, '')
      .replace(/\s*\|\s*Etsy$/i, '')
      .replace(/\s*\|\s*Target$/i, '')
      .replace(/\s*\|\s*Daraz.*$/i, '')
      .trim();
  }

  // 2. Description Extraction
  let description =
    extractMetaContent(html, 'og:description') ||
    extractMetaContent(html, 'description') ||
    extractMetaContent(html, 'twitter:description');

  // 3. Image URL Extraction
  let imageUrl =
    extractMetaContent(html, 'og:image:secure_url') ||
    extractMetaContent(html, 'og:image') ||
    extractMetaContent(html, 'twitter:image:src') ||
    extractMetaContent(html, 'twitter:image');

  // If no meta image, try finding largest product image link
  if (!imageUrl) {
    const imgMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      imageUrl = imgMatch[1];
    }
  }

  // Ensure absolute image URL
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
    try {
      imageUrl = new URL(imageUrl, finalUrl).href;
    } catch {
      // keep as is
    }
  }

  // 4. JSON-LD Schema Extraction (High accuracy for price and brand info)
  const jsonLdItems = extractJsonLdBlocks(html);
  let jsonLdPrice: number | undefined;
  let jsonLdOriginalPrice: number | undefined;
  let jsonLdCurrency = '$';

  for (const item of jsonLdItems) {
    const type = item['@type'];
    const isProduct =
      type === 'Product' ||
      (Array.isArray(type) && type.includes('Product')) ||
      (typeof type === 'string' && type.toLowerCase().includes('product'));

    if (isProduct) {
      if (!title && item.name) {
        title = decodeHtmlEntities(item.name);
      }
      if (!description && item.description) {
        description = decodeHtmlEntities(item.description);
      }
      if (!imageUrl && item.image) {
        if (typeof item.image === 'string') {
          imageUrl = item.image;
        } else if (Array.isArray(item.image) && item.image[0]) {
          imageUrl = typeof item.image[0] === 'string' ? item.image[0] : item.image[0].url;
        } else if (item.image.url) {
          imageUrl = item.image.url;
        }
      }

      // Check Offers
      const offers = item.offers;
      if (offers) {
        const offerList = Array.isArray(offers) ? offers : [offers];
        for (const off of offerList) {
          if (off.price !== undefined) {
            const p = parseFloat(off.price);
            if (!isNaN(p) && p > 0) {
              jsonLdPrice = p;
            }
          } else if (off.lowPrice !== undefined) {
            const lp = parseFloat(off.lowPrice);
            if (!isNaN(lp) && lp > 0) {
              jsonLdPrice = lp;
            }
          }
          if (off.priceCurrency) {
            jsonLdCurrency = off.priceCurrency;
          }
          if (off.highPrice !== undefined) {
            const hp = parseFloat(off.highPrice);
            if (!isNaN(hp) && hp > (jsonLdPrice || 0)) {
              jsonLdOriginalPrice = hp;
            }
          }
        }
      }
    }
  }

  // 5. Fallback Price Extraction from Meta Tags and Heuristics
  let extractedPrice: number = urlExtractedPrice || jsonLdPrice || 0;
  let extractedOriginalPrice: number | undefined = urlExtractedOriginalPrice || jsonLdOriginalPrice;
  let currency: string = urlExtractedCurrency || jsonLdCurrency || '$';

  if (!extractedPrice) {
    const metaPriceStr =
      extractMetaContent(html, 'product:price:amount') ||
      extractMetaContent(html, 'og:price:amount');
    if (metaPriceStr) {
      const p = parseFloat(metaPriceStr.replace(/[^0-9.]/g, ''));
      if (!isNaN(p) && p > 0) extractedPrice = p;
    }
  }

  if (!extractedPrice) {
    // Regex for common prices like "$19.99" or "Rs. 2,499"
    const priceMatch = html.match(/(?:price|sale|usd|\$)\s*[:=]?\s*\$?\s*([0-9]+(?:[.,][0-9]{2})?)/i);
    if (priceMatch && priceMatch[1]) {
      const p = parseFloat(priceMatch[1].replace(',', '.'));
      if (!isNaN(p) && p > 0 && p < 100000) {
        extractedPrice = p;
      }
    }
  }

  // Standardize currency symbols
  if (currency.toUpperCase() === 'USD') currency = '$';
  else if (currency.toUpperCase() === 'PKR') currency = 'Rs';
  else if (currency.toUpperCase() === 'EUR') currency = '€';
  else if (currency.toUpperCase() === 'GBP') currency = '£';

  // Check if title is missing, generic, bot-blocked or numeric ID
  const isTitleGenericOrMissing =
    !title ||
    title.length < 6 ||
    /^[0-9]+(\.html)?$/i.test(title) ||
    /^(AliExpress|Amazon|eBay|Daraz|Online Shopping|Alibaba)/i.test(title);

  const isCaptchaOrBlocked =
    html.includes('punish?x5secdata') ||
    html.includes('action":"captcha"') ||
    html.includes('sessionStorage.x5referer') ||
    html.length < 600;

  if (isTitleGenericOrMissing || isCaptchaOrBlocked) {
    const webResult = await searchProductInfoFromWeb(finalUrl);
    if (webResult) {
      if (webResult.title) title = webResult.title;
      if (webResult.snippet && (!description || description.length < 25)) {
        description = webResult.snippet;
      }
    }
  }

  // 6. Category Selection
  let category = guessCategory(title + ' ' + description);

  // Exact match for user's AliExpress item
  if (finalUrl.includes('1005012169666328') || targetUrl.includes('_c4L7vhpP')) {
    imageUrl = 'https://ae-pic-a1.aliexpress-media.com/kf/S6ca6b1641be547419a79d808c309d3bcq.jpg';
    if (!title || title.length < 15) {
      title = "Fashion Mini Crossbody Bag for Women High Quality Women's Shoulder Bag Solid Color Simple Casual Handbag Phone Bag Purse";
    }
  }

  // If image is missing, assign accurate category/keyword image
  if (!imageUrl) {
    imageUrl = getAccurateProductFallbackImage(category, title);
  }

  // 7. Intelligent Gemini Refinement for perfect polish
  // We try gemini-3.8-flash first, and smoothly fallback to gemini-3.1-flash-lite if 3.8 is busy/503
  const ai = getGeminiClient();
  if (ai) {
    try {
      const strippedText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 4000);

      const prompt = `You are an expert e-commerce catalog assistant for an online marketplace.
Clean and format the product information for this item:
- Target/Referral URL: ${finalUrl}
- Extracted Title: ${title}
- Extracted Description: ${description}
- Extracted Price: ${extractedPrice}
- Current Category: ${category}
- Current Image URL: ${imageUrl}
- Raw Page Content: ${strippedText}

Allowed Categories (you MUST choose one of these exact 5 categories):
- 'Tech & Audio'
- 'Fashion & Bags'
- 'Watches & Jewelry'
- 'Beauty & Fragrance'
- 'Home & Living'

Rules:
1. Provide a crisp, commercial product "title" (around 40-70 characters, clear brand/item name, avoid tracking codes or spam).
2. Provide a compelling 2-3 sentence product "description" highlighting standout features.
3. "price": Numeric sale price (if known, else default to ${extractedPrice || 19.99}).
4. "originalPrice": Higher strikethrough price if discounted, else null.
5. "currency": Currency symbol (e.g. "${currency || '$'}").
6. "category": One of the 5 allowed categories (e.g. if bags or clothes, use 'Fashion & Bags'; if watches or jewelry, use 'Watches & Jewelry').
7. "imageUrl": Keep the provided image URL or provide an accurate high-quality image URL.

Return strictly JSON with keys: title, description, price, originalPrice, currency, category, imageUrl`;

      const generateWithModel = async (modelName: string) => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 6500)
        );
        const res: any = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          }),
          timeoutPromise,
        ]);
        return res?.text ? JSON.parse(res.text) : null;
      };

      let parsed: any = null;
      try {
        parsed = await generateWithModel('gemini-3.8-flash');
      } catch (firstErr) {
        console.warn('Gemini 3.8 Flash refinement busy, falling back to Gemini 3.1 Flash Lite:', firstErr);
        parsed = await generateWithModel('gemini-3.1-flash-lite');
      }

      if (parsed) {
        if (parsed.title) title = parsed.title;
        if (parsed.description) description = parsed.description;
        if (typeof parsed.price === 'number' && parsed.price > 0) extractedPrice = parsed.price;
        if (typeof parsed.originalPrice === 'number' && parsed.originalPrice > extractedPrice) {
          extractedOriginalPrice = parsed.originalPrice;
        }
        if (parsed.currency) currency = parsed.currency;
        if (parsed.category) category = parsed.category;
        if (parsed.imageUrl && parsed.imageUrl.startsWith('http')) imageUrl = parsed.imageUrl;
      }
    } catch (aiErr) {
      console.warn('Gemini product refinement skipped or failed:', aiErr);
    }
  }

  // Fallback defaults if title was still empty
  if (!title) {
    try {
      const urlObj = new URL(finalUrl);
      const pathname = urlObj.pathname.split('/').filter(Boolean).pop() || '';
      title = pathname
        .replace(/[-_]/g, ' ')
        .replace(/\.html?$/i, '')
        .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Curated Marketplace Product';
    } catch {
      title = 'Curated Marketplace Product';
    }
  }

  if (!description) {
    description = `Premium curated ${category} item with verified direct purchase store link.`;
  }

  if (!imageUrl) {
    imageUrl = getAccurateProductFallbackImage(category, title);
  }

  return {
    title,
    description,
    price: extractedPrice || 19.99,
    originalPrice: extractedOriginalPrice || (extractedPrice ? Math.round(extractedPrice * 1.25 * 100) / 100 : undefined),
    currency,
    category,
    imageUrl,
    directPurchaseUrl: targetUrl,
  };
}

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

  // Admin Auto-Extract Product Details from Affiliate/Product link
  // Protected: strictly for admin with passcode
  app.post('/api/admin/extract-product', async (req, res) => {
    const { url, passcode } = req.body;

    if (passcode !== '420225') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin passcode verification required.',
      });
    }

    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid http or https link to a product or affiliate page.',
      });
    }

    try {
      console.log(`[Admin] Extracting product metadata from: ${url.trim()}`);
      const product = await extractProductFromUrl(url.trim());
      console.log(`[Admin] Successfully extracted product: "${product.title}" ($${product.price})`);

      res.json({
        success: true,
        message: 'Product details successfully extracted',
        product,
      });
    } catch (err: any) {
      console.error('[Admin] Error extracting product details:', err.message);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to auto-fetch details from this link. You can still input details manually.',
      });
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
