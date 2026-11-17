import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Tag, Plus, Trash2, CheckCircle2, AlertCircle, Link2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Category, Brand } from '@/types/catalog';
import { categoryService } from '@/services/categoryService';
import { brandService } from '@/services/brandService';
import { useAuth } from '@/context/AuthContext';

export const CategoryBrandManager: React.FC = () => {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [associatedBrands, setAssociatedBrands] = useState<Brand[]>([]);

  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [selectedBrandToAssociate, setSelectedBrandToAssociate] = useState<number | ''>('');
  const [newBrandName, setNewBrandName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const fetchInitialData = useCallback(async () => {
    try {
      setError(null);
      const [cats, brs] = await Promise.all([
        categoryService.getAll(),
        brandService.getAll(),
      ]);
      setCategories(cats);
      setAllBrands(brs);
      if (cats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(cats[0].id);
      }
    } catch {
      setError('Failed to load categories and brands.');
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch associated brands when selectedCategoryId changes
  const fetchCategoryBrands = useCallback(async (catId: number) => {
    try {
      setIsLoadingBrands(true);
      const brands = await categoryService.getBrandsByCategory(catId);
      setAssociatedBrands(brands);
    } catch {
      setAssociatedBrands([]);
    } finally {
      setIsLoadingBrands(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchCategoryBrands(selectedCategoryId);
    }
  }, [selectedCategoryId, fetchCategoryBrands]);

  // Associate existing brand
  const handleAssociateExisting = async () => {
    if (!selectedCategoryId || !selectedBrandToAssociate) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await categoryService.associateBrand(selectedCategoryId, { brandId: Number(selectedBrandToAssociate) });
      const b = allBrands.find((x) => x.id === Number(selectedBrandToAssociate));
      showSuccess(`Associated brand "${b?.name || selectedBrandToAssociate}" with category.`);
      setSelectedBrandToAssociate('');
      await fetchCategoryBrands(selectedCategoryId);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to associate brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add and associate new brand
  const handleCreateAndAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBrandName.trim();
    if (!selectedCategoryId || !trimmed) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await categoryService.associateBrand(selectedCategoryId, { brandName: trimmed });
      showSuccess(`Created and associated brand "${trimmed}".`);
      setNewBrandName('');
      // Refresh both all brands and category brands
      const [cats, brs] = await Promise.all([
        categoryService.getAll(),
        brandService.getAll(),
      ]);
      setCategories(cats);
      setAllBrands(brs);
      await fetchCategoryBrands(selectedCategoryId);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to create and associate brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dissociate brand
  const handleDissociate = async (brandId: number, brandName: string) => {
    if (!selectedCategoryId) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await categoryService.dissociateBrand(selectedCategoryId, brandId);
      showSuccess(`Removed brand "${brandName}" from category.`);
      await fetchCategoryBrands(selectedCategoryId);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to dissociate brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Unassociated brands for dropdown
  const unassociatedBrands = allBrands.filter(
    (b) => !associatedBrands.some((ab) => ab.id === b.id)
  );

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-900">Category-Brand Associations</CardTitle>
              <CardDescription className="text-xs">
                Configure which brands are permitted for selection under each category
              </CardDescription>
            </div>
          </div>
          <Badge variant="admin" className="text-xs self-start sm:self-auto">
            {categories.length} Categories Configured
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Category Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Select Category to View / Manage Associated Brands:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryId(c.id)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  selectedCategoryId === c.id
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Category Details & Associated Brands */}
        {selectedCategory && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>{selectedCategory.name}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {associatedBrands.length} brand{associatedBrands.length === 1 ? '' : 's'} linked
                </p>
              </div>

              {isLoadingBrands && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Loading brands...</span>
                </div>
              )}
            </div>

            {/* List of Associated Brands */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Permitted Brands for {selectedCategory.name}:</p>
              {associatedBrands.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                  No brands associated with this category yet. Select an existing brand below or type a new one to associate.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {associatedBrands.map((b) => (
                    <div
                      key={b.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs"
                    >
                      <Tag className="w-3 h-3 text-emerald-600" />
                      <span className="font-semibold text-slate-800">{b.name}</span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDissociate(b.id, b.name)}
                          disabled={isSubmitting}
                          title={`Remove ${b.name} from ${selectedCategory.name}`}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Association Controls */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-800">Add Brand Association:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Associate Existing Brand */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Link Existing Brand
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedBrandToAssociate}
                        onChange={(e) => setSelectedBrandToAssociate(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={isSubmitting || unassociatedBrands.length === 0}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 bg-white"
                      >
                        <option value="">
                          {unassociatedBrands.length === 0 ? '-- All existing brands linked --' : '-- Choose Brand --'}
                        </option>
                        {unassociatedBrands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleAssociateExisting}
                        disabled={isSubmitting || !selectedBrandToAssociate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Link
                      </Button>
                    </div>
                  </div>

                  {/* Create New Brand & Associate */}
                  <form onSubmit={handleCreateAndAssociate} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Or Create New Brand &amp; Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="e.g. Organic Heritage"
                        disabled={isSubmitting}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 bg-white"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        disabled={isSubmitting || !newBrandName.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create &amp; Link
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryBrandManager;
