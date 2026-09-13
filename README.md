# M Shopping Hub 🛍️
A modern, high-performance, mobile-first marketplace built with React 19, TypeScript, Tailwind CSS, Express, and Google Cloud Firebase (Authentication & Firestore).

---

## 🚀 Key Features

- **Direct Purchase Marketplace:** Curated items with external store referral links, category filters, and live search.
- **Admin Management Panel:** Protected by secret access passcode (`420225`). Allows adding, editing, and deleting products with image URL or local photo uploads.
- **Google Firebase Authentication:**
  - Fast 1-click **Continue with Google** sign-in powered by Firebase Auth.
  - One-click instant guest sign-in fallback.
- **Google Cloud Firestore Database:**
  - Real-time cloud persistence for products, catalog updates, user comments, reviews, and likes.
- **Responsive & Animated Design:**
  - Custom shopping girl animated hero banner, glassmorphic navigation, product quick-preview modal, and saved items drawer.

---

## 🔑 Firebase & Google OAuth Credentials

The application is pre-configured with active Firebase & Google OAuth credentials located in `firebase-applet-config.json`:

| Parameter | Value |
|-----------|-------|
| **Google OAuth Client ID** | `1079456419306-j0f9njo2ml5q7s43beu2na7b6jmft39e.apps.googleusercontent.com` |
| **Firebase Project ID** | `gen-lang-client-0856773898` |
| **Auth Domain** | `gen-lang-client-0856773898.firebaseapp.com` |
| **Firestore Database ID** | `ai-studio-mshoppinghub-4060620c-3c5f-4519-bb56-39fe8018c1d1` |
| **Admin Secret Passcode** | `420225` |

---

## 📦 Deployment Instructions (GitHub & Cloud Hosting)

### Option 1: Deploy Directly on Google Cloud Run (Recommended)
You can deploy directly within Google AI Studio using the top-right **Deploy to Cloud Run** button. Everything is automatically configured!

---

### Option 2: Deploy to Vercel / Render / Railway via GitHub

1. **Push to GitHub:**
   - In AI Studio, click the menu in the top bar: **Export to GitHub** (or download the ZIP and push to your GitHub repository).
   - Ensure `firebase-applet-config.json` and `firestore.rules` are included in the repository.

2. **Deploy on Render / Railway / Node Server:**
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** 18+ or 20+

### ⚡ Deploy to Vercel (1-Click Steps)

`vercel.json` is already configured in the repository with Vite framework presets and single-page application rewrites.

1. **Push to GitHub:**
   - From AI Studio top-right menu, select **Export to GitHub** (or download the ZIP and push to GitHub).
2. **Import into Vercel:**
   - Go to [vercel.com](https://vercel.com) and click **"Add New..." -> "Project"**.
   - Select your GitHub repository.
3. **Project Settings in Vercel:**
   - **Framework Preset:** `Vite` (automatically detected)
   - **Build Command:** `vite build` (or `npm run build`)
   - **Output Directory:** `dist`
   - Click **Deploy**.
4. **Authorize your Vercel URL in Firebase (for Google Sign-In):**
   - Once Vercel gives you your live URL (e.g., `https://your-app.vercel.app`), open:
     **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized Domains**.
   - Click **Add Domain** and paste your Vercel domain (`your-app.vercel.app`).
   - Done! Your app is now 100% live on Vercel with Google Login & Cloud Firestore.

4. **Authorized Domains (Important for Custom Domains):**
   - If you host the site on a custom domain (e.g., `www.yourdomain.com`), go to:
     **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized domains** -> **Add domain** and add your live website URL.

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build

# 4. Start production server
npm start
```
