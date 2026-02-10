
export interface PhoneListing {
  id: string;
  model: string;
  brand: string;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  storage: string;
  color: string;
  stock: number;
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

export interface Address {
  _id?: string;
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  [x: string]: any;
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  token?: string;
  phone?: string;
  address?: string; // Derived from default address or deprecated
  addresses?: Address[];
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

export interface Order {
  _id: string; // Backend uses _id
  id?: string; // Frontend might use id
  orderNumber?: string;
  user: any;
  items: any[];
  totalAmount: number;
  tax?: number;
  shippingFee?: number;
  shippingAddress?: {
    fullName: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod?: string;
  paymentStatus?: string;
  amount?: number; // Legacy or alternative
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'returned';
  createdAt: string;
  date?: string; // Legacy or alternative
}

export interface WalletTransaction {
  _id: string;
  amount: number;
  type: string; // deposit, withdrawal, purchase, refund
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description?: string;
}

// Deprecated or keep for broader compatibility if needed
export interface Transaction {
  id: string;
  type: 'purchase' | 'repair' | 'refund';
  amount: number;
  date: string;
  time?: string;
  items?: string[];
  status: 'completed' | 'pending' | 'delivered' | 'shipped';
}

// ViewState enum removed in favor of React Router


export type LanguageCode = 'ar' | 'en' | 'de' | 'tr' | 'ru';
