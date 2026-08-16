import { Timestamp } from "firebase/firestore";

// Product Types
export interface ProductSpecs {
  ram: string;
  storage: string;
  battery: string;
  camera: string;
  display: string;
  processor: string;
  os: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  costPrice: number;
  category: "budget" | "midrange" | "flagship";
  specs: ProductSpecs;
  images: string[];
  tags: string[];
  stock: number;
  views: number;
  salesCount: number;
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description: string;
  productsCount: number;
  createdAt: Timestamp | Date;
}

// User Types
export interface UserDemographics {
  age?: number | null;
  location?: string | null;
}

export interface AppUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin";
  demographics: UserDemographics;
  passwordHash: string;
  salt: string;
  emailVerified: boolean;
  verificationToken: string | null;
  createdAt: Timestamp | Date;
  lastLoginAt: Timestamp | Date;
}

// Order Types
export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  costPrice: number;
}

export interface StudentDiscountOrderMetadata {
  type: "STUDENT";
  rate: number;
  amount: number;
  checkoutId: string;
  verificationRequestId: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: "cash" | "card" | "paypal";
  status: "pending" | "completed";
  createdAt: Timestamp | Date;
  completedAt: Timestamp | Date | null;
  studentDiscount?: StudentDiscountOrderMetadata;
}

// Wishlist Types
export interface Wishlist {
  userId: string;
  productIds: string[];
  updatedAt: Timestamp | Date;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

// View Log Types
export interface ViewLog {
  userId?: string | null;
  sessionId: string;
  timestamp: Timestamp | Date;
}

// AI Search Types
export interface AISearchCriteria {
  brands: string[];
  os: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  minRam: number | null;
  minStorage: number | null;
  minBattery: number | null;
  category: "budget" | "midrange" | "flagship" | null;
  priorities: string[];
}

export interface AIImageAnalysis {
  brand: string;
  estimatedModel: string;
  color: string;
  visualFeatures: string[];
  category: "budget" | "midrange" | "flagship";
}
