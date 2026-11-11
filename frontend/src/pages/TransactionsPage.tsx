import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Search,
  Eye,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  CreditCard,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Invoice } from '@/types/billing';
import { billService, BillSummary } from '@/services/billService';
import { InvoiceDetailModal } from '@/components/billing/InvoiceDetailModal';

export const TransactionsPage: React.FC = () => {
  const [bills, setBills] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'NEWEST' | 'OLDEST' | 'AMOUNT_HIGH' | 'AMOUNT_LOW'>('NEWEST');

  // Modal inspection
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  const fetchBills = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [data, summaryData] = await Promise.all([
        billService.getBills(100),
        billService.getBillSummary(),
      ]);
      setBills(data || []);
      setSummary(summaryData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch transaction records from server.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Aggregate Real Financial Metrics from Database
  const totalBillsCount = summary?.totalBills ?? bills.length;
  const grossRevenue = summary?.totalGrossInRupees ?? bills.reduce((acc, b) => acc + (b.subtotalInRupees || 0), 0);
  const totalPromotions = summary?.totalDiscountInRupees ?? bills.reduce((acc, b) => acc + (b.totalDiscountInRupees || 0), 0);
  const netRevenue = summary?.totalNetInRupees ?? bills.reduce((acc, b) => acc + (b.finalAmountInRupees || 0), 0);

  // Filter & Sort
  const filteredBills = bills
    .filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        b.billNumber.toLowerCase().includes(q) ||
        new Date(b.createdAt).toLocaleString().toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortOption === 'NEWEST') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'OLDEST') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === 'AMOUNT_HIGH') {
        return b.finalAmountInRupees - a.finalAmountInRupees;
      }
      if (sortOption === 'AMOUNT_LOW') {
        return a.finalAmountInRupees - b.finalAmountInRupees;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Transaction History & Invoices
          </h2>
          <p className="text-sm text-slate-500">
            Immutable customer sales ledger with frozen historical snapshots in SQLite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBills}
            className="text-xs text-slate-600 hover:text-slate-900 gap-1.5"
            title="Refresh Invoices"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Badge variant="default" className="font-mono text-xs">
            {totalBillsCount} Invoices Filed
          </Badge>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Completed Bills
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {totalBillsCount}
          </div>
          <span className="text-[11px] text-slate-400">Archived transactions</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Gross Sales
          </div>
          <div className="text-2xl font-extrabold text-blue-700 font-mono">
            ₹{grossRevenue.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">Before promotional discounts</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4 text-emerald-600" />
            Promotions Given
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{totalPromotions.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">C++ Strategy savings</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4 text-purple-600" />
            Net Revenue
          </div>
          <div className="text-2xl font-extrabold text-purple-700 font-mono">
            ₹{netRevenue.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">Total collected amount</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice number (e.g. INV-2026...)..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort:</span>
              </div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="AMOUNT_HIGH">Amount: High to Low</option>
                <option value="AMOUNT_LOW">Amount: Low to High</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              Filed Customer Invoices
            </CardTitle>
            <CardDescription className="text-xs">
              Every invoice preserves the exact line item pricing at time of purchase
            </CardDescription>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredBills.length} records found
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredBills.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Invoices Found"
              description={
                searchQuery
                  ? `No invoices match "${searchQuery}".`
                  : 'No customer checkout transactions have been recorded yet.'
              }
              className="border-0 p-12"
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Promotions</th>
                  <th className="py-3 px-4 text-right">Final Paid</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBills.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBillId(b.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-indigo-600 whitespace-nowrap">
                      {b.billNumber}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {b.items?.length || 0} items
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                      ₹{b.subtotalInRupees.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 whitespace-nowrap">
                      {b.totalDiscountInRupees > 0 ? `- ₹${b.totalDiscountInRupees.toFixed(2)}` : '₹0.00'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                      ₹{b.finalAmountInRupees.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBillId(b.id);
                        }}
                        className="text-xs text-indigo-700 hover:bg-indigo-50 border-indigo-200 gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Inspector Modal */}
      <InvoiceDetailModal
        billId={selectedBillId}
        onClose={() => setSelectedBillId(null)}
      />
    </div>
  );
};
