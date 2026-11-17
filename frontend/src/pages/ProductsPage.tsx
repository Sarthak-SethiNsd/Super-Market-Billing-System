import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product, Brand, Category } from '@/types/catalog';
import { productService } from '@/services/productService';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { useAuth } from '@/context/AuthContext';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { ProductDeleteModal } from '@/components/products/ProductDeleteModal';

export const ProductsPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const fetchFilters = useCallback(async () => {
    try {
      const [bData, cData] = await Promise.all([
        brandService.getAll(),
        categoryService.getAll(),
      ]);
      setBrands(bData);
      setCategories(cData);
    } catch {
      // Non-fatal if filters fail
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await productService.getProducts({
        q: searchQuery.trim() || undefined,
        brandId: selectedBrandId !== 'all' ? Number(selectedBrandId) : undefined,
        categoryId: selectedCategoryId !== 'all' ? Number(selectedCategoryId) : undefined,
        activeOnly: true,
        limit: 100,
      });

      let list = res.products || [];
      if (selectedType !== 'all') {
        list = list.filter((p) => p.productType === selectedType);
      }
      setProducts(list);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch products from backend.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedBrandId, selectedCategoryId, selectedType]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Product Catalog
          </h2>
          <p className="text-sm text-slate-500">
            Real-time grocery inventory catalog powered by C++ domain models and strategy discounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            className="text-xs text-slate-600 hover:text-slate-900 gap-1.5"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {isAdmin ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          ) : (
            <Badge variant="staff">Staff Mode (Read-Only Catalog)</Badge>
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

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by SKU or name (e.g. Quinoa, Milk, Basmati)..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Brand Filter */}
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="NON_PERISHABLE">Non-Perishable</option>
                <option value="PERISHABLE">Perishable Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product List Table / Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No Products Found"
              description={
                searchQuery || selectedBrandId !== 'all' || selectedCategoryId !== 'all'
                  ? 'No products matched your active filters. Try adjusting your search query.'
                  : 'Your supermarket catalog is currently empty. Add your first grocery item to begin.'
              }
              actionLabel={isAdmin ? 'Add Product' : undefined}
              onAction={isAdmin ? handleOpenCreate : undefined}
              className="border-0 p-12"
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Type & Expiry</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Discount Strategy</th>
                  <th className="py-3 px-4 text-right">Net Price</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {products.map((p) => {
                  const hasDiscount = p.discount && p.discount.type !== 'NONE' && p.discount.discountedPriceInRupees < p.priceInRupees;
                  const finalPrice = hasDiscount ? p.discount!.discountedPriceInRupees : p.priceInRupees;
                  const isLowStock = p.stock <= 5;
                  const isOutOfStock = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {p.sku}
                      </td>

                      {/* Name & Category/Brand */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <span className="font-semibold text-slate-900 block text-sm">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{p.brandName}</span>
                          <span>•</span>
                          <span>{p.categoryName}</span>
                        </div>
                      </td>

                      {/* Product Type & Expiry */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.productType === 'PERISHABLE' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Calendar className="w-3 h-3" />
                              Perishable
                            </span>
                            {p.expiryDate && (
                              <span className="block text-[11px] text-slate-500 font-mono">
                                Exp: {p.expiryDate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            Non-Perishable
                          </span>
                        )}
                      </td>

                      {/* Original Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-600 whitespace-nowrap">
                        {hasDiscount ? (
                          <span className="line-through text-slate-400">
                            ₹{p.priceInRupees.toFixed(2)}
                          </span>
                        ) : (
                          <span>₹{p.priceInRupees.toFixed(2)}</span>
                        )}
                      </td>

                      {/* Discount Strategy */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {hasDiscount ? (
                          <Badge variant="success" className="gap-1 font-mono text-[10px]">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            {p.discount?.type === 'PERCENTAGE'
                              ? `${p.discount.value}% OFF`
                              : `₹${p.discount?.value.toFixed(2)} OFF`}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>

                      {/* Net Final Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                        ₹{finalPrice.toFixed(2)}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded font-mono font-semibold text-xs ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOutOfStock ? '0 (Out)' : `${p.stock} units`}
                        </span>
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Deactivate Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => {
          showSuccess(editingProduct ? 'Product updated successfully.' : 'Product created successfully.');
          fetchProducts();
        }}
        productToEdit={editingProduct}
        brands={brands}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <ProductDeleteModal
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onDeleted={() => {
          showSuccess('Product deactivated successfully.');
          fetchProducts();
        }}
      />
    </div>
  );
};
