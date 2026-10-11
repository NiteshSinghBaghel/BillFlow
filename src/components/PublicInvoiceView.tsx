import React, { useRef, useState } from 'react';
import { Download, Printer, CheckCircle, ArrowLeft, Share2, FileText } from 'lucide-react';
import { BusinessProfile, Invoice } from '../types';
import { InvoicePrintTemplate } from './InvoicePrintTemplate';
import { downloadInvoicePdf } from '../utils/pdfGenerator';
import { formatCurrency } from '../utils/numberToWords';

interface PublicInvoiceViewProps {
  invoice: Invoice;
  business: BusinessProfile;
  onBackToApp?: () => void;
}

export const PublicInvoiceView: React.FC<PublicInvoiceViewProps> = ({
  invoice,
  business,
  onBackToApp,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const currency = business.currency || '₹';

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) {
      window.print();
      return;
    }
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice, invoiceRef.current);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      // Fallback to browser print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/80 font-sans pb-12">
      {/* Public Customer Header Bar */}
      <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-8 h-8 object-contain rounded border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                {business.name.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="font-bold text-sm text-slate-900 leading-tight">
                {business.name}
              </p>
              <p className="text-[11px] text-slate-500">Official Sales Invoice</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing PDF...' : 'Download Invoice'}</span>
            </button>

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
                title="Back to Admin Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Customer Greeting Banner (matches WhatsApp format) */}
      <div className="no-print max-w-4xl mx-auto px-4 pt-6 pb-2">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Verified Invoice
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-mono">#{invoice.invoiceNumber}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Hey {invoice.customer.name} ,
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Thank you for your business! Your Sales Invoice is ready. You can review the details below or download the PDF file for your records.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-5 shrink-0">
            <span className="text-[11px] text-slate-500">Invoice Amount</span>
            <span className="font-mono text-lg font-extrabold text-slate-900">
              {formatCurrency(invoice.totalAmount, currency)}
            </span>
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>PDF downloaded successfully! Check your downloads folder.</span>
          </div>
        )}
      </div>

      {/* Invoice Document Canvas */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div
          ref={invoiceRef}
          className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden printable-invoice"
        >
          <InvoicePrintTemplate invoice={invoice} business={business} />
        </div>
      </div>

      {/* Prominent Download Invoice Button at bottom of invoice */}
      <div className="no-print max-w-4xl mx-auto px-4 pt-6 pb-6 text-center">
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Downloading...' : 'Download Invoice'}</span>
        </button>
      </div>

      {/* Floating Mobile Bottom Download Action Bar */}
      <div className="no-print sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Total</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {formatCurrency(invoice.totalAmount, currency)}
          </span>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex-1 py-2.5 px-4 bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Downloading...' : 'Download Invoice'}</span>
        </button>
      </div>
    </div>
  );
};
