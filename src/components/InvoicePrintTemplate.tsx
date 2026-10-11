import React, { useEffect, useState } from 'react';
import { BusinessProfile, Invoice } from '../types';
import { formatCurrency, numberToWords } from '../utils/numberToWords';
import { generateQrDataUrl, generateUpiUri } from '../utils/upi';

interface InvoicePrintTemplateProps {
  invoice: Invoice;
  business: BusinessProfile;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({
  invoice,
  business,
}) => {
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const currency = business.currency || '₹';

  useEffect(() => {
    if (business.bankDetails?.upiId && invoice.totalAmount > 0) {
      const uri = generateUpiUri({
        upiId: business.bankDetails.upiId,
        payeeName: business.bankDetails.accountHolderName || business.name,
        amount: invoice.totalAmount,
        transactionNote: `Invoice ${invoice.invoiceNumber}`,
      });
      generateQrDataUrl(uri).then(setUpiQrUrl);
    } else {
      setUpiQrUrl('');
    }
  }, [business, invoice]);

  const words = numberToWords(invoice.totalAmount, currency);

  return (
    <div className="bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-[850px] mx-auto border border-slate-200 print:border-none print:p-0 print:m-0 print:max-w-none text-xs leading-relaxed">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
        <div className="flex items-start gap-4">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-16 h-16 object-contain rounded border border-slate-200 p-1 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-xl shrink-0">
              {business.name.slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              {business.name}
            </h1>
            {business.tagline && (
              <p className="text-slate-500 text-xs mb-1">{business.tagline}</p>
            )}
            <div className="text-slate-600 space-y-0.5 text-[11px]">
              {business.address.street && <p>{business.address.street}</p>}
              <p>
                {[business.address.city, business.address.state, business.address.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <div className="flex flex-wrap gap-x-3 text-slate-500 mt-1">
                {business.phone && <span>Phone: {business.phone}</span>}
                {business.email && <span>Email: {business.email}</span>}
              </div>
              <div className="flex flex-wrap gap-x-4 font-mono font-medium text-slate-800 pt-0.5">
                {business.gstNumber && <span>GSTIN: {business.gstNumber}</span>}
                {business.panNumber && <span>PAN: {business.panNumber}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="inline-block bg-slate-900 text-white px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-sm mb-2">
            TAX INVOICE
          </div>
          <p className="text-base font-bold font-mono text-slate-900">
            #{invoice.invoiceNumber}
          </p>
          <div className="mt-2 text-slate-600 space-y-0.5 text-[11px]">
            <p>
              <span className="text-slate-400">Invoice Date:</span>{' '}
              <span className="font-semibold text-slate-800">{invoice.invoiceDate}</span>
            </p>
            <p>
              <span className="text-slate-400">Due Date:</span>{' '}
              <span className="font-semibold text-slate-800">{invoice.dueDate}</span>
            </p>
            <p>
              <span className="text-slate-400">Status:</span>{' '}
              <span
                className={`font-bold ${
                  invoice.status === 'PAID'
                    ? 'text-emerald-700'
                    : invoice.status === 'OVERDUE'
                    ? 'text-rose-700'
                    : invoice.status === 'PARTIAL'
                    ? 'text-amber-700'
                    : 'text-blue-700'
                }`}
              >
                {invoice.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Bill To Info */}
      <div className="grid grid-cols-2 gap-6 bg-slate-50 p-3.5 rounded border border-slate-200 mb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            BILLED TO / CUSTOMER DETAILS
          </span>
          <p className="font-bold text-slate-900 text-sm">{invoice.customer.name}</p>
          {invoice.customer.phone && (
            <p className="text-slate-600 text-[11px]">Phone: {invoice.customer.phone}</p>
          )}
          {invoice.customer.email && (
            <p className="text-slate-600 text-[11px]">Email: {invoice.customer.email}</p>
          )}
          {(invoice.customer.address || invoice.customer.city) && (
            <p className="text-slate-600 text-[11px] mt-0.5">
              {[
                invoice.customer.address,
                invoice.customer.city,
                invoice.customer.state,
                invoice.customer.pincode,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
          {invoice.customer.gstNumber && (
            <p className="font-mono text-slate-700 text-[11px] font-semibold mt-1">
              Customer GSTIN: {invoice.customer.gstNumber}
            </p>
          )}
        </div>

        <div className="border-l border-slate-200 pl-6 text-[11px] text-slate-600 space-y-1.5 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            INVOICE SUMMARY
          </span>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-600">Total Payable:</span>
            <span className="font-mono text-base font-bold text-slate-900">
              {formatCurrency(invoice.totalAmount, currency)}
            </span>
          </div>
          {invoice.totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 text-[11px]">
              <span>Discount Applied:</span>
              <span className="font-mono font-medium">- {formatCurrency(invoice.totalDiscount, currency)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left border-collapse mb-6">
        <thead>
          <tr className="border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
            <th className="py-2.5 px-3 w-8">#</th>
            <th className="py-2.5 px-3">Item / Service Description</th>
            <th className="py-2.5 px-3 w-20">HSN/SAC</th>
            <th className="py-2.5 px-3 text-right w-16">Qty</th>
            <th className="py-2.5 px-3 text-right w-24">Rate ({currency})</th>
            <th className="py-2.5 px-3 text-right w-16">Disc %</th>
            <th className="py-2.5 px-3 text-right w-16">GST %</th>
            <th className="py-2.5 px-3 text-right w-24">Amount ({currency})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-[11px]">
          {invoice.items.map((item, idx) => (
            <tr key={item.id || idx} className="hover:bg-slate-50/50">
              <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
              <td className="py-2.5 px-3">
                <p className="font-semibold text-slate-900">{item.name}</p>
                {item.description && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
                )}
              </td>
              <td className="py-2.5 px-3 font-mono text-slate-500">{item.hsnCode || '—'}</td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                {item.quantity} <span className="text-[10px] text-slate-400">{item.unit || 'pcs'}</span>
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                {item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                {item.discountPercent > 0 ? `${item.discountPercent}%` : '—'}
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                {item.gstRate}%
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculations & Total */}
      <div className="grid grid-cols-12 gap-6 border-t border-slate-200 pt-4 mb-6">
        {/* Left Column: Amount in words & Bank info */}
        <div className="col-span-7 space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              TOTAL AMOUNT IN WORDS
            </span>
            <p className="font-semibold text-slate-800 italic mt-0.5 text-[11px]">
              {words}
            </p>
          </div>

          {/* Bank & Payment Details */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 flex gap-4 items-start">
            <div className="flex-1 text-[11px] space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                BANK & PAYMENT INFORMATION
              </span>
              {business.bankDetails?.bankName && (
                <p>
                  <span className="text-slate-500">Bank Name:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    {business.bankDetails.bankName}
                  </span>
                </p>
              )}
              {business.bankDetails?.accountHolderName && (
                <p>
                  <span className="text-slate-500">Account Name:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    {business.bankDetails.accountHolderName}
                  </span>
                </p>
              )}
              {business.bankDetails?.accountNumber && (
                <p>
                  <span className="text-slate-500">A/C Number:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {business.bankDetails.accountNumber}
                  </span>
                </p>
              )}
              {business.bankDetails?.ifscCode && (
                <p>
                  <span className="text-slate-500">IFSC Code:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {business.bankDetails.ifscCode}
                  </span>
                </p>
              )}
              {business.bankDetails?.upiId && (
                <p className="pt-0.5">
                  <span className="text-slate-500">UPI ID:</span>{' '}
                  <span className="font-mono font-semibold text-indigo-700">
                    {business.bankDetails.upiId}
                  </span>
                </p>
              )}
            </div>

            {/* UPI QR Code */}
            {upiQrUrl && invoice.totalAmount > 0 && (
              <div className="text-center shrink-0">
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  className="w-20 h-20 border border-slate-300 rounded bg-white p-0.5"
                />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                  Scan & Pay UPI
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Financial Totals */}
        <div className="col-span-5 space-y-2 text-[11px]">
          <div className="flex justify-between py-1 text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono tabular-nums">
              {formatCurrency(invoice.subtotal, currency)}
            </span>
          </div>

          {invoice.totalDiscount > 0 && (
            <div className="flex justify-between py-1 text-emerald-700">
              <span>
                Total Discount{invoice.discountPercent ? ` (${invoice.discountPercent}%)` : ''}:
              </span>
              <span className="font-mono tabular-nums font-semibold">
                - {formatCurrency(invoice.totalDiscount, currency)}
              </span>
            </div>
          )}

          {invoice.totalTax > 0 && (
            <>
              {/* Show CGST + SGST split if intra-state or combined tax */}
              <div className="flex justify-between py-1 text-slate-600">
                <span>CGST:</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(invoice.totalTax / 2, currency)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>SGST:</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(invoice.totalTax / 2, currency)}
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between items-center py-2.5 border-t-2 border-slate-900 text-slate-900">
            <span className="text-sm font-bold uppercase">Grand Total:</span>
            <span className="font-mono tabular-nums text-base font-extrabold">
              {formatCurrency(invoice.totalAmount, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Signatory */}
      <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-6 mt-6">
        <div>
          {invoice.notes && (
            <div className="mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                NOTES
              </span>
              <p className="text-[10px] text-slate-600 whitespace-pre-line mt-0.5">
                {invoice.notes}
              </p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                TERMS & CONDITIONS
              </span>
              <p className="text-[10px] text-slate-500 whitespace-pre-line mt-0.5 leading-relaxed">
                {invoice.terms}
              </p>
            </div>
          )}
        </div>

        <div className="text-right flex flex-col justify-end items-end">
          <p className="text-[11px] font-semibold text-slate-800">
            For {business.name}
          </p>
          <div className="h-16 flex items-end justify-end my-1">
            {business.signatureUrl ? (
              <img
                src={business.signatureUrl}
                alt="Authorised Signatory"
                className="max-h-14 max-w-[160px] object-contain"
              />
            ) : (
              <span className="text-[10px] text-slate-400 italic pb-1">
                Authorised Signatory
              </span>
            )}
          </div>
          <div className="border-t border-slate-300 w-48 pt-1 text-[9px] text-slate-600 font-semibold text-center">
            Authorised Signatory
          </div>
          <div className="border-0 w-48 pt-0.5 text-[8px] text-slate-400 text-center">
            This is a computer generated invoice
          </div>
        </div>
      </div>
    </div>
  );
};
