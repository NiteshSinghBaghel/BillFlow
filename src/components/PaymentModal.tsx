import React, { useState } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { BusinessProfile, Invoice, PaymentRecord } from '../types';
import { formatCurrency } from '../utils/numberToWords';

interface PaymentModalProps {
  invoice: Invoice;
  business: BusinessProfile;
  onClose: () => void;
  onSavePayment: (invoiceId: string, payment: Omit<PaymentRecord, 'id'>) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  business,
  onClose,
  onSavePayment,
}) => {
  const currency = business.currency || '₹';
  const [amount, setAmount] = useState<number>(invoice.balanceDue);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<PaymentRecord['method']>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    onSavePayment(invoice.id, {
      amount,
      date,
      method,
      transactionRef: transactionRef.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const isFullPayment = Math.abs(amount - invoice.balanceDue) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h2 className="font-bold text-sm text-slate-900">
              Record Payment for #{invoice.invoiceNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Customer & Outstanding summary */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <span className="font-semibold text-slate-900">{invoice.customer.name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Invoice Total:</span>
              <span className="font-mono">{formatCurrency(invoice.totalAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Currently Paid:</span>
              <span className="font-mono text-emerald-700">
                {formatCurrency(invoice.amountPaid, currency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
              <span>Outstanding Balance:</span>
              <span className="font-mono text-rose-700">
                {formatCurrency(invoice.balanceDue, currency)}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium text-slate-700">Payment Amount ({currency})</label>
              <button
                type="button"
                onClick={() => setAmount(invoice.balanceDue)}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Full Balance ({formatCurrency(invoice.balanceDue, currency)})
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              max={invoice.balanceDue}
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {isFullPayment && (
              <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> This will mark the invoice as fully PAID.
              </p>
            )}
          </div>

          {/* Payment Date & Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentRecord['method'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="Cash">Cash</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Reference No */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Transaction ID / UTR / Reference No. (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/3498104523/HDFC"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Received via QR code scan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              Confirm & Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
