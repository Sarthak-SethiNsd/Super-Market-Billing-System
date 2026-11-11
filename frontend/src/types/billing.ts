import { Product } from './catalog';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPriceInRupees: number;
  discountedUnitPriceInRupees: number;
  lineTotalInRupees: number;
}

export interface BillItemSnapshot {
  id: number;
  productId: number | null;
  productName: string;
  brandName: string;
  unitPriceInRupees: number;
  discountType: string;
  discountValue: number;
  unitDiscountInRupees: number;
  finalUnitPriceInRupees: number;
  quantity: number;
  lineTotalInRupees: number;
}

export interface Invoice {
  id: number;
  billNumber: string;
  subtotalInRupees: number;
  totalDiscountInRupees: number;
  finalAmountInRupees: number;
  createdAt: string;
  items: BillItemSnapshot[];
}
