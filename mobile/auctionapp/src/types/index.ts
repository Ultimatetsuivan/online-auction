// Common types for the mobile app

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  balance?: number;
  isVerified?: boolean;
  avatar?: string;
  [key: string]: any;
}

export interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  currentBid?: number;
  images?: Array<{ url: string; _id?: string }>;
  bidDeadline?: string;
  category?: string | Category;
  bids?: Bid[];
  seller?: User | string;
  sold?: boolean;
  available?: boolean;
  views?: number;
  likes?: number;
  createdAt?: string;
  updatedAt?: string;
  // Vehicle specific fields
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  transmission?: string;
  fuelType?: string;
  vehicleTitle?: string;
  vin?: string;
  vehicleHistoryReport?: {
    available: boolean;
    provider?: string;
    reportUrl?: string;
  };
  // General fields
  brand?: string;
  condition?: string;
  color?: string;
  size?: string;
  itemSpecifics?: Record<string, any>;
  sellerDescription?: string;
}

export interface Category {
  _id: string;
  title: string;
  titleMn?: string;
  name?: string;
  parent?: string;
  image?: string;
  icon?: string;
  children?: Category[];
}

export interface Bid {
  _id: string;
  product: string | Product;
  user: string | User;
  bidAmount: number;
  createdAt: string;
}

export interface Notification {
  _id: string;
  user: string | User;
  type: 'bid' | 'outbid' | 'auction_ended' | 'watchlist' | 'message' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SocketEvent {
  type: string;
  data: any;
  timestamp?: string;
}


