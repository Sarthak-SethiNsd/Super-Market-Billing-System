import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { customerService } from '@/services/customerService';
import { Customer, CustomerFormData, CustomerBill } from '@/types/customer';
import {
  Users,
  Search,
  UserPlus,
  Receipt,
  Edit2,
  X,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';

export const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    fullName: '',
    phone: '',
    email: '',
    isActive: true,
  });
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBills, setCustomerBills] = useState<CustomerBill[]>([]);
  const [loadingBills, setLoadingBills] = useState<boolean>(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomers(50, 0, searchQuery);
      setCustomers(res.data);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load customers';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ fullName: '', phone: '', email: '', isActive: true });
    setFormError(null);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      isActive: customer.isActive,
    });
    setFormError(null);
    setShowAddEditModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('Customer name is required');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, formData);
      } else {
        await customerService.createCustomer(formData);
      }
      setShowAddEditModal(false);
      loadCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save customer';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleViewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    setLoadingBills(true);
    try {
      const bills = await customerService.getCustomerBills(customer.id);
      setCustomerBills(bills);
    } catch {
      setCustomerBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#303631] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#285943]" />
            <span>Customer Directory &amp; Loyalty History</span>
          </h2>
          <p className="text-xs text-[#777D76] mt-0.5">
            Manage registered customers, track lifetime expenditure, and audit historic purchase invoices.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-[#285943] hover:bg-[#1E4332] text-white gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Customer</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#ECE7DF] shadow-sm">
        <Search className="w-4 h-4 text-[#777D76]" />
        <input
          type="text"
          placeholder="Search customers by name, phone, or customer code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm outline-none text-[#303631] placeholder-[#777D76]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-[#777D76] hover:text-[#303631] px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Customer List Table */}
      <Card className="border-[#ECE7DF] overflow-hidden">
        <CardHeader className="bg-[#FAF8F5] border-b border-[#ECE7DF] pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#303631]">
                Registered Customers ({totalCount})
              </CardTitle>
              <CardDescription className="text-xs text-[#777D76]">
                All registered customer profiles with automated lifetime spend aggregation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No Customers Found"
                description={searchQuery ? 'No customer matches your search criteria.' : 'No customers have been registered yet.'}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#ECE7DF] bg-[#FAF8F5] text-[#777D76] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">Purchases</th>
                    <th className="py-3 px-4 text-right">Lifetime Spend</th>
                    <th className="py-3 px-4 text-center">Last Purchase</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE7DF] text-[#303631]">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#285943]">
                        {c.customerCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-sm">
                        {c.fullName}
                      </td>
                      <td className="py-3 px-4 text-[#777D76]">
                        <div className="flex flex-col gap-0.5">
                          {c.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#71836A]" /> {c.phone}
                            </span>
                          ) : (
                            <span className="text-[#A3ABA1] italic">No phone</span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Mail className="w-3 h-3 text-[#71836A]" /> {c.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5EAE1] text-[#285943]">
                          <ShoppingBag className="w-3 h-3" /> {c.totalPurchases}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-sm text-[#285943]">
                        ₹{c.lifetimeSpentInRupees.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center text-[#777D76]">
                        {c.lastPurchaseDate ? (
                          <span className="flex items-center justify-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3 text-[#71836A]" />
                            {c.lastPurchaseDate.split(' ')[0]}
                          </span>
                        ) : (
                          <span className="text-[#A3ABA1] italic">Never</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewHistory(c)}
                            className="h-7 px-2.5 text-xs text-[#285943] border-[#71836A]/30 hover:bg-[#FAF8F5] gap-1"
                            title="View Sales History"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Invoices</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(c)}
                            className="h-7 w-7 p-0 text-[#777D76] hover:text-[#303631]"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Customer Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#ECE7DF] overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#ECE7DF] flex items-center justify-between">
              <h3 className="font-bold text-[#303631] text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-[#285943]" />
                <span>{editingCustomer ? 'Edit Customer Details' : 'Register New Customer'}</span>
              </h3>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="text-[#777D76] hover:text-[#303631]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#303631] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-[#ECE7DF] rounded-lg outline-none focus:border-[#285943] text-xs text-[#303631]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#303631] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#ECE7DF] rounded-lg outline-none focus:border-[#285943] text-xs text-[#303631]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#303631] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-[#ECE7DF] rounded-lg outline-none focus:border-[#285943] text-xs text-[#303631]"
                />
              </div>

              {editingCustomer && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="customer-active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-[#ECE7DF] text-[#285943] focus:ring-[#285943]"
                  />
                  <label htmlFor="customer-active" className="text-xs font-semibold text-[#303631]">
                    Active Customer Account
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-[#ECE7DF] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddEditModal(false)}
                  className="border-[#ECE7DF]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-[#285943] hover:bg-[#1E4332] text-white"
                >
                  {formSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#ECE7DF] max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#ECE7DF] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#303631] text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#285943]" />
                  <span>Purchase History — {selectedCustomer.fullName}</span>
                </h3>
                <p className="text-xs text-[#777D76] mt-0.5">
                  Code: <span className="font-mono font-semibold text-[#285943]">{selectedCustomer.customerCode}</span> • Lifetime Total: <span className="font-bold text-[#285943]">₹{selectedCustomer.lifetimeSpentInRupees.toFixed(2)}</span> ({selectedCustomer.totalPurchases} bills)
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-[#777D76] hover:text-[#303631]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingBills ? (
                <div className="p-8 flex justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : customerBills.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No Invoices Found"
                  description="This customer does not have any recorded checkout transactions."
                />
              ) : (
                <div className="space-y-3">
                  {customerBills.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-[#ECE7DF] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#285943]">
                            {b.billNumber}
                          </span>
                          <span className="text-[11px] text-[#777D76] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#71836A]" />
                            {b.createdAt}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-[#285943]">
                            ₹{b.finalAmountInRupees.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#777D76] pt-2 border-t border-[#ECE7DF]">
                        <span>Subtotal: ₹{b.subtotalInRupees.toFixed(2)}</span>
                        <span>Discount: ₹{b.totalDiscountInRupees.toFixed(2)}</span>
                        <span className="font-medium text-[#303631]">
                          Net Billed: ₹{b.finalAmountInRupees.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-[#FAF8F5] border-t border-[#ECE7DF] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryModal(false)}
                className="border-[#ECE7DF]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
