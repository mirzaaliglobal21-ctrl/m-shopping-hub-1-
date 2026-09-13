export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: string;
  imageUrl: string;
  directPurchaseUrl: string; // Direct purchase link (no affiliate wording used in UI)
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  featured?: boolean;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
}

export interface VisitorLog {
  id: string;
  visitorId: string;
  timestamp: string;
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  browser: string;
  os: string;
  timeZone: string;
  language: string;
  page: string;
  action: string;
  userName?: string;
  userEmail?: string;
  userRole?: 'admin' | 'user' | 'guest';
}

export interface AnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  directStoreClicks: number;
  totalLikes: number;
  totalComments: number;
  lastUpdated: string;
  todayDate: string;
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}
