import React, { useState, useEffect } from 'react';
import { Package, X, AlertCircle, Calendar, Tag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Product, ProductFormData, Brand, Category, ProductType, DiscountType } from '@/types/catalog';
import { productService } from '@/services/productService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  productToEdit?: Product | null;
  brands: Brand[];
  categories: Category[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  productToEdit,
  brands,
  categories,
}) => {
  const isEditing = Boolean(productToEdit);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState<number>(brands[0]?.id || 1);
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [productType, setProductType] = useState<ProductType>('NON_PERISHABLE');
  const [priceInRupees, setPriceInRupees] = useState<number | ''>(100);
  const [stock, setStock] = useState<number | ''>(10);
  const [expiryDate, setExpiryDate] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState<number | ''>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setName(productToEdit.name);
      setBrandId(productToEdit.brandId);
      setCategoryId(productToEdit.categoryId);
      setProductType(productToEdit.productType);
      setPriceInRupees(productToEdit.priceInRupees);
      setStock(productToEdit.stock);
      setExpiryDate(productToEdit.expiryDate || '');
      setDiscountType(productToEdit.discount?.type || 'NONE');
      setDiscountValue(productToEdit.discount?.value || 0);
    } else {
      setSku('');
      setName('');
      setBrandId(brands[0]?.id || 1);
      setCategoryId(categories[0]?.id || 1);
      setProductType('NON_PERISHABLE');
      setPriceInRupees(100);
      setStock(20);
      setExpiryDate('');
      setDiscountType('NONE');
      setDiscountValue(0);
    }
    setError(null);
  }, [productToEdit, brands, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      setError('Product SKU is required.');
      return;
    }
    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (priceInRupees === '' || priceInRupees < 0) {
      setError('Price must be greater than or equal to 0.');
      return;
    }
    if (stock === '' || stock < 0) {
      setError('Stock quantity cannot be negative.');
      return;
    }
    if (productType === 'PERISHABLE' && !expiryDate) {
      setError('Expiry date is required for perishable products.');
      return;
    }

    const numPrice = Number(priceInRupees);
    const numStock = Number(stock);
    const numDiscVal = Number(discountValue || 0);

    if (discountType === 'PERCENTAGE' && (numDiscVal < 0 || numDiscVal > 100)) {
      setError('Percentage discount must be between 0% and 100%.');
      return;
    }
    if (discountType === 'FIXED') {
      if (numDiscVal < 0) {
        setError('Fixed discount cannot be negative.');
        return;
      }
      if (numDiscVal > numPrice) {
        setError('Fixed discount cannot exceed the product selling price.');
        return;
      }
    }

    const formData: ProductFormData = {
      sku: sku.trim(),
      name: name.trim(),
      brandId,
      categoryId,
      productType,
      priceInRupees: numPrice,
      stock: numStock,
      expiryDate: productType === 'PERISHABLE' ? expiryDate : '',
      discountType,
      discountValue: numDiscVal,
    };

    try {
      setIsLoading(true);
      setError(null);
      if (isEditing && productToEdit) {
        await productService.update(productToEdit.id, formData);
      } else {
        await productService.create(formData);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save product to backend.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isEditing ? `Edit Product: ${productToEdit?.name}` : 'Add New Product to Catalog'}
              </h3>
              <p className="text-xs text-slate-500">C++ Domain Entity with Strategy Discount</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Product SKU / Barcode *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. MILK-001, GRAIN-202"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-mono"
                required
                disabled={isLoading}
              />
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Organic Cow Milk 1L"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand Select */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Brand *</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white"
                disabled={isLoading}
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white"
                disabled={isLoading}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Type & Expiry */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                OOP Product Type Hierarchy
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductType('NON_PERISHABLE')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                    productType === 'NON_PERISHABLE'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Non-Perishable Item
                  <span className="block text-[10px] text-slate-400 font-normal">Grains, spices, packaged goods</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('PERISHABLE')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                    productType === 'PERISHABLE'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Perishable Item
                  <span className="block text-[10px] text-slate-400 font-normal">Dairy, bakery, vegetables (has expiry)</span>
                </button>
              </div>
            </div>

            {productType === 'PERISHABLE' && (
              <div className="space-y-1 animate-in fade-in duration-100">
                <label className="block text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900 bg-white"
                  required={productType === 'PERISHABLE'}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Pricing and Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Selling Price (₹ Rupees) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInRupees}
                  onChange={(e) => setPriceInRupees(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-mono"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Stored in C++ backend as integer paise ({priceInRupees !== '' ? Math.round(Number(priceInRupees) * 100) : 0} paise).
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Inventory Stock (Units) *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="Available quantity"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-mono"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Discount Strategy */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
              <Tag className="w-3.5 h-3.5 text-purple-600" />
              C++ Strategy Pattern Discount Engine
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['NONE', 'PERCENTAGE', 'FIXED'] as DiscountType[]).map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => {
                    setDiscountType(dt);
                    if (dt === 'NONE') setDiscountValue(0);
                  }}
                  className={`py-1.5 px-2 text-xs rounded-lg border text-center transition-all ${
                    discountType === dt
                      ? 'bg-purple-100 border-purple-400 text-purple-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {dt === 'NONE' ? 'No Discount' : dt === 'PERCENTAGE' ? 'Percentage %' : 'Fixed ₹ Off'}
                </button>
              ))}
            </div>

            {discountType !== 'NONE' && (
              <div className="space-y-1 animate-in fade-in duration-100">
                <label className="block text-xs font-semibold text-purple-900">
                  {discountType === 'PERCENTAGE' ? 'Discount Percentage (0 - 100%)' : 'Fixed Discount Amount (₹ Off)'}
                </label>
                <div className="relative">
                  {discountType === 'FIXED' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">₹</span>
                  )}
                  <input
                    type="number"
                    step={discountType === 'PERCENTAGE' ? '0.1' : '0.01'}
                    min="0"
                    max={discountType === 'PERCENTAGE' ? '100' : Number(priceInRupees || 999999)}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className={`w-full py-2 text-sm rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900 font-mono ${
                      discountType === 'FIXED' ? 'pl-8 pr-3' : 'px-3'
                    }`}
                    disabled={isLoading}
                  />
                  {discountType === 'PERCENTAGE' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">%</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
