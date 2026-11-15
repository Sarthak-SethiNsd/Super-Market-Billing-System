import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { productService, ProductSummary } from '@/services/productService';
import { billService, BillSummary } from '@/services/billService';
import { Product } from '@/types/catalog';
import { Invoice } from '@/types/billing';
import { InvoiceDetailModal } from '@/components/billing/InvoiceDetailModal';
import {
  ShoppingCart,
  Package,
  Receipt,
  Boxes,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Code2,
  RefreshCw,
  Plus,
  CreditCard,
  CheckCircle2,
  Clock,
  Store
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [productSummary, setProductSummary] = useState<ProductSummary | null>(null);
  const [billSummary, setBillSummary] = useState<BillSummary | null>(null);
  const [recentBills, setRecentBills] = useState<Invoice[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal for inspecting receipt from dashboard
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [pSum, bSum, billsRes, prodsRes] = await Promise.all([
        productService.getSummary(),
        billService.getBillSummary(),
        billService.getBills(6),
        productService.getProducts({ activeOnly: true, limit: 100 }),
      ]);

      setProductSummary(pSum);
      setBillSummary(bSum);
      setRecentBills(billsRes || []);

      // Filter products needing urgent attention (low stock or out of stock)
      const alertItems = (prodsRes.products || [])
        .filter((p) => p.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);
      setLowStockProducts(alertItems);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to refresh dashboard data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived Business Metrics
  const netSales = billSummary?.totalNetInRupees ?? 0;
  const totalBills = billSummary?.totalBills ?? 0;
  const avgBasket = totalBills > 0 ? netSales / totalBills : 0;
  const alertCount = (productSummary?.lowStockCount ?? 0) + (productSummary?.outOfStockCount ?? 0);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Shift Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 text-white shadow-lg relative overflow-hidden border border-slate-700/60">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            Store Operations Active • {isAdmin ? 'Store Manager Mode' : 'Cashier Terminal Mode'}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            ApexMart Supermarket Command Center
          </h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Welcome to the retail workstation. Monitor live stock, process customer purchases at the POS terminal, and review sales performance in real time.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/billing">
              <Button variant="primary" size="md" className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-950/30">
                <ShoppingCart className="w-4 h-4" />
                Open POS Register (Ctrl+K)
              </Button>
            </Link>
            <Link to="/inventory">
              <Button variant="secondary" size="md" className="gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700">
                <Boxes className="w-4 h-4" />
                Stock Control & Adjustments
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={fetchDashboardData}
              className="gap-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs"
              title="Refresh live metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Ambient subtle store icon background */}
        <div className="absolute right-6 -bottom-8 text-slate-800/30 pointer-events-none select-none hidden sm:block">
          <ShoppingCart className="w-64 h-64 -rotate-12" />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Could not load live store metrics: {error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* 4 Retail Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Revenue */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Net Sales
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                ₹{netSales.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-emerald-600 font-medium font-mono">{billSummary?.totalUnitsSold ?? 0}</span>
              <span>units sold across all invoices</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Invoices */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Transactions
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {totalBills}
              </span>
              <span className="text-xs text-slate-500">completed</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Total checkout customer receipts
            </div>
          </CardContent>
        </Card>

        {/* Average Basket Size */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average Basket
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                ₹{avgBasket.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Average revenue per customer sale
            </div>
          </CardContent>
        </Card>

        {/* Inventory Attention Items */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Stock Attention
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                alertCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {alertCount}
              </span>
              <span className="text-xs text-slate-500">items</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-amber-700">{productSummary?.lowStockCount ?? 0} low</span>
              <span>•</span>
              <span className="font-semibold text-rose-700">{productSummary?.outOfStockCount ?? 0} out</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Operations Split: Low Stock Alerts + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Urgent Stock Reorder Alerts (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <Card className="border-slate-200">
            <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Urgent Stock Alerts & Reorder Queue
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Products with critically low or zero remaining inventory
                </CardDescription>
              </div>
              <Link to="/inventory">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <span>All Stock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8"><LoadingSpinner size="md" /></div>
              ) : lowStockProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">Healthy Inventory Levels</p>
                  <p className="text-xs text-slate-400">All products in the supermarket catalog have sufficient stock on hand.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {lowStockProducts.map((p) => {
                    const isOut = p.stock === 0;
                    return (
                      <div key={p.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                              {p.sku}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isOut ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isOut ? 'OUT OF STOCK' : `${p.stock} LEFT`}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 text-sm truncate block">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {p.categoryName} • {p.brandName} • Selling Price: ₹{p.priceInRupees.toFixed(2)}
                          </span>
                        </div>

                        <Link to="/inventory">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 shrink-0 gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Restock
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Recent Completed Sales Ledger (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="border-slate-200">
            <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Recent Customer Invoices
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Latest sales processed through cashier terminals
                </CardDescription>
              </div>
              <Link to="/transactions">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8"><LoadingSpinner size="md" /></div>
              ) : recentBills.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-1">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">No Sales Recorded Today</p>
                  <p className="text-xs text-slate-400">Transactions processed at the POS terminal will appear here immediately.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {recentBills.map((bill) => (
                    <div
                      key={bill.id}
                      onClick={() => setSelectedInvoiceId(bill.id)}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {bill.billNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {bill.items.length} line items • Saved ₹{(bill.totalDiscountInRupees || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-sm font-mono text-slate-900 block">
                          ₹{bill.finalAmountInRupees.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold group-hover:underline">
                          View Receipt
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">Supermarket Workflow Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/billing" className="group">
            <Card className="p-5 h-full hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                POS Billing Terminal
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Scan grocery barcodes, manage cart quantities, calculate change due, and print customer receipts.
              </p>
            </Card>
          </Link>

          <Link to="/products" className="group">
            <Card className="p-5 h-full hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors flex items-center justify-between">
                Product Catalog
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Browse prices, perishable grocery expiry dates, category mappings, and promotional discount strategies.
              </p>
            </Card>
          </Link>

          <Link to="/inventory" className="group">
            <Card className="p-5 h-full hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors flex items-center justify-between">
                Inventory Control
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Record supplier restock shipments, handle shrinkage/damage write-offs, and inspect stock movement history.
              </p>
            </Card>
          </Link>

          <Link to="/transactions" className="group">
            <Card className="p-5 h-full hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                Sales & Invoices
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Search completed receipts by bill number or date, verify transaction snapshots, and reprint customer invoices.
              </p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Architecture & Educational Section Link Card */}
      <Card className="border-slate-200/90 bg-slate-50/60 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              System Architecture & Engineering Specifications
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore the C++17 object-oriented architecture, strategy-pattern discount engine, RAII SQLite persistence models, and interactive simulation modules.
            </p>
          </div>
        </div>
        <Link to="/oop-concepts" className="shrink-0">
          <Button variant="outline" size="sm" className="gap-2 text-xs bg-white text-slate-700 hover:bg-slate-100 border-slate-300">
            <span>Explore Architecture</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </Card>

      {/* Invoice Detail Modal */}
      {selectedInvoiceId && (
        <InvoiceDetailModal
          billId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
};
