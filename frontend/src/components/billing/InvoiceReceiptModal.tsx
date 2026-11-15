import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Printer, X, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Invoice } from '@/types/billing';

export interface PaymentDetails {
  method: 'CASH' | 'CARD' | 'UPI';
  amountTendered?: number;
  changeDue?: number;
  customerName?: string;
  customerPhone?: string;
}

interface InvoiceReceiptModalProps {
  invoice: Invoice | null;
  paymentDetails?: PaymentDetails | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  paymentDetails,
  onClose,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const method = paymentDetails?.method || 'CASH';

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
              <h3 className="font-bold text-sm">Sale Completed Successfully</h3>
              <p className="text-xs text-emerald-100">Payment confirmed & customer receipt ready</p>
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
        <div className="p-6 space-y-4 bg-white text-slate-800 font-sans">
          {/* Store Brand Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
            <div className="inline-flex items-center justify-center gap-2 text-slate-900 font-extrabold text-xl">
              <Store className="w-5 h-5 text-emerald-600" />
              ApexMart Supermarket
            </div>
            <p className="text-xs text-slate-500">Main Market Complex, Central Avenue • Tel: (011) 2468-1357</p>
            <p className="text-[10px] text-slate-400 font-mono">GSTIN: 07AAACA1234A1Z5 • Store Terminal #01</p>
            <div className="pt-2 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Invoice: <strong className="text-slate-900">{invoice.billNumber}</strong></span>
              <span>{new Date(invoice.createdAt || Date.now()).toLocaleString()}</span>
            </div>
            {paymentDetails?.customerName && (
              <div className="pt-1 text-left text-xs text-slate-600 font-mono border-t border-slate-100">
                <span>Customer: <strong className="text-slate-800">{paymentDetails.customerName}</strong></span>
                {paymentDetails.customerPhone && <span className="ml-2 text-slate-400">({paymentDetails.customerPhone})</span>}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2 font-sans">
                      <span className="font-semibold text-slate-900 block">{item.productName}</span>
                      <span className="text-[10px] text-slate-400">{item.brandName}</span>
                      {(item.unitDiscountInRupees > 0 || item.discountValue > 0) && (
                        <span className="text-[10px] text-emerald-600 block">
                          Promo: {item.discountType === 'PERCENTAGE'
                            ? `${item.discountValue}% OFF (-₹${item.unitDiscountInRupees.toFixed(2)}/unit)`
                            : `₹${item.discountValue} OFF`}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-center text-slate-700">{item.quantity}</td>
                    <td className="py-2 text-right text-slate-600">₹{item.finalUnitPriceInRupees.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold text-slate-900">₹{item.lineTotalInRupees.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Gross Total:</span>
              <span>₹{invoice.subtotalInRupees.toFixed(2)}</span>
            </div>
            {invoice.totalDiscountInRupees > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Promotional Savings:</span>
                <span>- ₹{invoice.totalDiscountInRupees.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2 font-sans">
              <span>Net Payable:</span>
              <span className="font-mono text-emerald-700">₹{invoice.finalAmountInRupees.toFixed(2)}</span>
            </div>

            {/* Payment Tender Breakdown */}
            <div className="border-t border-slate-100 pt-2 space-y-1 text-slate-600 text-[11px]">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-800">
                  {method === 'CASH' ? 'Cash Payment' : method === 'CARD' ? 'Card Swipe / POS Terminal' : 'UPI Digital Payment'}
                </span>
              </div>
              {method === 'CASH' && paymentDetails?.amountTendered !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span>₹{paymentDetails.amountTendered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Change Returned:</span>
                    <span className="text-emerald-700">₹{(paymentDetails.changeDue || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Receipt Footer Message */}
          <div className="text-center text-[11px] text-slate-500 pt-3 border-t border-dashed border-slate-300 space-y-0.5">
            <p className="font-semibold text-slate-700">Thank you for shopping at ApexMart Supermarket!</p>
            <p className="text-[10px] text-slate-400">Items once sold can be returned within 7 days with original invoice.</p>
          </div>
        </div>

        {/* Footer Actions (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            Next Customer (New Sale)
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
