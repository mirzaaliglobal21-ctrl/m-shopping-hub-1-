import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { VisitorLog, AnalyticsSummary, AppUser } from '../types';

const VISITOR_STORAGE_KEY = 'm_shopping_hub_visitor_uuid';
const VISIT_RECORDED_SESSION_KEY = 'm_visit_session_recorded';

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!id) {
      id = 'v-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem(VISITOR_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'v-temp-' + Math.random().toString(36).substring(2, 9);
  }
}

export function detectDeviceInfo(): {
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  browser: string;
  os: string;
} {
  const ua = navigator.userAgent;
  let deviceType: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Mobile|iPhone|Android/i.test(ua)) {
    deviceType = 'Mobile';
  }

  let browser = 'Unknown Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) browser = 'Google Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';

  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { deviceType, browser, os };
}

/**
 * Record a visitor session & page view to Firestore
 */
export async function recordVisitorEvent(
  page: string = 'Home / Catalog',
  action: string = 'Page View',
  currentUser?: AppUser | null
): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const { deviceType, browser, os } = detectDeviceInfo();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const language = navigator.language || 'en';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const isNewSession = !sessionStorage.getItem(VISIT_RECORDED_SESSION_KEY);

    if (isNewSession) {
      sessionStorage.setItem(VISIT_RECORDED_SESSION_KEY, 'true');
    }

    // 1. Create a detailed visitor log entry
    const logId = `visit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const visitorLog: VisitorLog = {
      id: logId,
      visitorId,
      timestamp: now.toISOString(),
      deviceType,
      browser,
      os,
      timeZone,
      language,
      page,
      action,
      userName: currentUser?.name || (currentUser ? 'User' : 'Guest Shopper'),
      userEmail: currentUser?.email,
      userRole: currentUser?.role || 'guest',
    };

    // Save individual log
    await setDoc(doc(db, 'visitors', logId), {
      ...visitorLog,
      createdAt: serverTimestamp(),
    }).catch((err) => console.warn('Could not save visitor log:', err));

    // 2. Update aggregate Analytics Summary
    const summaryRef = doc(db, 'analytics', 'summary');
    const summarySnap = await getDoc(summaryRef).catch(() => null);

    const deviceKey = deviceType.toLowerCase() as 'mobile' | 'desktop' | 'tablet';

    if (!summarySnap || !summarySnap.exists()) {
      const initialSummary: AnalyticsSummary = {
        totalVisits: 1,
        uniqueVisitors: 1,
        todayVisits: 1,
        directStoreClicks: 0,
        totalLikes: 0,
        totalComments: 0,
        lastUpdated: now.toISOString(),
        todayDate: todayStr,
        devices: {
          mobile: deviceType === 'Mobile' ? 1 : 0,
          desktop: deviceType === 'Desktop' ? 1 : 0,
          tablet: deviceType === 'Tablet' ? 1 : 0,
        },
      };
      await setDoc(summaryRef, initialSummary).catch(() => {});
    } else {
      const data = summarySnap.data() as AnalyticsSummary;
      const isDifferentDay = data.todayDate !== todayStr;
      
      const updateData: any = {
        totalVisits: increment(1),
        todayVisits: isDifferentDay ? 1 : increment(1),
        todayDate: todayStr,
        lastUpdated: now.toISOString(),
        [`devices.${deviceKey}`]: increment(1),
      };

      if (isNewSession) {
        updateData.uniqueVisitors = increment(1);
      }

      await updateDoc(summaryRef, updateData).catch(() => {});
    }
  } catch (err) {
    console.warn('Analytics logging error (non-fatal):', err);
  }
}

/**
 * Track when a user clicks a direct purchase store link
 */
export async function trackStoreClick(
  productId: string,
  productTitle: string,
  currentUser?: AppUser | null
): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const { deviceType, browser, os } = detectDeviceInfo();
    const now = new Date();

    const logId = `click-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const visitorLog: VisitorLog = {
      id: logId,
      visitorId,
      timestamp: now.toISOString(),
      deviceType,
      browser,
      os,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      language: navigator.language || 'en',
      page: `Product: ${productTitle.substring(0, 40)}`,
      action: 'Direct Store Link Clicked (Outbound)',
      userName: currentUser?.name || 'Guest Shopper',
      userEmail: currentUser?.email,
      userRole: currentUser?.role || 'guest',
    };

    await setDoc(doc(db, 'visitors', logId), {
      ...visitorLog,
      productId,
      createdAt: serverTimestamp(),
    }).catch(() => {});

    // Increment store clicks in summary
    const summaryRef = doc(db, 'analytics', 'summary');
    await updateDoc(summaryRef, {
      directStoreClicks: increment(1),
      lastUpdated: now.toISOString(),
    }).catch(() => {});
  } catch (err) {
    console.warn('Store click tracking error:', err);
  }
}

/**
 * Subscribe to real-time analytics summary
 */
export function subscribeToAnalytics(
  callback: (data: AnalyticsSummary) => void
): () => void {
  const summaryRef = doc(db, 'analytics', 'summary');
  return onSnapshot(
    summaryRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as AnalyticsSummary);
      } else {
        // Default empty stats
        callback({
          totalVisits: 0,
          uniqueVisitors: 0,
          todayVisits: 0,
          directStoreClicks: 0,
          totalLikes: 0,
          totalComments: 0,
          lastUpdated: new Date().toISOString(),
          todayDate: new Date().toISOString().split('T')[0],
          devices: { mobile: 0, desktop: 0, tablet: 0 },
        });
      }
    },
    (err) => {
      console.warn('Analytics subscription warning:', err);
    }
  );
}

/**
 * Subscribe to recent visitor logs in real-time
 */
export function subscribeToRecentVisitors(
  callback: (visitors: VisitorLog[]) => void,
  limitCount: number = 25
): () => void {
  const visitorsCol = collection(db, 'visitors');
  const q = query(visitorsCol, orderBy('timestamp', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: VisitorLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as VisitorLog);
      });
      callback(list);
    },
    async () => {
      // Fallback if index isn't created yet: retrieve without order
      try {
        const fallbackQuery = query(visitorsCol, limit(limitCount));
        const snap = await getDocs(fallbackQuery);
        const list: VisitorLog[] = [];
        snap.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as VisitorLog);
        });
        // Sort in memory
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      } catch (err) {
        console.warn('Fallback visitor fetch error:', err);
      }
    }
  );
}
