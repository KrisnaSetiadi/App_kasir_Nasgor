export enum PaymentMethod {
  CASH = 'CASH',
  QRIS = 'QRIS',
  TRANSFER = 'TRANSFER',
  E_WALLET = 'E_WALLET'
}

export enum OrderSource {
  OFFLINE = 'OFFLINE',
  ONLINE_GRAB = 'ONLINE_GRAB',
  ONLINE_GOJEK = 'ONLINE_GOJEK',
  ONLINE_SHOPEE = 'ONLINE_SHOPEE',
  WHATSAPP = 'WHATSAPP'
}

export enum Category {
  FOOD = 'FOOD',
  BEVERAGE = 'BEVERAGE',
  ADD_ON = 'ADD_ON'
}

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  hpp: number; // Harga Pokok Penjualan (Cost of Goods)
  price: number; // Selling Price
  promoPrice?: number; // Optional Discounted Price
  description?: string;
  isPopular?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  originalPrice?: number; // To track savings if needed
}

export interface Transaction {
  id: string;
  timestamp: number; // Unix timestamp
  items: CartItem[];
  totalAmount: number;
  totalHpp: number;
  totalProfit: number;
  orderSource: OrderSource;
  paymentMethod?: PaymentMethod; 
  customerName?: string;
  cashGiven?: number;
  change?: number;
}

export interface Expenditure {
  id: string;
  timestamp: number;
  description: string;
  amount: number;
}

export enum TimeFilter {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  LIFETIME = 'LIFETIME',
  CUSTOM = 'CUSTOM'
}

export interface StoreProfile {
  name: string;
  address: string;
  phone: string;
  socialMedia: string;
  footerText: string;
}