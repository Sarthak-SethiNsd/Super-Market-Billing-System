import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { Product, ProductListResponse, ProductFormData } from '@/types/catalog';

export interface ProductQueryParams {
  q?: string;
  brandId?: number;
  categoryId?: number;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductSummary {
  totalActiveProducts: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const productService = {
  async getProducts(params?: ProductQueryParams): Promise<ProductListResponse> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.brandId) query.append('brandId', params.brandId.toString());
    if (params?.categoryId) query.append('categoryId', params.categoryId.toString());
    if (params?.activeOnly !== undefined) query.append('activeOnly', params.activeOnly.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    const url = `/api/products${query.toString() ? '?' + query.toString() : ''}`;
    const res = await apiClient.get<ApiResponse<ProductListResponse>>(url);
    return res.data.data;
  },

  async getSummary(): Promise<ProductSummary> {
    const res = await apiClient.get<ApiResponse<ProductSummary>>('/api/products/summary');
    return res.data.data;
  },

  async getById(id: number): Promise<Product> {
    const res = await apiClient.get<ApiResponse<Product>>(`/api/products/${id}`);
    return res.data.data;
  },

  async create(data: ProductFormData): Promise<Product> {
    const payload = {
      sku: data.sku.trim(),
      name: data.name.trim(),
      brandId: data.brandId,
      categoryId: data.categoryId,
      productType: data.productType,
      priceInRupees: data.priceInRupees,
      stock: data.stock,
      expiryDate: data.productType === 'PERISHABLE' ? data.expiryDate : '',
      discountType: data.discountType,
      discountValue: data.discountValue,
    };
    const res = await apiClient.post<ApiResponse<Product>>('/api/products', payload);
    return res.data.data;
  },

  async update(id: number, data: ProductFormData): Promise<Product> {
    const payload = {
      sku: data.sku.trim(),
      name: data.name.trim(),
      brandId: data.brandId,
      categoryId: data.categoryId,
      productType: data.productType,
      priceInRupees: data.priceInRupees,
      stock: data.stock,
      expiryDate: data.productType === 'PERISHABLE' ? data.expiryDate : '',
      discountType: data.discountType,
      discountValue: data.discountValue,
    };
    const res = await apiClient.put<ApiResponse<Product>>(`/api/products/${id}`, payload);
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<{ id: number; deleted: boolean }>>(`/api/products/${id}`);
  },
};
