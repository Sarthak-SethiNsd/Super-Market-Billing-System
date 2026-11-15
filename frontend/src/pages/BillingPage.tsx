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
  Banknote,
  CreditCard,
  QrCode,
  User
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product, Category } from '@/types/catalog';
import { CartItem, Invoice } from '@/types/billing';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { billService } from '@/services/billService';
import { InvoiceReceiptModal, PaymentDetails } from '@/components/billing/InvoiceReceiptModal';

export const BillingPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [lastPaymentDetails, setLastPaymentDetails] = useState<PaymentDetails | null>(null);

  // Fetch categories for fast quick-filter pills
  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setCatalogError(null);
      const res = await productService.getProducts({
        q: searchQuery.trim() || undefined,
        categoryId: selectedCategory !== 'all' ? Number(selectedCategory) : undefined,
        activeOnly: true,
        limit: 150,
      });
      setProducts(res.products || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCatalogError(err.message);
      } else {
        setCatalogError('Unable to reach product catalog.');
      }
    } finally {
      setIsLoadingProducts(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Cart financial summary calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPriceInRupees * item.quantity, 0);
  const finalTotal = cart.reduce((sum, item) => sum + item.lineTotalInRupees, 0);
  const totalDiscount = Math.max(0, subtotal - finalTotal);

  // Cash Change Due
  const tenderedNumeric = parseFloat(cashTendered) || 0;
  const changeDue = paymentMethod === 'CASH' && tenderedNumeric > 0 ? tenderedNumeric - finalTotal : 0;

  // Barcode / SKU wedge handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

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
      setCheckoutError(`No product found matching barcode/SKU: "${barcodeInput}".`);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      const hasDiscount = product.discount && product.discount.type !== 'NONE';
      const discountedPrice = hasDiscount
        ? product.discount!.discountedPriceInRupees
        : product.priceInRupees;

      if (existingIndex > -1) {
        const currentItem = prevCart[existingIndex];
        if (currentItem.quantity >= product.stock) {
          setCheckoutError(`Cannot add more than ${product.stock} units of ${product.name}.`);
          return prevCart;
        }
        const updated = [...prevCart];
        const newQty = currentItem.quantity + 1;
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
          lineTotalInRupees: newQty * discountedPrice,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            unitPriceInRupees: product.priceInRupees,
            discountedUnitPriceInRupees: discountedPrice,
            lineTotalInRupees: discountedPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              setCheckoutError(`Available stock for ${item.product.name} is ${item.product.stock}.`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              lineTotalInRupees: newQty * item.discountedUnitPriceInRupees,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashTendered('');
    setCheckoutError(null);
  };

  // Submit checkout transaction
  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;

    if (paymentMethod === 'CASH' && tenderedNumeric > 0 && tenderedNumeric < finalTotal) {
      setCheckoutError(`Tendered cash (₹${tenderedNumeric.toFixed(2)}) is less than total payable (₹${finalTotal.toFixed(2)}).`);
      return;
    }

    try {
      setIsCheckingOut(true);
      setCheckoutError(null);

      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const invoice = await billService.checkout(items);

      setLastPaymentDetails({
        method: paymentMethod,
        amountTendered: paymentMethod === 'CASH' && tenderedNumeric > 0 ? tenderedNumeric : finalTotal,
        changeDue: paymentMethod === 'CASH' && changeDue > 0 ? changeDue : 0,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      });

      setSuccessInvoice(invoice);
      setCart([]);
      setCashTendered('');
      setCustomerName('');
      setCustomerPhone('');
      fetchProducts(); // Refresh stock immediately
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCheckoutError(err.message);
      } else {
        setCheckoutError('Transaction failed. Could not finalize sale.');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            Point of Sale (POS) Cashier Terminal
          </h2>
          <p className="text-xs text-slate-500">
            Barcode scanning, live cart pricing, promotional discounts, and instant invoice generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1.5 py-1 px-3 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Terminal Online • Shift Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            className="text-xs text-slate-600 hover:text-slate-900 gap-1"
            title="Sync live inventory counts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Stock
          </Button>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Search & Quick Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode & Search Card */}
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 space-y-3">
              {/* Barcode Wedge */}
              <form onSubmit={handleBarcodeSubmit} className="relative">
                <Barcode className="w-5 h-5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode or type exact SKU, then press Enter..."
                  className="w-full pl-10 pr-24 py-2.5 text-sm rounded-lg border-2 border-emerald-500/30 bg-emerald-50/20 focus:bg-white focus:outline-none focus:border-emerald-600 text-slate-900 placeholder:text-slate-400 font-mono transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold tracking-wide"
                >
                  Enter
                </button>
              </form>

              {/* Text Search & Category Pills */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter products by item name..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                {/* Category Pill Select */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="all">All Departments ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Product Items Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Catalog Products ({products.length} available)</span>
              <span>Click item to add to cart</span>
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
                      <p className="font-semibold">Unable to load product catalog</p>
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
                  description="No active items match your filter criteria. Adjust your search or add items in Product Catalog."
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {products.map((p) => {
                  const isOutOfStock = p.stock === 0;
                  const hasDiscount = p.discount && p.discount.type !== 'NONE';
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
                          : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer group active:scale-[0.99]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : p.stock <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isOutOfStock ? '0 (Out)' : `${p.stock} left`}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {p.brandName} • {p.categoryName}
                        </p>
                      </div>

                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through block font-mono">
                              ₹{p.priceInRupees.toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm font-extrabold text-slate-900 font-mono">
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

        {/* Right Column: Shopping Cart, Payment & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-300 shadow-md flex flex-col h-full bg-white">
            <CardHeader className="py-3.5 px-5 bg-slate-900 text-white rounded-t-xl flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm font-bold text-white">Cart Ledger</CardTitle>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {cart.reduce((total, i) => total + i.quantity, 0)} items
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[320px]">
              {checkoutError && (
                <div className="m-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-14 text-center text-slate-400 p-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 mb-1">Cart is Empty</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Scan an item barcode or click products from the catalog on the left to start billing.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-3 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs truncate block">
                            {item.product.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.product.sku} • ₹{item.discountedUnitPriceInRupees.toFixed(2)}/unit
                          </span>
                        </div>
                        <span className="font-extrabold text-slate-900 text-xs font-mono shrink-0">
                          ₹{item.lineTotalInRupees.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-mono font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-30 cursor-pointer"
                            disabled={item.quantity >= item.product.stock}
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {/* Financial Summary & Payment Controls */}
            <CardFooter className="flex-col p-4 bg-slate-50 border-t border-slate-200 space-y-3.5">
              {/* Financial Breakdown */}
              <div className="w-full space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promotional Savings:</span>
                    <span>- ₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200 font-sans">
                  <span>Payable Amount:</span>
                  <span className="font-mono text-emerald-700 text-lg">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              {cart.length > 0 && (
                <div className="w-full space-y-3 pt-2 border-t border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                          paymentMethod === 'CASH'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                          paymentMethod === 'CARD'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                          paymentMethod === 'UPI'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        UPI / QR
                      </button>
                    </div>
                  </div>

                  {/* Cash Tender Calculation */}
                  {paymentMethod === 'CASH' && (
                    <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Cash Received:</span>
                        <div className="relative w-36">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            placeholder={finalTotal.toFixed(0)}
                            className="w-full pl-6 pr-2 py-1 text-right text-xs font-mono font-bold rounded border border-slate-300 focus:outline-none focus:border-emerald-600 text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Quick Tender Currency Pills */}
                      <div className="flex items-center gap-1.5 justify-end flex-wrap pt-1">
                        <span className="text-[10px] text-slate-400 mr-1">Quick:</span>
                        <button
                          type="button"
                          onClick={() => setCashTendered(finalTotal.toString())}
                          className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                        >
                          Exact
                        </button>
                        {[100, 200, 500, 2000].map((amt) => {
                          if (amt < finalTotal && amt !== 500 && amt !== 2000) return null;
                          return (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setCashTendered(amt.toString())}
                              className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                            >
                              ₹{amt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Calculated Change */}
                      {tenderedNumeric > 0 && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 font-semibold">
                          <span className="text-slate-600">Change Due:</span>
                          <span className={`font-mono text-sm font-bold ${
                            changeDue >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {changeDue >= 0 ? `₹${changeDue.toFixed(2)}` : `Short by ₹${Math.abs(changeDue).toFixed(2)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional Customer Details */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCustomerFields(!showCustomerFields)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      {showCustomerFields ? 'Hide Customer Information' : '+ Add Customer Details for Invoice (Optional)'}
                    </button>

                    {showCustomerFields && (
                      <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-100">
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Customer Name"
                          className="px-2.5 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-800"
                        />
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Mobile Number"
                          className="px-2.5 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Final Complete Transaction Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut || (paymentMethod === 'CASH' && tenderedNumeric > 0 && tenderedNumeric < finalTotal)}
                isLoading={isCheckingOut}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 text-sm gap-2 shadow-md shadow-emerald-950/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {cart.length === 0
                  ? 'Add Products to Checkout'
                  : `Complete Sale • ₹${finalTotal.toFixed(2)}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        invoice={successInvoice}
        paymentDetails={lastPaymentDetails}
        onClose={() => setSuccessInvoice(null)}
      />
    </div>
  );
};
