import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, Search, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Brand } from '@/types/catalog';
import { brandService } from '@/services/brandService';
import { useAuth } from '@/context/AuthContext';

export const BrandManager: React.FC = () => {
  const { isAdmin } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await brandService.getAll();
      setBrands(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load brands from server.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openCreateModal = () => {
    setBrandName('');
    setActiveBrand(null);
    setModalMode('create');
    setError(null);
  };

  const openEditModal = (b: Brand) => {
    setBrandName(b.name);
    setActiveBrand(b);
    setModalMode('edit');
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = brandName.trim();
    if (!trimmed) {
      setError('Brand name cannot be blank.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (modalMode === 'create') {
        await brandService.create(trimmed);
        showSuccess(`Brand "${trimmed}" created successfully.`);
      } else if (modalMode === 'edit' && activeBrand) {
        await brandService.update(activeBrand.id, trimmed);
        showSuccess(`Brand renamed to "${trimmed}".`);
      }
      setModalMode(null);
      await fetchBrands();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save brand.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBrand) return;

    try {
      setIsDeleting(true);
      setError(null);
      await brandService.delete(deletingBrand.id);
      showSuccess(`Brand "${deletingBrand.name}" deleted.`);
      setDeletingBrand(null);
      await fetchBrands();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete brand.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="flex flex-col h-full border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">Brand Management</CardTitle>
              <CardDescription className="text-xs">Product manufacturers and suppliers</CardDescription>
            </div>
          </div>
          {isAdmin ? (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Brand
            </Button>
          ) : (
            <Badge variant="staff">Read-Only (Staff)</Badge>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mt-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-y-auto max-h-96">
        {/* Alerts */}
        {error && (
          <div className="m-3 flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="m-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content list */}
        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : filteredBrands.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No Brands Found"
            description={search ? `No brands matching "${search}"` : 'No brands created in catalog yet.'}
            className="border-0 p-6"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBrands.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="text-sm font-semibold text-slate-900 truncate block">
                      {b.name}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Package className="w-3 h-3 text-slate-400" />
                      {b.productCount ?? 0} products linked
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                      title="Rename brand"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingBrand(b)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900">
                {modalMode === 'create' ? 'Add New Brand' : 'Rename Brand'}
              </h4>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Nestle, Amul, Kellogg's..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalMode(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save Brand
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Delete Brand?</h4>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <strong className="text-slate-800">{deletingBrand.name}</strong>?
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Note: A brand cannot be deleted if active products are assigned to it.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingBrand(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
