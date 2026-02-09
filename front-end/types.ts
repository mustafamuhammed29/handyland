
export interface PhoneListing {
  id: string;
  model: string;
  brand: string;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  storage: string;
  color: string;
  imageUrl: string;
  images?: string[];
  description: string;
  specs?: {
    cpu?: string;
    battery?: string;
    screen?: string;
    camera?: string;
    ram?: string;
  };
  rating?: number;
  numReviews?: number;
}

export interface RepairService {
  id: string;
  device: string;
  serviceType: string;
  price: number;
  duration: string;
}

export interface ValuationRequest {
  model: string;
  condition: string;
  storage: string;
  battery: string; // Keep for "New/Old" selector compatibility if needed, else deprecate
  batteryHealth?: number; // NEW: Percentage (e.g. 88)
  color: string;
  accessories: boolean;
}

export interface CartItem {
  id: string | number;
  title: string;
  subtitle: string;
  price: number;
  image: string;
  category: 'device' | 'accessory';
  quantity?: number;
}

export interface SavedValuation {
  id: string;
  device: string;
  specs: string;
  condition: string;
  estimatedValue: number;
  date: string;
}


export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  amount: number;
  minOrderAmount: number;
  expirationDate: Date;
  isActive: boolean;
}

export interface User {
  [x: string]: any;
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  token?: string;
  phone?: string;
  address?: string;
  balance?: number;
  points?: number;
}

export interface RepairTicket {
  id: string;
  device: string;
  issue: string;
  status: 'received' | 'diagnosing' | 'repairing' | 'testing' | 'ready' | 'attention';
  date: string;
  cost: number;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'repair' | 'refund';
  amount: number;
  date: string;
  time?: string;
  items?: string[];
  status: 'completed' | 'pending' | 'delivered' | 'shipped';
}

export enum ViewState {
  HOME = 'HOME',
  MARKETPLACE = 'MARKETPLACE',
  REPAIR = 'REPAIR',
  VALUATION = 'VALUATION',
  LOGIN = 'LOGIN',
  CHECKOUT = 'CHECKOUT',
  DASHBOARD = 'DASHBOARD',
  SELLER_STUDIO = 'SELLER_STUDIO',
  ADMIN = 'ADMIN',
  AGB = 'AGB',
  PRIVACY = 'PRIVACY',
  SERVICE = 'SERVICE',
  IMPRESSUM = 'IMPRESSUM',
  ABOUT = 'ABOUT'
}

export type LanguageCode = 'ar' | 'en' | 'de' | 'tr' | 'ru';
