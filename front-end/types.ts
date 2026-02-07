
export interface PhoneListing {
  id: string;
  model: string;
  brand: string;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  storage: string;
  color: string;
  imageUrl: string;
  description: string;
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
}

export interface SavedValuation {
  id: string;
  device: string;
  specs: string;
  condition: string;
  estimatedValue: number;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  balance?: number;
  points?: number;
  role?: 'user' | 'admin';
}

export interface RepairTicket {
  id: string;
  device: string;
  issue: string;
  status: 'received' | 'diagnosing' | 'repairing' | 'testing' | 'ready';
  date: string;
  cost: number;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'repair' | 'refund';
  amount: number;
  date: string;
  status: 'completed' | 'pending';
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
