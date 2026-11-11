import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { InventoryMovement, StockAdjustmentRequest, StockAdjustmentResponse } from '@/types/inventory';

export interface InventorySummary {
  totalMovements: number;
  totalAdditions: number;
  totalReductions: number;
  totalSales: number;
  totalAdjustments: number;
}

export const inventoryService = {
  async getMovements(limit: number = 50, offset: number = 0): Promise<InventoryMovement[]> {
    const res = await apiClient.get<ApiResponse<InventoryMovement[]>>(`/api/inventory/movements?limit=${limit}&offset=${offset}`);
    return res.data.data;
  },

  async getSummary(): Promise<InventorySummary> {
    const res = await apiClient.get<ApiResponse<InventorySummary>>('/api/inventory/summary');
    return res.data.data;
  },

  async getProductMovements(productId: number): Promise<InventoryMovement[]> {
    const res = await apiClient.get<ApiResponse<InventoryMovement[]>>(`/api/inventory/products/${productId}/movements`);
    return res.data.data;
  },

  async adjustStock(data: StockAdjustmentRequest): Promise<StockAdjustmentResponse> {
    const res = await apiClient.post<ApiResponse<StockAdjustmentResponse>>('/api/inventory/adjustments', data);
    return res.data.data;
  },
};
