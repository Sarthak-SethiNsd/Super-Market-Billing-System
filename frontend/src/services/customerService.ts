import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { Customer, CustomerFormData, CustomerBill } from '@/types/customer';

export const customerService = {
  async getCustomers(limit: number = 50, offset: number = 0, query: string = ''): Promise<{ data: Customer[]; totalCount: number }> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    if (query.trim()) params.set('q', query.trim());

    const res = await apiClient.get<ApiResponse<Customer[]>>(`/api/customers?${params.toString()}`);
    const totalCount = parseInt(res.headers['x-total-count'] || '0', 10);
    return { data: res.data.data, totalCount };
  },

  async getCustomerById(id: number): Promise<Customer> {
    const res = await apiClient.get<ApiResponse<Customer>>(`/api/customers/${id}`);
    return res.data.data;
  },

  async createCustomer(data: CustomerFormData): Promise<Customer> {
    const res = await apiClient.post<ApiResponse<Customer>>('/api/customers', data);
    return res.data.data;
  },

  async updateCustomer(id: number, data: Partial<CustomerFormData>): Promise<Customer> {
    const res = await apiClient.put<ApiResponse<Customer>>(`/api/customers/${id}`, data);
    return res.data.data;
  },

  async getCustomerBills(id: number, limit: number = 50, offset: number = 0): Promise<CustomerBill[]> {
    const res = await apiClient.get<ApiResponse<CustomerBill[]>>(`/api/customers/${id}/bills?limit=${limit}&offset=${offset}`);
    return res.data.data;
  },
};
