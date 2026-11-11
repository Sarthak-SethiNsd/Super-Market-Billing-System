import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { Invoice } from '@/types/billing';

export interface CheckoutItemRequest {
  productId: number;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItemRequest[];
  billNumber?: string;
}

export interface BillSummary {
  totalBills: number;
  totalGrossPaise: number;
  totalGrossInRupees: number;
  totalDiscountPaise: number;
  totalDiscountInRupees: number;
  totalNetPaise: number;
  totalNetInRupees: number;
  totalUnitsSold: number;
}

export const billService = {
  async checkout(items: CheckoutItemRequest[], billNumber?: string): Promise<Invoice> {
    const payload: CheckoutRequest = { items };
    if (billNumber) payload.billNumber = billNumber;

    const res = await apiClient.post<ApiResponse<Invoice>>('/api/bills', payload);
    return res.data.data;
  },

  async getBills(limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    const res = await apiClient.get<ApiResponse<Invoice[]>>(`/api/bills?limit=${limit}&offset=${offset}`);
    return res.data.data;
  },

  async getBillSummary(): Promise<BillSummary> {
    const res = await apiClient.get<ApiResponse<BillSummary>>('/api/bills/summary');
    return res.data.data;
  },

  async getBillById(id: number): Promise<Invoice> {
    const res = await apiClient.get<ApiResponse<Invoice>>(`/api/bills/${id}`);
    return res.data.data;
  },
};
