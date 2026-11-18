import React, { useState, useEffect, useCallback } from 'react';
import { Package, X, AlertCircle, Calendar, Tag, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Product, ProductFormData, Brand, Category, ProductType, DiscountType } from '@/types/catalog';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  productToEdit?: Product | null;
  brands?: Brand[];
  categories: Category[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  productToEdit,
  categories,
}) => {
  const isEditing = Boolean(productToEdit);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [brandId, setBrandId] = useState<number>(0);
  const [categoryBrands, setCategoryBrands] = useState<Brand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);

  const [productType, setProductType] = useState<ProductType>('NON_PERISHABLE');
  const [priceInRupees, setPriceInRupees] = useState<number | ''>(100);
  const [stock, setStock] = useState<number | ''>(10);
  const [expiryDate, setExpiryDate] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState<number | ''>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to fetch brands for a category
  const loadBrandsForCategory = useCallback(async (catId: number, targetBrandId?: number) => {
    if (!catId || catId <= 0) {
      setCategoryBrands([]);
      setBrandId(0);
      return;
    }

    try {
      setIsLoadingBrands(true);
      const brands = await categoryService.getBrandsByCategory(catId);
      setCategoryBrands(brands);
      if (targetBrandId && brands.some((b) => b.id === targetBrandId)) {
        setBrandId(targetBrandId);
      } else if (brands.length === 1) {
        setBrandId(brands[0].id);
      } else {
        setBrandId(0);
      }
    } catch {
      setCategoryBrands([]);
      setBrandId(0);
    } finally {
      setIsLoadingBrands(false);
    }
  }, []);

  // Initialize or reset form state whenever modal opens or productToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setSku(productToEdit.sku || '');
      setName(productToEdit.name || '');
      const savedCatId = productToEdit.categoryId || 0;
      const savedBrandId = productToEdit.brandId || 0;
      setCategoryId(savedCatId);

      const rawType = String(productToEdit.productType || 'NON_PERISHABLE').toUpperCase();
      const normType: ProductType = (rawType.includes('PERISHABLE') && !rawType.includes('NON'))
        ? 'PERISHABLE'
        : 'NON_PERISHABLE';
      setProductType(normType);

      setPriceInRupees(productToEdit.priceInRupees !== undefined ? productToEdit.priceInRupees : 100);
      setStock(productToEdit.stock !== undefined ? productToEdit.stock : 10);

      // Clean YYYY-MM-DD date representation for HTML5 date picker
      const rawExp = productToEdit.expiryDate || (productToEdit as any).nearestExpiryDate || '';
      const formattedExp = rawExp.length >= 10 ? rawExp.substring(0, 10) : rawExp;
      setExpiryDate(formattedExp);

      setDiscountType(productToEdit.discount?.type || 'NONE');
      setDiscountValue(productToEdit.discount?.value !== undefined ? productToEdit.discount.value : 0);

      // Load category-specific brands and restore saved brand
      if (savedCatId > 0) {
        loadBrandsForCategory(savedCatId, savedBrandId);
      } else {
        setCategoryBrands([]);
        setBrandId(0);
      }
    } else {
      setSku('');
      setName('');
      setCategoryId(0);
      setBrandId(0);
      setCategoryBrands([]);
      setProductType('NON_PERISHABLE');
      setPriceInRupees(100);
      setStock(20);
      setExpiryDate('');
      setDiscountType('NONE');
      setDiscountValue(0);
    }
    setError(null);
  }, [isOpen, productToEdit, loadBrandsForCategory]);

  if (!isOpen) return null;

  // Handle Category selection change
  const handleCategoryChange = (newCatId: number) => {
    setCategoryId(newCatId);
    setBrandId(0); // Immediately clear brand selection
    if (newCatId > 0) {
      loadBrandsForCategory(newCatId);
    } else {
      setCategoryBrands([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent duplicate submission

    const trimmedSku = sku.trim();
    const trimmedName = name.trim();

    if (!trimmedSku) {
      setError('Product code / barcode is required.');
      return;
    }

    // PRODUCT CODE / BARCODE VALIDATION
    // Legacy preservation: If editing and SKU is unchanged, allow legacy format (e.g. SKU-GRAIN-001)
    const isUnchangedLegacySku = isEditing && productToEdit && trimmedSku === productToEdit.sku;
    if (!isUnchangedLegacySku) {
      const barcodeRegex = /^\d{3,64}$/;
      if (!barcodeRegex.test(trimmedSku)) {
        setError('Product code / barcode must contain only numeric digits (minimum 3 digits, e.g. 001, 123456). Letters, spaces, and other symbols are not allowed.');
        return;
      }
    }

    if (!trimmedName) {
      setError('Product name is required.');
      return;
    }
    if (!categoryId || Number(categoryId) <= 0) {
      setError('Please select a valid Category first.');
      return;
    }
    if (!brandId || Number(brandId) <= 0) {
      setError('Please select an associated Brand for the chosen category.');
      return;
    }
    if (priceInRupees === '' || Number(priceInRupees) < 0) {
      setError('Selling price must be greater than or equal to 0.');
      return;
    }
    if (stock === '' || Number(stock) < 0) {
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

    const selectedBrand = categoryBrands.find((b) => b.id === Number(brandId));

    const formData: ProductFormData = {
      sku: trimmedSku,
      name: trimmedName,
      brandId: Number(brandId),
      brandName: selectedBrand?.name,
      categoryId: Number(categoryId),
      productType,
      priceInRupees: numPrice,
      stock: numStock,
      expiryDate: productType === 'PERISHABLE' ? (expiryDate ? expiryDate.substring(0, 10) : '') : '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 box-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                {isEditing ? `Edit Product: ${productToEdit?.name}` : 'Add New Product to Catalog'}
              </h3>
              <p className="text-[11px] text-slate-500">Category-Dependent Brand &amp; 3-Digit Barcode Engine</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors shrink-0"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto box-border">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Category is the Primary Selection (Part A & D) */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Category &amp; Associated Brand Selection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Category Dropdown (Primary) */}
              <div className="space-y-1">
                <label htmlFor="product-category" className="block text-xs font-semibold text-slate-800">
                  Category *
                </label>
                {categories.length === 0 ? (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                    No categories found. Please add categories in Category Manager first.
                  </div>
                ) : (
                  <select
                    id="product-category"
                    value={categoryId || ''}
                    onChange={(e) => handleCategoryChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white min-h-[40px] cursor-pointer touch-manipulation"
                    disabled={isLoading}
                    required
                  >
                    <option value="" disabled>-- Step 1: Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[10px] text-slate-500">Selecting a category filters available brands below.</p>
              </div>

              {/* Brand Dropdown (Category-Dependent) */}
              <div className="space-y-1">
                <label htmlFor="product-brand" className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>Brand *</span>
                  {isLoadingBrands && (
                    <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading brands...
                    </span>
                  )}
                </label>
                <select
                  id="product-brand"
                  value={brandId || ''}
                  onChange={(e) => setBrandId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white min-h-[40px] cursor-pointer touch-manipulation disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={isLoading || !categoryId || isLoadingBrands || categoryBrands.length === 0}
                  required
                >
                  {!categoryId ? (
                    <option value="" disabled>-- Select a Category First --</option>
                  ) : isLoadingBrands ? (
                    <option value="" disabled>Loading brands for category...</option>
                  ) : categoryBrands.length === 0 ? (
                    <option value="" disabled>-- No Brands Associated With Category --</option>
                  ) : (
                    <>
                      <option value="" disabled>-- Step 2: Select Brand ({categoryBrands.length} Available) --</option>
                      {categoryBrands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                {categoryId > 0 && !isLoadingBrands && categoryBrands.length === 0 && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                    No brands are currently associated with this category. Please associate a brand in Admin Panel &gt; Brand Management.
                  </p>
                )}
                {categoryId > 0 && !isLoadingBrands && categoryBrands.length > 0 && (
                  <p className="text-[10px] text-emerald-700 font-medium">
                    ✓ {categoryBrands.length} verified brand{categoryBrands.length === 1 ? '' : 's'} available for this category.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Product Identifiers (Part E: 3-Digit Code) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* SKU / Three-Digit Product Code */}
            <div className="space-y-1">
              <label htmlFor="product-sku" className="block text-xs font-semibold text-slate-700">
                Product Code / Barcode (Exactly 3 Digits) *
              </label>
              <input
                id="product-sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. 001, 025, 999"
                maxLength={32}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-mono bg-white min-h-[40px]"
                required
                disabled={isLoading}
              />
              <p className="text-[10px] text-slate-500">
                Must contain exactly 3 numeric digits (001 - 999). Leading zeros preserved.
              </p>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="product-name" className="block text-xs font-semibold text-slate-700">
                Product Name *
              </label>
              <input
                id="product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fresh Toned Milk 1L"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white min-h-[40px]"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Product Type & Expiry */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                OOP Product Type Hierarchy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductType('NON_PERISHABLE')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all min-h-[40px] ${
                    productType === 'NON_PERISHABLE'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Non-Perishable Item
                  <span className="block text-[10px] text-slate-400 font-normal">Grains, staples, packaged goods</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('PERISHABLE')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all min-h-[40px] ${
                    productType === 'PERISHABLE'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Perishable Item
                  <span className="block text-[10px] text-slate-400 font-normal">Dairy, fresh produce (requires expiry date)</span>
                </button>
              </div>
            </div>

            {productType === 'PERISHABLE' && (
              <div className="space-y-1 animate-in fade-in duration-100">
                <label htmlFor="product-expiry" className="block text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  Expiry Date *
                </label>
                <input
                  id="product-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-slate-900 bg-white min-h-[40px]"
                  required={productType === 'PERISHABLE'}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Pricing and Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label htmlFor="product-price" className="block text-xs font-semibold text-slate-700">
                Selling Price (₹ Rupees) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">₹</span>
                <input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInRupees}
                  onChange={(e) => setPriceInRupees(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-mono bg-white min-h-[40px]"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Stored in C++ backend as integer paise ({priceInRupees !== '' ? Math.round(Number(priceInRupees) * 100) : 0} paise).
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="product-stock" className="block text-xs font-semibold text-slate-700">
                Inventory Stock (Units) *
              </label>
              <input
                id="product-stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="Available quantity"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 font-mono bg-white min-h-[40px]"
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
                  className={`py-1.5 px-2 text-xs rounded-lg border text-center transition-all min-h-[36px] ${
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
                <label htmlFor="product-discount-value" className="block text-xs font-semibold text-purple-900">
                  {discountType === 'PERCENTAGE' ? 'Discount Percentage (0 - 100%)' : 'Fixed Discount Amount (₹ Off)'}
                </label>
                <div className="relative">
                  {discountType === 'FIXED' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">₹</span>
                  )}
                  <input
                    id="product-discount-value"
                    type="number"
                    step={discountType === 'PERCENTAGE' ? '0.1' : '0.01'}
                    min="0"
                    max={discountType === 'PERCENTAGE' ? '100' : Number(priceInRupees || 999999)}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className={`w-full py-2 text-sm rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900 font-mono bg-white min-h-[40px] ${
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 min-h-[38px]"
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

export default ProductFormModal;
