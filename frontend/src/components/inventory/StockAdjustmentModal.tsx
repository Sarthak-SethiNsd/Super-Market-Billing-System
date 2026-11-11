import React, { useState, useEffect } from 'react';
import { Sliders, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types/catalog';
import { MovementType, StockAdjustmentRequest } from '@/types/inventory';
import { inventoryService } from '@/services/inventoryService';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdjusted: () => void;
  products: Product[];
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onAdjusted,
  products,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 0);
  const [operationType, setOperationType] = useState<'ADDITION' | 'REDUCTION' | 'CORRECTION'>('ADDITION');
  const [quantity, setQuantity] = useState<number | ''>(5);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const currentStock = selectedProduct ? selectedProduct.stock : 0;

  // Calculate quantity change delta based on operation type
  let delta = 0;
  if (quantity !== '') {
    const val = Number(quantity);
    if (operationType === 'ADDITION') delta = val;
    else if (operationType === 'REDUCTION') delta = -val;
    else if (operationType === 'CORRECTION') delta = val - currentStock; // Target stock
  }

  const resultingStock = currentStock + delta;

  const handleInitialValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product.');
      return;
    }
    if (quantity === '' || Number(quantity) < 0) {
      setError('Please enter a valid quantity.');
      return;
    }
    if (resultingStock < 0) {
      setError(`Adjustment would result in negative stock (${resultingStock}). Minimum allowed is 0.`);
      return;
    }
    if (!reason.trim()) {
      setError('A mandatory reason is required for inventory audit compliance.');
      return;
    }

    setError(null);
    setShowConfirm(true);
  };

  const handleFinalSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let mType: MovementType = 'ADJUSTMENT';
      if (operationType === 'ADDITION') mType = 'ADDITION';
      else if (operationType === 'REDUCTION') mType = 'REDUCTION';

      const payload: StockAdjustmentRequest = {
        productId: selectedProduct.id,
        quantityChange: delta,
        reason: reason.trim(),
        movementType: mType,
      };

      await inventoryService.adjustStock(payload);
      setShowConfirm(false);
      setQuantity(5);
      setReason('');
      onAdjusted();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Stock adjustment failed on server.');
      }
      setShowConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-700 flex items-center justify-center border border-purple-200">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Manual Inventory Stock Adjustment</h3>
              <p className="text-xs text-slate-500">Admin Action • Generates Immutable Audit Record</p>
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
        {!showConfirm ? (
          <form onSubmit={handleInitialValidate} className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Select */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Target Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900 bg-white"
                disabled={isLoading}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — In Stock: {p.stock} units
                  </option>
                ))}
              </select>
            </div>

            {/* Operation Type */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Adjustment Operation *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOperationType('ADDITION')}
                  className={`py-2 px-2 text-xs rounded-lg border text-center transition-all ${
                    operationType === 'ADDITION'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  + Restock
                  <span className="block text-[10px] text-slate-400 font-normal">Add units</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOperationType('REDUCTION')}
                  className={`py-2 px-2 text-xs rounded-lg border text-center transition-all ${
                    operationType === 'REDUCTION'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  - Write-off
                  <span className="block text-[10px] text-slate-400 font-normal">Damaged/Spoiled</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOperationType('CORRECTION')}
                  className={`py-2 px-2 text-xs rounded-lg border text-center transition-all ${
                    operationType === 'CORRECTION'
                      ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Set Direct Count
                  <span className="block text-[10px] text-slate-400 font-normal">Audit count</span>
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                {operationType === 'CORRECTION' ? 'Counted Actual Physical Stock (Units) *' : 'Quantity to Add / Remove (Units) *'}
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900 font-mono"
                required
                disabled={isLoading}
              />
            </div>

            {/* Live Stock Transition Preview */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
              <div className="text-center">
                <span className="text-slate-400 block text-[10px] font-sans">Current Stock</span>
                <span className="font-bold text-slate-800 text-sm">{currentStock}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                  delta > 0 ? 'bg-emerald-100 text-emerald-800' : delta < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-center">
                <span className="text-slate-400 block text-[10px] font-sans">New Stock</span>
                <span className={`font-bold text-sm ${resultingStock < 0 ? 'text-rose-600' : 'text-purple-700'}`}>
                  {resultingStock}
                </span>
              </div>
            </div>

            {/* Mandatory Reason */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Reason for Adjustment (Mandatory Audit Trail) *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Shipment received, damaged packaging, inventory audit correction"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900"
                required
                disabled={isLoading}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                Review & Confirm
              </Button>
            </div>
          </form>
        ) : (
          /* Confirmation Screen */
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">Confirm Stock Modification</h4>
                <p className="text-xs text-amber-700">
                  This action updates the physical product inventory in SQLite and generates an immutable audit record.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-slate-900">{selectedProduct?.name} ({selectedProduct?.sku})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Stock Change:</span>
                <span className={`font-mono font-bold ${delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {delta >= 0 ? `+${delta}` : delta} units ({currentStock} → {resultingStock})
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Audit Reason:</span>
                <span className="font-medium text-slate-800">{reason}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowConfirm(false)} disabled={isLoading}>
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleFinalSubmit}
                isLoading={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Commit Stock Adjustment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
