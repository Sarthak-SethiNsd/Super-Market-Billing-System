import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { Brand } from '@/types/catalog';

export const brandService = {
  async getAll(): Promise<Brand[]> {
    const res = await apiClient.get<ApiResponse<Brand[]>>('/api/brands');
    return res.data.data;
  },

  async create(name: string): Promise<Brand> {
    const res = await apiClient.post<ApiResponse<Brand>>('/api/brands', { name });
    return res.data.data;
  },

  async update(id: number, name: string): Promise<Brand> {
    const res = await apiClient.put<ApiResponse<Brand>>(`/api/brands/${id}`, { name });
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<{ id: number; deleted: boolean }>>(`/api/brands/${id}`);
  },
};
