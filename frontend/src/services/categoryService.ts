import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { Category, Brand } from '@/types/catalog';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const res = await apiClient.get<ApiResponse<Category[]>>('/api/categories');
    return res.data.data;
  },

  async create(name: string): Promise<Category> {
    const res = await apiClient.post<ApiResponse<Category>>('/api/categories', { name });
    return res.data.data;
  },

  async update(id: number, name: string): Promise<Category> {
    const res = await apiClient.put<ApiResponse<Category>>(`/api/categories/${id}`, { name });
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<{ id: number; deleted: boolean }>>(`/api/categories/${id}`);
  },

  // Category-Brand relationship endpoints (Stage 10L)
  async getBrandsByCategory(categoryId: number): Promise<Brand[]> {
    const res = await apiClient.get<ApiResponse<Brand[]>>(`/api/categories/${categoryId}/brands`);
    return res.data.data;
  },

  async associateBrand(categoryId: number, data: { brandId?: number; brandName?: string }): Promise<void> {
    await apiClient.post<ApiResponse<any>>(`/api/categories/${categoryId}/brands`, data);
  },

  async dissociateBrand(categoryId: number, brandId: number): Promise<void> {
    await apiClient.delete<ApiResponse<any>>(`/api/categories/${categoryId}/brands/${brandId}`);
  },
};
