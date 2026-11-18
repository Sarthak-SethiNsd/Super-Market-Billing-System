import apiClient from './api';
import { ApiResponse } from '@/types/api';

export interface CartReservationItem {
  id: number;
  sessionId: string;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  expiresAt: number;
  remainingSeconds: number;
}

export interface CartReservationResponse {
  sessionId: string;
  productId: number;
  productName: string;
  quantity: number;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  ttlSeconds: number;
}

export interface ActiveCartSummary {
  sessionId: string;
  totalReservedUnits: number;
  itemCount: number;
  items: CartReservationItem[];
}

export function getCartSessionId(): string {
  const KEY = 'supermarket_cart_session_id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export const cartService = {
  getSessionId(): string {
    return getCartSessionId();
  },

  async reserve(productId: number, quantity: number, ttlSeconds: number = 900): Promise<CartReservationResponse> {
    const sessionId = getCartSessionId();
    const res = await apiClient.post<ApiResponse<CartReservationResponse>>('/api/cart/reserve', {
      sessionId,
      productId,
      quantity,
      ttlSeconds,
    });
    return res.data.data;
  },

  async release(productId: number): Promise<void> {
    const sessionId = getCartSessionId();
    await apiClient.post<ApiResponse<{ released: boolean }>>('/api/cart/release', {
      sessionId,
      productId,
    });
  },

  async clear(): Promise<void> {
    const sessionId = getCartSessionId();
    await apiClient.post<ApiResponse<{ clearedReservations: number }>>('/api/cart/clear', {
      sessionId,
    });
  },

  async getActiveReservations(): Promise<ActiveCartSummary> {
    const sessionId = getCartSessionId();
    const res = await apiClient.get<ApiResponse<ActiveCartSummary>>(`/api/cart?sessionId=${encodeURIComponent(sessionId)}`);
    return res.data.data;
  },
};
