import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Tag,
  DollarSign,
  Package,
  RefreshCw,
  PieChart as PieChartIcon,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Invoice } from '@/types/billing';
import { InventoryMovement } from '@/types/inventory';
import { billService, BillSummary } from '@/services/billService';
import { inventoryService, InventorySummary } from '@/services/inventoryService';

type DateFilter = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'ALL_TIME';

export const AnalyticsPage: React.FC = () => {
  const [bills, setBills] = useState<Invoice[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [billSummary, setBillSummary] = useState<BillSummary | null>(null);
  const [invSummary, setInvSummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL_TIME');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [billsData, movementsData, bSummary, iSummary] = await Promise.all([
        billService.getBills(200),
        inventoryService.getMovements(200),
        billService.getBillSummary(),
        inventoryService.getSummary(),
      ]);
      setBills(billsData || []);
      setMovements(movementsData || []);
      setBillSummary(bSummary);
      setInvSummary(iSummary);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch analytics datasets from server.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Date Filtering Logic
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();

    if (dateFilter === 'TODAY') {
      cutoffDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'LAST_7_DAYS') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (dateFilter === 'LAST_30_DAYS') {
      cutoffDate.setDate(now.getDate() - 30);
    } else {
      cutoffDate.setFullYear(2000); // All time
    }

    const filteredBills = bills.filter((b) => new Date(b.createdAt) >= cutoffDate);
    const filteredMovements = movements.filter((m) => new Date(m.createdAt) >= cutoffDate);

    return { filteredBills, filteredMovements };
  }, [bills, movements, dateFilter]);

  const { filteredBills, filteredMovements } = filteredData;

  // Real KPI Aggregations (Database-side for ALL_TIME, slice-aggregated for sub-periods)
  const isAllTime = dateFilter === 'ALL_TIME' && billSummary !== null;
  const totalBills = isAllTime ? billSummary.totalBills : filteredBills.length;
  const grossRevenue = isAllTime ? billSummary.totalGrossInRupees : filteredBills.reduce((acc, b) => acc + (b.subtotalInRupees || 0), 0);
  const totalDiscounts = isAllTime ? billSummary.totalDiscountInRupees : filteredBills.reduce((acc, b) => acc + (b.totalDiscountInRupees || 0), 0);
  const netRevenue = isAllTime ? billSummary.totalNetInRupees : filteredBills.reduce((acc, b) => acc + (b.finalAmountInRupees || 0), 0);
  const averageBillValue = totalBills > 0 ? netRevenue / totalBills : 0;

  // Total items sold from snapshot items
  const totalItemsSold = isAllTime ? billSummary.totalUnitsSold : filteredBills.reduce((acc, b) => {
    const itemsCount = b.items?.reduce((iAcc, item) => iAcc + item.quantity, 0) || 0;
    return acc + itemsCount;
  }, 0);

  // Time-Series Revenue Chart Data (grouped by date)
  const revenueTrendData = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; gross: number; discounts: number; count: number }>();

    // Sort chronologically
    const sorted = [...filteredBills].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sorted.forEach((b) => {
      const d = new Date(b.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      const existing = map.get(d) || { date: d, revenue: 0, gross: 0, discounts: 0, count: 0 };
      existing.revenue += b.finalAmountInRupees;
      existing.gross += b.subtotalInRupees;
      existing.discounts += b.totalDiscountInRupees;
      existing.count += 1;
      map.set(d, existing);
    });

    return Array.from(map.values());
  }, [filteredBills]);

  // Product Performance Data (Top 5 Best-selling items by revenue)
  const topProductsData = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();

    filteredBills.forEach((b) => {
      b.items?.forEach((item) => {
        const existing = map.get(item.productName) || {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.lineTotalInRupees;
        map.set(item.productName, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredBills]);

  // Inventory Movement Breakdown Data (All-time from database summary or filtered movements)
  const movementBreakdownData = useMemo(() => {
    const counts = {
      SALE: (dateFilter === 'ALL_TIME' && invSummary) ? invSummary.totalSales : 0,
      ADDITION: (dateFilter === 'ALL_TIME' && invSummary) ? invSummary.totalAdditions : 0,
      REDUCTION: (dateFilter === 'ALL_TIME' && invSummary) ? invSummary.totalReductions : 0,
      ADJUSTMENT: (dateFilter === 'ALL_TIME' && invSummary) ? invSummary.totalAdjustments : 0,
    };

    if (dateFilter !== 'ALL_TIME' || !invSummary) {
      filteredMovements.forEach((m) => {
        if (counts[m.movementType] !== undefined) {
          counts[m.movementType] += 1;
        }
      });
    }

    return [
      { name: 'Sales (Checkout)', value: counts.SALE, color: '#3b82f6' },
      { name: 'Restock (Addition)', value: counts.ADDITION, color: '#10b981' },
      { name: 'Reductions', value: counts.REDUCTION, color: '#f43f5e' },
      { name: 'Adjustments', value: counts.ADJUSTMENT, color: '#8b5cf6' },
    ].filter((item) => item.value > 0);
  }, [filteredMovements, dateFilter, invSummary]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Executive Sales & Inventory Analytics
          </h2>
          <p className="text-sm text-slate-500">
            Real-time business intelligence calculated directly from immutable SQLite invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(
              [
                { label: 'Today', value: 'TODAY' },
                { label: '7 Days', value: 'LAST_7_DAYS' },
                { label: '30 Days', value: 'LAST_30_DAYS' },
                { label: 'All Time', value: 'ALL_TIME' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setDateFilter(tab.value)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  dateFilter === tab.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs text-slate-600 hover:text-slate-900 gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Net Revenue
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{netRevenue.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">{isAllTime ? 'Verified database total' : 'In filtered period'}</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Total Orders
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {totalBills}
          </div>
          <span className="text-[11px] text-slate-400">{isAllTime ? 'All-time verified' : 'In filtered period'}</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-blue-600" />
            Units Sold
          </div>
          <div className="text-2xl font-extrabold text-blue-700 font-mono">
            {totalItemsSold}
          </div>
          <span className="text-[11px] text-slate-400">{isAllTime ? 'All units checked out' : 'In filtered period'}</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Average Order (AOV)
          </div>
          <div className="text-2xl font-extrabold text-purple-700 font-mono">
            ₹{averageBillValue.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">Per bill average</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4 text-amber-600" />
            Discounts Given
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            ₹{totalDiscounts.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">{isAllTime ? 'Total strategy savings' : 'In filtered period'}</span>
        </Card>
      </div>

      {isLoading ? (
        <Card className="p-16">
          <LoadingSpinner size="lg" />
        </Card>
      ) : totalBills === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No Sales Transactions Recorded"
          description="Complete orders in the POS Billing Terminal to generate real revenue and sales analytics."
        />
      ) : (
        <div className="space-y-6">
          {/* Main Revenue Trend Chart */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Revenue & Sales Timeline
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparison between Gross Sales and Net Paid Revenue over time
                  </CardDescription>
                </div>
                <Badge variant="default" className="text-xs font-mono">
                  Gross: ₹{grossRevenue.toFixed(2)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(val: number) => [`₹${val.toFixed(2)}`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="gross"
                      name="Gross Sales"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorGross)"
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Net Paid Revenue"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Dual Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products by Revenue */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Top Selling Products by Revenue
                </CardTitle>
                <CardDescription className="text-xs">
                  Derived from historical snapshot items in finalized bills
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {topProductsData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                    No product sales data available for this range
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={90} />
                        <Tooltip
                          formatter={(val: number) => [`₹${val.toFixed(2)}`, 'Revenue']}
                          contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory Movements Breakdown Donut */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-600" />
                  Inventory Event Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Breakdown of all logged inventory movement types
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {movementBreakdownData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                    No movement events found
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={movementBreakdownData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                        >
                          {movementBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number) => [`${val} events`, 'Volume']}
                          contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
