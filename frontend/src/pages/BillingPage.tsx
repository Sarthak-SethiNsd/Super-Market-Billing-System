import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Package,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product, Category } from '@/types/catalog';
import { CartItem, Invoice } from '@/types/billing';
import { Customer } from '@/types/customer';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { billService } from '@/services/billService';
import { customerService } from '@/services/customerService';
import { cartService } from '@/services/cartService';
import { InvoiceReceiptModal } from '@/components/billing/InvoiceReceiptModal';
import { Users, UserPlus, X, Filter } from 'lucide-react';

export const BillingPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);

  // Customer State
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickCustomerSubmitting, setQuickCustomerSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch {
      // Non-fatal if categories fail to load
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setCatalogError(null);
      const res = await productService.getProducts({
        q: searchQuery.trim() || undefined,
        categoryId: selectedCategoryId !== 'all' ? Number(selectedCategoryId) : undefined,
        activeOnly: true,
        limit: 100,
      });
      setProducts(res.products || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCatalogError(err.message);
      } else {
        setCatalogError('Unable to reach backend product catalog.');
      }
    } finally {
      setIsLoadingProducts(false);
    }
  }, [searchQuery, selectedCategoryId]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customerService.getCustomers(100, 0);
      setCustomers(res.data);
    } catch {
      // Non-fatal if customers fails to load
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchCategories();
  }, [fetchCustomers, fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Keyboard wedge scanner / Enter handling
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

    // Look for exact SKU match first, then name match
    const match = products.find(
      (p) => p.sku.toLowerCase() === query || p.name.toLowerCase() === query
    ) || products.find(
      (p) => p.sku.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)
    );

    if (match) {
      if (match.stock > 0) {
        addToCart(match);
        setBarcodeInput('');
        setCheckoutError(null);
      } else {
        setCheckoutError(`Cannot add "${match.name}": Product is out of stock.`);
      }
    } else {
      setCheckoutError(`No product found matching barcode or product code: "${barcodeInput}".`);
    }
  };

  const addToCart = async (product: Product) => {
    if (product.stock <= 0) return;

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const currentQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const targetQty = currentQty + 1;

    try {
      await cartService.reserve(product.id, targetQty);
      setCheckoutError(null);

      const hasDiscount = product.discount && product.discount.type !== 'NONE';
      const discountedPrice = hasDiscount
        ? product.discount!.discountedPriceInRupees
        : product.priceInRupees;

      if (existingIndex > -1) {
        const updated = [...cart];
        updated[existingIndex] = {
          ...cart[existingIndex],
          quantity: targetQty,
          lineTotalInRupees: targetQty * discountedPrice,
        };
        setCart(updated);
      } else {
        setCart([
          ...cart,
          {
            product,
            quantity: 1,
            unitPriceInRupees: product.priceInRupees,
            discountedUnitPriceInRupees: discountedPrice,
            lineTotalInRupees: discountedPrice,
          },
        ]);
      }
      fetchProducts();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to reserve stock';
      setCheckoutError(msg);
    }
  };

  const setQuantity = async (productId: number, newQty: number) => {
    if (isNaN(newQty) || newQty <= 0) {
      setCheckoutError('Invalid quantity: must be positive');
      return;
    }

    try {
      await cartService.reserve(productId, newQty);
      setCheckoutError(null);
      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.product.id === productId) {
            return {
              ...item,
              quantity: newQty,
              lineTotalInRupees: newQty * item.discountedUnitPriceInRupees,
            };
          }
          return item;
        })
      );
      fetchProducts();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to update reserved quantity';
      setCheckoutError(msg);
    }
  };

  const updateQuantity = async (productId: number, delta: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;
    const targetQty = item.quantity + delta;
    if (targetQty <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      await cartService.reserve(productId, targetQty);
      setCheckoutError(null);
      setCart((prevCart) =>
        prevCart.map((it) => {
          if (it.product.id === productId) {
            return {
              ...it,
              quantity: targetQty,
              lineTotalInRupees: targetQty * it.discountedUnitPriceInRupees,
            };
          }
          return it;
        })
      );
      fetchProducts();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to update quantity';
      setCheckoutError(msg);
    }
  };

  const removeFromCart = async (productId: number) => {
    try {
      await cartService.release(productId);
    } catch (_) {}
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
    fetchProducts();
  };

  const clearCart = async () => {
    try {
      await cartService.clear();
    } catch (_) {}
    setCart([]);
    setCheckoutError(null);
    fetchProducts();
  };

  // Cart summary calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPriceInRupees * item.quantity, 0);
  const finalTotal = cart.reduce((sum, item) => sum + item.lineTotalInRupees, 0);
  const totalDiscount = Math.max(0, subtotal - finalTotal);

  // Submit checkout
  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;

    try {
      setIsCheckingOut(true);
      setCheckoutError(null);

      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const selectedCust = customers.find((c) => c.id === selectedCustomerId);
      const trimmedCustomerName = customerNameInput.trim();
      const finalCustomerName = trimmedCustomerName.length > 0
        ? trimmedCustomerName.slice(0, 100)
        : (selectedCust?.fullName || 'Walk-in Customer');

      const customerDetails = {
        customerId: selectedCust?.id || null,
        customerName: finalCustomerName,
        customerPhone: selectedCust?.phone || null,
        sessionId: cartService.getSessionId(),
      };

      const invoice = await billService.checkout(items, undefined, customerDetails);
      setSuccessInvoice(invoice);
      setCart([]);
      setCustomerNameInput('');
      setSelectedCustomerId(null);
      fetchProducts(); // Refresh live stock counts
      fetchCustomers(); // Refresh customer stats
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCheckoutError(err.message);
      } else {
        setCheckoutError('Purchase confirmation failed. Transaction was rolled back.');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSelectCustomer = (custId: number | null) => {
    setSelectedCustomerId(custId);
    if (custId) {
      const cust = customers.find((c) => c.id === custId);
      if (cust) {
        setCustomerNameInput(cust.fullName);
      }
    } else {
      setCustomerNameInput('');
    }
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomerName.trim()) return;
    setQuickCustomerSubmitting(true);
    try {
      const newCust = await customerService.createCustomer({
        fullName: quickCustomerName.trim(),
        phone: quickCustomerPhone.trim(),
        email: '',
      });
      setCustomers((prev) => [newCust, ...prev]);
      setSelectedCustomerId(newCust.id);
      setCustomerNameInput(newCust.fullName);
      setShowQuickAddCustomer(false);
      setQuickCustomerName('');
      setQuickCustomerPhone('');
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Failed to register customer');
    } finally {
      setQuickCustomerSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-[#303631] tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#285943] shrink-0" />
            <span>Billing &amp; Purchase Terminal</span>
          </h2>
          <p className="text-xs text-[#777D76] mt-0.5">
            Rapid barcode discovery and purchase approval via C++ ACID persistence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
          <Badge variant="success" className="gap-1.5 py-1 px-2.5 sm:px-3 text-xs">
            <Zap className="w-3.5 h-3.5 text-[#2E6F40] shrink-0" />
            <span className="hidden sm:inline">Billing &amp; Checkout Active (Staff Mode)</span>
            <span className="sm:hidden">Checkout Active</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            className="text-xs text-[#303631] hover:text-[#285943] gap-1 shrink-0"
            title="Synchronize inventory and catalog from database"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#777D76]" />
            <span>Sync Stock</span>
          </Button>
        </div>
      </div>

      {/* Main Split-Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Discovery & Barcode Wedge (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode & Search Bar */}
          <Card className="border-[#E5E4DC]">
            <CardContent className="p-4 space-y-3">
              <form onSubmit={handleBarcodeSubmit} className="relative">
                <Barcode className="w-5 h-5 text-[#285943] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode or type exact product code, then press Enter..."
                  className="w-full pl-10 pr-20 sm:pr-24 py-2.5 text-xs sm:text-sm rounded border border-[#E5E4DC] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#285943] text-[#303631] placeholder:text-[#777D76] font-mono transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 px-2.5 sm:px-3 py-1 bg-[#285943] hover:bg-[#1e4433] text-white rounded text-xs font-semibold tracking-wide"
                >
                  Enter
                </button>
              </form>

              {/* Text Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#777D76] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name or code..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded border border-[#E5E4DC] bg-white focus:outline-none focus:border-[#285943] text-[#303631] placeholder:text-[#777D76]"
                  />
                </div>

                <div className="sm:w-52 shrink-0 relative">
                  <Filter className="w-3.5 h-3.5 text-[#777D76] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="billing-category-filter"
                    aria-label="Filter by Category"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded border border-[#E5E4DC] bg-white text-[#303631] font-medium focus:outline-none focus:border-[#285943] cursor-pointer"
                  >
                    <option value="all">All Categories ({categories.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Catalog Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Catalog Items ({products.length})</span>
              <span>Click item or press Enter to add</span>
            </div>

            {isLoadingProducts ? (
              <Card className="p-8">
                <LoadingSpinner size="md" />
              </Card>
            ) : catalogError ? (
              <Card className="p-6 border-rose-200 bg-rose-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Failed to load active product catalog</p>
                      <p className="text-rose-700 mt-0.5">{catalogError}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchProducts}
                    className="shrink-0 bg-white border-rose-200 text-rose-700 hover:bg-rose-100 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Retry
                  </Button>
                </div>
              </Card>
            ) : products.length === 0 ? (
              <Card className="p-8">
                <EmptyState
                  icon={Package}
                  title="No Products Found"
                  description={
                    searchQuery || selectedCategoryId !== 'all'
                      ? "No products match your active search query or selected category. Try selecting 'All Categories' or clearing your search."
                      : "Your supermarket catalog is currently empty. Make sure products are added to the catalog."
                  }
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
                {products.map((p) => {
                  const isOutOfStock = p.stock === 0;
                  const hasDiscount = p.discount && p.discount.type !== 'NONE' && p.discount.discountedPriceInRupees < p.priceInRupees;
                  const finalPrice = hasDiscount
                    ? p.discount!.discountedPriceInRupees
                    : p.priceInRupees;

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                        isOutOfStock
                          ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-[#285943] hover:shadow-md cursor-pointer group active:scale-[0.99]'
                      }`}
                    >
                      <div>
                        {/* Primary Prominent Product Name Header */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-[#303631] text-xs sm:text-sm line-clamp-2 group-hover:text-[#285943] transition-colors leading-snug">
                            {p.name}
                          </h4>
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <span
                              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-700'
                                  : p.stock <= 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {isOutOfStock ? 'Out of stock' : `${p.stock} left`}
                            </span>
                            {p.reservedStock && p.reservedStock > 0 ? (
                              <span
                                className="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-1 py-0.2 rounded"
                                title={`${p.reservedStock} held in other active carts`}
                              >
                                {p.reservedStock} reserved
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Secondary Brand & Category Information */}
                        <p className="text-[11px] text-[#777D76] truncate">
                          <span className="font-medium text-[#303631]">{p.brandName}</span>
                          <span className="mx-1">•</span>
                          <span>{p.categoryName}</span>
                        </p>

                        {/* Secondary Product Code / SKU metadata (small, muted font) */}
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-[#777D76] bg-[#FAF9F5] border border-[#E5E4DC] px-1.5 py-0.5 rounded">
                            SKU: {p.sku}
                          </span>
                        </div>
                      </div>

                      {/* Pricing & Discount Footer */}
                      <div className="pt-3 mt-2 border-t border-[#E5E4DC] flex items-center justify-between">
                        <div>
                          {hasDiscount && (
                            <span className="text-[10px] text-[#777D76] line-through block font-mono">
                              ₹{p.priceInRupees.toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm font-extrabold text-[#303631] font-mono">
                            ₹{finalPrice.toFixed(2)}
                          </span>
                        </div>

                        {hasDiscount && (
                          <Badge variant="success" className="text-[10px] font-mono px-1.5 py-0.5">
                            {p.discount?.type === 'PERCENTAGE'
                              ? `${p.discount.value}% OFF`
                              : `₹${p.discount?.value} OFF`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Cart & Checkout Ledger (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-[#E5E4DC] shadow-xs flex flex-col h-full bg-white">
            <CardHeader className="py-3 px-4 bg-[#263B32] text-white rounded-t flex flex-row items-center justify-between border-b border-[#334c41]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#d6e2dc]" />
                <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Cart Ledger</CardTitle>
                <span className="text-[11px] bg-[#1f3029] text-[#b4c7be] px-2 py-0.5 rounded font-mono border border-[#334c41]">
                  {cart.reduce((total, i) => total + i.quantity, 0)} items
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-[#d6e2dc] hover:text-[#A63A38] transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </CardHeader>

            {/* Customer Name & Profile Bar */}
            <div className="bg-[#FAF8F5] border-b border-[#E5E4DC] p-3 text-xs space-y-2.5">
              {/* Direct Customer Name Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="billing-customer-name" className="font-semibold text-[#303631] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#285943]" />
                    <span>Customer Name:</span>
                  </label>
                  <span className="text-[10px] text-[#777D76]">
                    (Defaults to &quot;Walk-in Customer&quot;)
                  </span>
                </div>
                <input
                  id="billing-customer-name"
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  placeholder="Walk-in Customer (or type customer name)..."
                  maxLength={100}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-[#E5E4DC] bg-white text-[#303631] placeholder:text-[#777D76] outline-none focus:border-[#285943] transition-colors"
                />
              </div>

              {/* Optional: Link Registered Customer or Quick Add */}
              <div className="pt-1 border-t border-[#E5E4DC]/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#777D76] font-medium">Link Existing Profile (Optional):</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCustomer(!showQuickAddCustomer)}
                    className="text-[10px] font-semibold text-[#285943] hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Quick Add</span>
                  </button>
                </div>

                {showQuickAddCustomer ? (
                  <form onSubmit={handleQuickAddCustomer} className="p-2.5 bg-white rounded-lg border border-[#E5E4DC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#303631]">Register Customer</span>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddCustomer(false)}
                        className="text-[#777D76] hover:text-[#303631]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Customer Name *"
                      value={quickCustomerName}
                      onChange={(e) => setQuickCustomerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#E5E4DC] rounded outline-none focus:border-[#285943]"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={quickCustomerPhone}
                      onChange={(e) => setQuickCustomerPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#E5E4DC] rounded outline-none focus:border-[#285943]"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowQuickAddCustomer(false)}
                        className="px-2 py-1 text-[11px] border border-[#E5E4DC] rounded text-[#777D76]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={quickCustomerSubmitting}
                        className="px-2.5 py-1 text-[11px] bg-[#285943] text-white rounded font-semibold"
                      >
                        {quickCustomerSubmitting ? 'Saving...' : 'Attach Customer'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCustomerId || ''}
                      onChange={(e) => handleSelectCustomer(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-2.5 py-1 rounded border border-[#E5E4DC] bg-white text-[11px] text-[#303631] outline-none focus:border-[#285943]"
                    >
                      <option value="">-- Anonymous / None Selected --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.customerCode}) {c.phone ? `• ${c.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedCustomerId && !showQuickAddCustomer && (
                  <div className="mt-1 text-[10px] text-[#71836A] flex items-center justify-between">
                    <span>Linked: <strong className="text-[#285943]">{customers.find((c) => c.id === selectedCustomerId)?.fullName}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer(null)}
                      className="text-[#A63A38] hover:underline"
                    >
                      Detach
                    </button>
                  </div>
                )}
              </div>
            </div>

            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[380px]">
              {checkoutError && (
                <div className="m-3 p-3 rounded bg-[#F8EFEF] border border-[#ECD1D0] text-xs text-[#A63A38] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#A63A38] shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-16 text-center text-[#777D76] p-6">
                  <div className="w-12 h-12 rounded bg-[#FAF9F5] text-[#777D76] border border-[#E5E4DC] flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-6 h-6 text-[#71836A]" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#303631] mb-1">Cart is Empty</h4>
                  <p className="text-xs text-[#777D76] max-w-xs mx-auto">
                    Scan a product barcode or click items from the catalog on the left to start billing.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E4DC]">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-3.5 hover:bg-[#FAF9F5] transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <span className="font-semibold text-[#303631] text-xs truncate block">
                            {item.product.name}
                          </span>
                          <span className="text-[10px] text-[#777D76] font-mono">
                            {item.product.sku} • ₹{item.discountedUnitPriceInRupees.toFixed(2)}/unit
                          </span>
                        </div>
                        <span className="font-bold text-[#303631] text-xs font-mono shrink-0">
                          ₹{item.lineTotalInRupees.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-[#E5E4DC] rounded bg-white overflow-hidden shadow-2xs">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 hover:bg-[#FAF9F5] text-[#303631] transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                setQuantity(item.product.id, val);
                              }
                            }}
                            className="w-12 text-center py-0.5 text-xs font-mono font-bold text-[#303631] border-x border-[#E5E4DC] focus:outline-none focus:bg-[#FAF9F5] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            title="Direct quantity edit"
                          />
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 hover:bg-[#FAF9F5] text-[#303631] transition-colors disabled:opacity-30"
                            disabled={item.quantity >= item.product.stock}
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[#777D76] hover:text-[#A63A38] p-1 transition-colors"
                          title="Remove item from cart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {/* Financial Summary & Checkout Button */}
            <CardFooter className="flex-col p-4 bg-[#FAF9F5] border-t border-[#E5E4DC] space-y-3">
              <div className="w-full space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-[#777D76]">
                  <span>Subtotal:</span>
                  <span className="text-[#303631]">₹{subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-[#2E6F40] font-semibold">
                    <span>Promotional Savings:</span>
                    <span>- ₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#303631] pt-2 border-t border-[#E5E4DC] font-sans">
                  <span>Total Purchase Amount:</span>
                  <span className="font-mono text-[#285943]">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                isLoading={isCheckingOut}
                className="w-full bg-[#285943] hover:bg-[#1e4433] text-white font-bold py-2.5 text-sm gap-2 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve &amp; Confirm Purchase
              </Button>

              <p className="text-[10px] text-center text-[#777D76]">
                Purchase is approved and recorded atomically by C++ SQLite Transaction Guard.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        invoice={successInvoice}
        onClose={() => setSuccessInvoice(null)}
      />
    </div>
  );
};
