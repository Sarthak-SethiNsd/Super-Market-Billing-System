import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Receipt,
  Boxes,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Code2,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { InvoiceDetailModal } from '@/components/billing/InvoiceDetailModal';
import { billService, BillSummary } from '@/services/billService';
import { productService, ProductSummary } from '@/services/productService';
import { Invoice } from '@/types/billing';
import { Product } from '@/types/catalog';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isStaff, isLoading: isAuthLoading, logoutStaff } = useAuth();
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  // Operational Datasets
  const [bills, setBills] = useState<Invoice[]>([]);
  const [billSummary, setBillSummary] = useState<BillSummary | null>(null);
  const [productSummary, setProductSummary] = useState<ProductSummary | null>(null);
  const [alertProducts, setAlertProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d' | 'all'>('7d');

  // Immediately redirect to Staff Login if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isStaff) {
      navigate('/staff/login', { state: { from: location }, replace: true });
    }
  }, [isAuthLoading, isStaff, navigate, location]);

  const fetchDashboardData = useCallback(async () => {
    if (!isStaff) return;
    try {
      setIsLoading(true);
      setError(null);

      const [billsRes, bSummaryRes, pSummaryRes, prodsRes] = await Promise.all([
        billService.getBills(100, 0),
        billService.getBillSummary(),
        productService.getSummary(),
        productService.getProducts({ activeOnly: true, limit: 100 }),
      ]);

      setBills(billsRes || []);
      setBillSummary(bSummaryRes || null);
      setProductSummary(pSummaryRes || null);

      // Low stock (1-5 units) and out of stock (0 units)
      const alerts = (prodsRes?.products || []).filter((p: Product) => p.stock <= 5);
      setAlertProducts(alerts);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes('401') || msg.includes('authentication') || msg.includes('token') || msg.includes('permissions') || msg.includes('unauthorized')) {
          await logoutStaff();
          navigate('/staff/login', { state: { from: location, sessionExpired: true }, replace: true });
          return;
        }
        setError(err.message);
      } else {
        setError('Failed to fetch dashboard operational data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isStaff, logoutStaff, navigate, location]);

  useEffect(() => {
    if (isStaff) {
      fetchDashboardData();
    }
  }, [isStaff, fetchDashboardData]);

  // Current formatted date string
  const currentFormattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
  }, []);

  // Today's Sales & Bills Aggregation
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayBills = useMemo(() => {
    return bills.filter((b) => new Date(b.createdAt) >= todayStart);
  }, [bills, todayStart]);

  const todaySales = useMemo(() => {
    return todayBills.reduce((acc, b) => acc + (b.finalAmountInRupees || 0), 0);
  }, [todayBills]);

  const todayBillCount = todayBills.length;

  // Recent 6 Transactions
  const recentBills = useMemo(() => {
    return [...bills]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [bills]);

  // Top 5 Selling Products Aggregated from Invoices
  const topSellingProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();

    bills.forEach((b) => {
      b.items?.forEach((item) => {
        const existing = map.get(item.productName) || {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += (item.lineTotalInRupees || 0);
        map.set(item.productName, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5);
  }, [bills]);

  const maxTopSellingUnits = useMemo(() => {
    return topSellingProducts.length > 0 ? Math.max(...topSellingProducts.map((p) => p.quantity)) : 1;
  }, [topSellingProducts]);

  // Sales Trend Chart Data
  const salesChartData = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; bills: number; timestamp: number }>();
    const now = new Date();
    const days = chartTimeframe === '7d' ? 7 : chartTimeframe === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    // Pre-populate last 7 days for continuous chart line
    if (chartTimeframe === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        map.set(label, { date: label, revenue: 0, bills: 0, timestamp: d.getTime() });
      }
    }

    bills.forEach((b) => {
      const billDate = new Date(b.createdAt);
      if (chartTimeframe !== 'all' && billDate < cutoff) return;

      const label = billDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const existing = map.get(label) || { date: label, revenue: 0, bills: 0, timestamp: billDate.getTime() };
      existing.revenue += (b.finalAmountInRupees || 0);
      existing.bills += 1;
      map.set(label, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [bills, chartTimeframe]);

  if (isLoading && bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-semibold text-[#777D76]">Loading operational telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. COMPACT PAGE HEADING (Requirement 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-[#E5E4DC]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#303631]">
              Dashboard Overview
            </h1>
            <Badge variant="staff" className="text-[10px] sm:text-[11px] font-semibold py-0.5 px-2 bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8]">
              Staff Mode
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#777D76] mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#71836A] shrink-0" />
            <span>{currentFormattedDate}</span>
            <span>•</span>
            <span>Active Role: <strong className="text-[#303631] font-semibold">{isStaff ? 'STAFF' : role}</strong></span>
          </div>
        </div>

        {/* Compact Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link to="/billing">
            <Button variant="primary" size="sm" className="gap-1.5 text-xs font-bold shadow-xs h-7 sm:h-8 px-2.5 sm:px-3">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>New Bill</span>
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 sm:h-8 px-2 sm:px-2.5">
              <Package className="w-3.5 h-3.5 text-[#71836A]" />
              <span className="hidden sm:inline">Products</span>
            </Button>
          </Link>
          <Link to="/inventory">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 sm:h-8 px-2 sm:px-2.5">
              <Boxes className="w-3.5 h-3.5 text-[#71836A]" />
              <span className="hidden sm:inline">Inventory</span>
            </Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="gap-1 text-xs h-7 sm:h-8 px-2 sm:px-2.5 hover:text-[#285943]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#285943]" />
              <span className="hidden md:inline">Staff Hub</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="text-[#777D76] hover:text-[#303631] h-7 sm:h-8 w-7 sm:w-8 p-0"
            title={`Refresh telemetry (${lastRefreshed.toLocaleTimeString()})`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ERROR BANNER IF ANY */}
      {error && (
        <div className="p-2.5 sm:p-3 rounded bg-[#F8EFEF] border border-[#ECD1D0] text-[#A63A38] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchDashboardData} className="text-xs font-bold text-[#A63A38] hover:bg-[#ECD1D0]/30 h-7 px-2">
            Retry
          </Button>
        </div>
      )}

      {/* 2. COMPACT 5-CARD OPERATIONAL KPI GRID (Requirement 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {/* KPI 1: Today's Sales */}
        <Card className="col-span-1 bg-[#F4F9F6] border-[#D4E8DC] shadow-xs">
          <CardContent className="p-2.5 sm:p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[#777D76]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#285943]">Today's Sales</span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-[#EEF5F0] text-[#285943] flex items-center justify-center shrink-0">
                <CreditCard className="w-3 h-3" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-[#303631] leading-tight">
              ₹{todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#71836A] truncate pt-1 border-t border-[#D4E8DC]">
              Gross: ₹{(billSummary?.totalNetInRupees || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Today's Bills */}
        <Card className="col-span-1 bg-white border-[#DCDAD0] shadow-xs">
          <CardContent className="p-2.5 sm:p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[#777D76]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#303631]">Today's Bills</span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-[#EEF5F0] text-[#285943] flex items-center justify-center shrink-0">
                <Receipt className="w-3 h-3" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-[#303631] leading-tight">
              {todayBillCount}
            </div>
            <div className="text-[10px] text-[#777D76] truncate pt-1 border-t border-[#E5E4DC]">
              {billSummary?.totalBills || 0} lifetime bills
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Total Products */}
        <Card className="col-span-1 bg-white border-[#DCDAD0] shadow-xs">
          <CardContent className="p-2.5 sm:p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[#777D76]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#303631]">Total Products</span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-[#EEF5F0] text-[#285943] flex items-center justify-center shrink-0">
                <Package className="w-3 h-3" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-[#303631] leading-tight flex items-baseline justify-between">
              <span>{productSummary?.totalActiveProducts || 0}</span>
              <Link to="/products" className="text-[10px] text-[#285943] hover:underline font-semibold flex items-center">
                <span>Catalog</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="text-[10px] text-[#777D76] truncate pt-1 border-t border-[#E5E4DC]">
              {productSummary?.totalStockUnits || 0} in stock
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Low Stock */}
        <Card className={`col-span-1 shadow-xs ${(productSummary?.lowStockCount || 0) > 0 ? 'bg-[#FFFDF9] border-[#F0DDC5]' : 'bg-white border-[#DCDAD0]'}`}>
          <CardContent className="p-2.5 sm:p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[#777D76]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C87D20]">Low Stock</span>
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center shrink-0 ${(productSummary?.lowStockCount || 0) > 0 ? 'bg-[#FAF3EA] text-[#C87D20]' : 'bg-[#EEF5F0] text-[#2E6F40]'}`}>
                <AlertTriangle className="w-3 h-3" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-[#C87D20] leading-tight flex items-baseline justify-between">
              <span>{productSummary?.lowStockCount || 0}</span>
              <Link to="/inventory" className="text-[10px] text-[#C87D20] hover:underline font-semibold flex items-center">
                <span>Manage</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="text-[10px] text-[#777D76] truncate pt-1 border-t border-[#E5E4DC]">
              {(productSummary?.lowStockCount || 0) > 0 ? (
                <span className="text-[#C87D20] font-semibold">{productSummary?.lowStockCount} items low</span>
              ) : (
                <span className="text-[#2E6F40]">Optimal stock</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Out of Stock */}
        <Card className={`col-span-2 sm:col-span-1 lg:col-span-1 shadow-xs ${(productSummary?.outOfStockCount || 0) > 0 ? 'bg-[#FFFBFB] border-[#ECD1D0]' : 'bg-white border-[#DCDAD0]'}`}>
          <CardContent className="p-2.5 sm:p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[#777D76]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#303631]">Out of Stock</span>
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center shrink-0 ${(productSummary?.outOfStockCount || 0) > 0 ? 'bg-[#F8EFEF] text-[#A63A38]' : 'bg-[#EEF5F0] text-[#2E6F40]'}`}>
                {(productSummary?.outOfStockCount || 0) > 0 ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
              </div>
            </div>
            <div className={`text-base sm:text-xl font-bold leading-tight ${(productSummary?.outOfStockCount || 0) > 0 ? 'text-[#A63A38]' : 'text-[#303631]'}`}>
              {productSummary?.outOfStockCount || 0}
            </div>
            <div className="text-[10px] text-[#777D76] truncate pt-1 border-t border-[#E5E4DC]">
              {(productSummary?.outOfStockCount || 0) > 0 ? (
                <span className="text-[#A63A38] font-semibold">Immediate reorder</span>
              ) : (
                <span className="text-[#2E6F40]">Zero stockouts</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. BALANCED TWO-COLUMN SECTION (Requirement 5): Sales Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start">
        {/* Left Column (7 cols): Sales Overview Chart */}
        <Card className="lg:col-span-7 bg-white border-[#DCDAD0] shadow-xs">
          <CardHeader className="py-2.5 sm:py-3 px-3.5 sm:px-4 border-b border-[#E5E4DC]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#303631]">
                  <TrendingUp className="w-4 h-4 text-[#285943]" />
                  Sales Overview
                </CardTitle>
                <CardDescription className="text-xs">Net revenue &amp; transaction trend</CardDescription>
              </div>

              {/* Timeframe Controls */}
              <div className="flex items-center gap-1 rounded bg-[#F7F6F1] p-0.5 border border-[#E5E4DC]">
                <button
                  type="button"
                  onClick={() => setChartTimeframe('7d')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${chartTimeframe === '7d' ? 'bg-white text-[#285943] shadow-xs' : 'text-[#777D76] hover:text-[#303631]'}`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setChartTimeframe('30d')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${chartTimeframe === '30d' ? 'bg-white text-[#285943] shadow-xs' : 'text-[#777D76] hover:text-[#303631]'}`}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setChartTimeframe('all')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${chartTimeframe === 'all' ? 'bg-white text-[#285943] shadow-xs' : 'text-[#777D76] hover:text-[#303631]'}`}
                >
                  All Time
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {salesChartData.length === 0 || salesChartData.every((d) => d.revenue === 0) ? (
              <div className="h-44 sm:h-56 flex flex-col items-center justify-center text-center p-4">
                <TrendingUp className="w-8 h-8 text-[#71836A]/40 mb-1.5" />
                <p className="text-xs font-semibold text-[#303631]">No sales in selected period</p>
                <p className="text-[11px] text-[#777D76] mt-0.5">Recorded purchases will dynamically populate this chart.</p>
              </div>
            ) : (
              <div className="h-44 sm:h-56 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                  <AreaChart data={salesChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#285943" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#285943" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E4DC" />
                    <XAxis
                      dataKey="date"
                      stroke="#777D76"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      width={35}
                      stroke="#777D76"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(val: number) => [`₹${val.toFixed(2)}`, 'Revenue']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E4DC',
                        borderRadius: '6px',
                        fontSize: '11px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#285943"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column (5 cols): Recent Transactions */}
        <Card className="lg:col-span-5 bg-white border-[#DCDAD0] shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-[#E5E4DC]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#303631]">
                  <Receipt className="w-4 h-4 text-[#285943]" />
                  Recent Transactions
                </CardTitle>
                <CardDescription className="text-xs">Latest customer purchases</CardDescription>
              </div>
              <Link to="/transactions" className="text-xs font-semibold text-[#285943] hover:underline flex items-center gap-0.5">
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentBills.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#777D76]">
                <Receipt className="w-6 h-6 text-[#71836A]/40 mx-auto mb-1.5" />
                No invoices recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F5] text-[#777D76] border-b border-[#E5E4DC]">
                      <th className="py-2 px-3 font-semibold whitespace-nowrap">Bill #</th>
                      <th className="py-2 px-3 font-semibold whitespace-nowrap">Customer</th>
                      <th className="py-2 px-3 font-semibold text-right whitespace-nowrap">Amount</th>
                      <th className="py-2 px-3 font-semibold text-center whitespace-nowrap">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DC]">
                    {recentBills.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FAF9F5]/80 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-[#303631] text-[11px] whitespace-nowrap">
                          {b.billNumber}
                        </td>
                        <td className="py-2 px-3 text-[#303631] truncate max-w-[110px] whitespace-nowrap">
                          {b.customerName || <span className="text-[#777D76] italic">Walk-in</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#2E6F40] whitespace-nowrap">
                          ₹{b.finalAmountInRupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedBillId(b.id)}
                            className="text-[11px] font-semibold text-[#285943] hover:underline hover:text-[#1e4433] cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. BALANCED SECOND ROW (Requirement 6): Top-Selling Products & Actionable Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start">
        {/* Column 1 (6 cols): Top-Selling Products */}
        <Card className="lg:col-span-6 bg-white border-[#DCDAD0] shadow-xs">
          <CardHeader className="py-2.5 sm:py-3 px-3.5 sm:px-4 border-b border-[#E5E4DC]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#303631]">
                  <Package className="w-4 h-4 text-[#285943]" />
                  Top-Selling Products
                </CardTitle>
                <CardDescription className="text-xs">Highest volume items from completed bills</CardDescription>
              </div>
              <Link to="/analytics" className="text-xs font-semibold text-[#285943] hover:underline flex items-center gap-0.5">
                <span>Analytics</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 space-y-2 sm:space-y-2.5">
            {topSellingProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#777D76]">
                <Package className="w-6 h-6 text-[#71836A]/40 mx-auto mb-1" />
                No product sales data recorded yet.
              </div>
            ) : (
              topSellingProducts.map((p, idx) => {
                const pct = Math.round((p.quantity / maxTopSellingUnits) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate mr-2">
                        <span className="w-4 h-4 rounded-full bg-[#FAF9F5] border border-[#E5E4DC] text-[10px] font-bold text-[#777D76] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-[#303631] truncate text-[11px]">{p.name}</span>
                      </div>
                      <div className="text-right shrink-0 text-[11px]">
                        <span className="font-bold text-[#303631]">{p.quantity} sold</span>
                        <span className="text-[#777D76] ml-1.5">(₹{p.revenue.toFixed(2)})</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#FAF9F5] rounded-full h-1.5 overflow-hidden border border-[#E5E4DC]">
                      <div
                        className="bg-[#285943] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Column 2 (6 cols): Actionable Inventory Alerts */}
        <Card className="lg:col-span-6 bg-white border-[#DCDAD0] shadow-xs">
          <CardHeader className="py-2.5 sm:py-3 px-3.5 sm:px-4 border-b border-[#E5E4DC]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#303631]">
                  <Boxes className="w-4 h-4 text-[#285943]" />
                  Inventory Attention Alerts
                </CardTitle>
                <CardDescription className="text-xs">Products requiring restock or adjustment</CardDescription>
              </div>
              <Link to="/inventory" className="text-xs font-semibold text-[#285943] hover:underline flex items-center gap-0.5">
                <span>Inventory Manager</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 space-y-2">
            {alertProducts.length === 0 ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#2E6F40]">
                <CheckCircle2 className="w-4 h-4" />
                <span>All product inventory levels are currently healthy!</span>
              </div>
            ) : (
              alertProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="p-2.5 rounded bg-[#FAF9F5] border border-[#E5E4DC] flex items-center justify-between text-xs">
                  <div className="truncate mr-2">
                    <div className="font-bold text-[#303631] truncate text-[11px]">{p.name}</div>
                    <div className="text-[10px] text-[#777D76]">
                      SKU: <span className="font-mono">{p.sku}</span> • {p.categoryName || 'General'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={p.stock === 0 ? 'danger' : 'warning'} className="text-[10px]">
                      {p.stock === 0 ? '0 Stock' : `${p.stock} units left`}
                    </Badge>
                    <Link
                      to="/inventory"
                      className="text-[10px] text-[#285943] hover:underline font-bold flex items-center gap-0.5"
                    >
                      <span>Adjust</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. DISCRETE ACADEMIC REFERENCE BANNER (Requirement 4) */}
      <div className="p-3.5 rounded bg-white border border-[#E5E4DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#1f3029] text-white flex items-center justify-center shrink-0">
            <Code2 className="w-3.5 h-3.5 text-[#d6e2dc]" />
          </div>
          <div>
            <span className="font-bold text-[#303631] block">
              Academic Reference: C++17 OOP Architecture Explorer
            </span>
            <span className="text-[11px] text-[#777D76]">
              Educational breakdown of OOP principles, inheritance hierarchies, and dynamic polymorphism.
            </span>
          </div>
        </div>

        <Link to="/oop-concepts" className="shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-[#303631] hover:text-[#285943] h-7 px-2.5">
            <Code2 className="w-3 h-3 text-[#285943]" />
            <span>Open C++ Explorer</span>
          </Button>
        </Link>
      </div>

      {/* Modals */}
      <InvoiceDetailModal
        billId={selectedBillId}
        onClose={() => setSelectedBillId(null)}
      />
    </div>
  );
};

export default DashboardPage;
