import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  History,
  Sliders,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Wrench,
  AlertTriangle,
  Package
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product } from '@/types/catalog';
import { InventoryMovement, MovementType } from '@/types/inventory';
import { productService, ProductSummary } from '@/services/productService';
import { inventoryService, InventorySummary } from '@/services/inventoryService';
import { useAuth } from '@/context/AuthContext';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';

export const InventoryPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSummary | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');

  // Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [prodRes, moveRes, prodSum, invSum] = await Promise.all([
        productService.getProducts({ activeOnly: true, limit: 200 }),
        inventoryService.getMovements(100),
        productService.getSummary(),
        inventoryService.getSummary(),
      ]);

      setProducts(prodRes.products || []);
      setMovements(moveRes || []);
      setProductSummary(prodSum);
      setInventorySummary(invSum);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch inventory records.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Map products for fast lookup by ID
  const productMap = new Map<number, Product>();
  products.forEach((p) => productMap.set(p.id, p));

  // Database-Verified Real Statistics
  const totalActiveProducts = productSummary?.totalActiveProducts ?? products.length;
  const totalStockUnits = productSummary?.totalStockUnits ?? products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = productSummary?.lowStockCount ?? products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = productSummary?.outOfStockCount ?? products.filter((p) => p.stock === 0).length;

  // Filtered movements
  const filteredMovements = movements.filter((m) => {
    const product = productMap.get(m.productId);
    const prodName = product ? product.name.toLowerCase() : '';
    const prodSku = product ? product.sku.toLowerCase() : '';
    const reasonText = m.reason.toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = !q || prodName.includes(q) || prodSku.includes(q) || reasonText.includes(q);
    const matchesType = selectedType === 'ALL' || m.movementType === selectedType;
    const matchesProduct = selectedProductId === 'ALL' || m.productId === Number(selectedProductId);

    return matchesSearch && matchesType && matchesProduct;
  });

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case 'ADDITION':
        return (
          <Badge variant="success" className="gap-1 text-[10px]">
            <ArrowUpRight className="w-3 h-3" />
            ADDITION
          </Badge>
        );
      case 'REDUCTION':
        return (
          <Badge variant="danger" className="gap-1 text-[10px]">
            <ArrowDownRight className="w-3 h-3" />
            REDUCTION
          </Badge>
        );
      case 'SALE':
        return (
          <Badge variant="default" className="gap-1 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
            <ShoppingCart className="w-3 h-3" />
            SALE (POS)
          </Badge>
        );
      case 'ADJUSTMENT':
        return (
          <Badge variant="default" className="gap-1 text-[10px] bg-purple-50 text-purple-700 border-purple-200">
            <Wrench className="w-3 h-3" />
            ADJUSTMENT
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-600" />
            Inventory Stock & Movement Auditing
          </h2>
          <p className="text-sm text-slate-500">
            Real-time physical stock metrics and complete historical movement audit ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs text-slate-600 hover:text-slate-900 gap-1.5"
            title="Refresh inventory"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {isAdmin ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAdjustModalOpen(true)}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Sliders className="w-4 h-4" />
              Adjust Stock
            </Button>
          ) : (
            <Badge variant="staff">Staff Mode (Audit View Only)</Badge>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Real Inventory Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-blue-600" />
            Active SKUs
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {totalActiveProducts}
          </div>
          <span className="text-[11px] text-slate-400">Total catalog products</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4 text-emerald-600" />
            Total Stock Units
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {totalStockUnits}
          </div>
          <span className="text-[11px] text-slate-400">Physical units in store</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Low Stock Alerts
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            {lowStockCount}
          </div>
          <span className="text-[11px] text-slate-400">≤ 5 units remaining</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Out of Stock
          </div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono">
            {outOfStockCount}
          </div>
          <span className="text-[11px] text-slate-400">Requires restocking</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movements by product name, SKU, or audit reason..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="ALL">All Movement Types</option>
                <option value="SALE">Sales (Checkout)</option>
                <option value="ADDITION">Additions (Restock)</option>
                <option value="REDUCTION">Reductions (Loss/Damage)</option>
                <option value="ADJUSTMENT">Manual Adjustments</option>
              </select>

              {/* Product Filter */}
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-xs truncate"
              >
                <option value="ALL">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Audit Log Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              Stock Movement Audit Log
            </CardTitle>
            <CardDescription className="text-xs">
              Immutable ledger from <code className="font-mono text-slate-700">inventory_movements</code> table
            </CardDescription>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredMovements.length} events {inventorySummary ? `• Total in ledger: ${inventorySummary.totalMovements}` : ''}
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredMovements.length === 0 ? (
            <EmptyState
              icon={History}
              title="No Movement Records Found"
              description={
                searchQuery || selectedType !== 'ALL' || selectedProductId !== 'ALL'
                  ? 'No audit entries match the current filter criteria.'
                  : 'No inventory movements have been recorded yet.'
              }
              className="border-0 p-12"
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Qty Change</th>
                  <th className="py-3 px-4 text-center">Previous → New</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMovements.map((m) => {
                  const product = productMap.get(m.productId);
                  const isPositive = m.quantityChange > 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-400">
                        #{m.id}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {product ? product.name : `Product ID #${m.productId}`}
                        </span>
                        {product && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {product.sku} • {product.brandName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getMovementBadge(m.movementType)}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-600 whitespace-nowrap">
                        <span>{m.previousStock}</span>
                        <span className="mx-1.5 text-slate-400">→</span>
                        <span className="font-bold text-slate-900">{m.newStock}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        <span title={m.reason}>{m.reason}</span>
                        {m.relatedBillId && (
                          <span className="block text-[10px] text-blue-600 font-mono">
                            Linked Invoice ID: #{m.relatedBillId}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onAdjusted={() => {
          showSuccess('Stock adjustment committed successfully to SQLite.');
          fetchData();
        }}
        products={products}
      />
    </div>
  );
};
