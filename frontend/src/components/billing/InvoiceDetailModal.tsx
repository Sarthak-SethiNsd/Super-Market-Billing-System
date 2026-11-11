import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Receipt, Store, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Invoice } from '@/types/billing';
import { billService } from '@/services/billService';

interface InvoiceDetailModalProps {
  billId: number | null;
  onClose: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ billId, onClose }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!billId) {
      setInvoice(null);
      return;
    }

    const loadInvoice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await billService.getBillById(billId);
        setInvoice(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load invoice details.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [billId]);

  if (!billId) return null;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="printable-receipt-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Historical invoice inspector"
    >
      <div className="printable-receipt relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        {/* Header (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Historical Invoice Inspector</h3>
              <p className="text-xs text-slate-500">Immutable line-item snapshot from SQLite</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice inspector"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Error Loading Invoice</strong>
                <span>{error}</span>
              </div>
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
                <div className="inline-flex items-center justify-center gap-2 text-slate-900 font-extrabold text-lg">
                  <Store className="w-5 h-5 text-emerald-600" />
                  ApexMart Supermarket
                </div>
                <p className="text-xs text-slate-500">Retail Sales & Inventory Management</p>
                <div className="pt-3 flex items-center justify-between text-xs text-slate-600 font-mono">
                  <span>Invoice: <strong className="text-slate-900">{invoice.billNumber}</strong></span>
                  <span>{new Date(invoice.createdAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>

              {/* Line Items Table with Snapshots */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Snapshot Line Items ({invoice.items?.length || 0})
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase">
                      <th className="py-2">Product Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Orig. Unit</th>
                      <th className="py-2 text-right">Net Unit</th>
                      <th className="py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {invoice.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 pr-2 font-sans">
                          <span className="font-semibold text-slate-900 block">{item.productName}</span>
                          <span className="text-[10px] text-slate-400">{item.brandName}</span>
                          {(item.unitDiscountInRupees > 0 || item.discountValue > 0) && (
                            <span className="text-[10px] text-emerald-600 block">
                              Discount: {item.discountType === 'PERCENTAGE'
                                ? `${item.discountValue}% (- ₹${item.unitDiscountInRupees.toFixed(2)}/unit)`
                                : `- ₹${item.unitDiscountInRupees.toFixed(2)}/unit`}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-center text-slate-700">{item.quantity}</td>
                        <td className="py-2.5 text-right text-slate-400">₹{item.unitPriceInRupees.toFixed(2)}</td>
                        <td className="py-2.5 text-right text-slate-800 font-medium">₹{item.finalUnitPriceInRupees.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">₹{item.lineTotalInRupees.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span>₹{invoice.subtotalInRupees.toFixed(2)}</span>
                </div>
                {invoice.totalDiscountInRupees > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Promotional Discounts:</span>
                    <span>- ₹{invoice.totalDiscountInRupees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2 font-sans">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono text-emerald-700">₹{invoice.finalAmountInRupees.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                Verified against SQLite database. Snapshots remain immutable across product updates.
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isLoading || !invoice}
            className="gap-1.5 text-xs text-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            Close Inspector
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
