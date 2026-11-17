export interface Customer {
  id: number;
  customerCode: string;
  fullName: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalPurchases: number;
  lifetimeSpentPaise: number;
  lifetimeSpentInRupees: number;
  lastPurchaseDate: string | null;
}

export interface CustomerFormData {
  fullName: string;
  phone: string;
  email: string;
  isActive?: boolean;
}

export interface CustomerBillItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPriceInRupees: number;
  lineTotalInRupees: number;
}

export interface CustomerBill {
  id: number;
  billNumber: string;
  subtotalInRupees: number;
  totalDiscountInRupees: number;
  finalAmountInRupees: number;
  createdAt: string;
  customerId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  items?: CustomerBillItem[];
}
