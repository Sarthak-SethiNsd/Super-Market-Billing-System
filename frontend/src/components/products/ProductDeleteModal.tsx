import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types/catalog';
import { productService } from '@/services/productService';

interface ProductDeleteModalProps {
  product: Product | null;
  onClose: () => void;
  onDeleted: () => void;
}

export const ProductDeleteModal: React.FC<ProductDeleteModalProps> = ({
  product,
  onClose,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await productService.delete(product.id);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to deactivate product.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Deactivate Product?</h4>
            <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to deactivate <strong className="text-slate-900">{product.name}</strong>?
        </p>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
          This performs a soft deletion (<code className="font-mono text-slate-700">is_active = 0</code>). The product will be hidden from new POS sales, but historical invoices will continue to reference it safely.
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
};
