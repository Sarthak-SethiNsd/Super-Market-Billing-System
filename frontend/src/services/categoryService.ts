import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { Category } from '@/types/catalog';

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
};
