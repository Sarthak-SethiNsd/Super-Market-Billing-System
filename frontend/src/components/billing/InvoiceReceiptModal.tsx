import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Printer, X, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Invoice } from '@/types/billing';

interface InvoiceReceiptModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="printable-receipt-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Receipt for invoice ${invoice.billNumber}`}
    >
      <div className="printable-receipt relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        {/* Top Success Banner (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-600 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Transaction Successful</h3>
              <p className="text-xs text-emerald-100">Stock deducted atomically by C++ engine</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt modal"
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 space-y-5 bg-white text-slate-800">
          {/* Store Brand Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
            <div className="inline-flex items-center justify-center gap-2 text-slate-900 font-extrabold text-lg">
              <Store className="w-5 h-5 text-emerald-600" />
              ApexMart Supermarket
            </div>
            <p className="text-xs text-slate-500">Retail Billing & Inventory Management</p>
            <div className="pt-2 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Invoice: <strong className="text-slate-900">{invoice.billNumber}</strong></span>
              <span>{new Date(invoice.createdAt || Date.now()).toLocaleString()}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
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
                    <td className="py-2.5 text-right text-slate-600">₹{item.finalUnitPriceInRupees.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">₹{item.lineTotalInRupees.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotalInRupees.toFixed(2)}</span>
            </div>
            {invoice.totalDiscountInRupees > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Savings / Discount:</span>
                <span>- ₹{invoice.totalDiscountInRupees.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2 font-sans">
              <span>Grand Total Paid:</span>
              <span className="font-mono text-emerald-700">₹{invoice.finalAmountInRupees.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Thank you for shopping with us! Historical snapshot saved to SQLite.
          </div>
        </div>

        {/* Footer Actions (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Done / Next Customer
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
