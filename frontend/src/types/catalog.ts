export interface Brand {
  id: number;
  name: string;
  createdAt: string;
  productCount?: number;
}

export interface Category {
  id: number;
  name: string;
  createdAt: string;
  productCount?: number;
}

export type ProductType = 'PERISHABLE' | 'NON_PERISHABLE';
export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED';

export interface DiscountInfo {
  type: DiscountType;
  value: number;
  description: string;
  discountedPriceInPaise: number;
  discountedPriceInRupees: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  productType: ProductType;
  priceInPaise: number;
  priceInRupees: number;
  stock: number;
  expiryDate?: string;
  discount?: DiscountInfo;
}

export interface ProductListResponse {
  total: number;
  limit: number;
  offset: number;
  products: Product[];
}

export interface ProductFormData {
  sku: string;
  name: string;
  brandId: number;
  categoryId: number;
  productType: ProductType;
  priceInRupees: number;
  stock: number;
  expiryDate?: string;
  discountType: DiscountType;
  discountValue: number;
}
