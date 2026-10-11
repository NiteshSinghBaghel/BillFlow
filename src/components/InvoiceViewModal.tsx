import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Send,
  Download,
  Copy,
  Check,
  Edit2,
  ExternalLink,
  Share2,
  FileText,
} from 'lucide-react';
import { BusinessProfile, Invoice } from '../types';
import { InvoicePrintTemplate } from './InvoicePrintTemplate';
import {
  generateWhatsAppMessage,
  openWhatsAppDirect,
  shareInvoiceOnWhatsAppWithPdf,
  getPublicInvoiceUrl,
} from '../utils/whatsapp';
import { downloadInvoicePdf } from '../utils/pdfGenerator';
import { formatCurrency } from '../utils/numberToWords';

interface InvoiceViewModalProps {
  invoice: Invoice;
  business: BusinessProfile;
  onClose: () => void;
  onEdit: (invoice: Invoice) => void;
  onOpenPayment?: (invoice: Invoice) => void;
  onOpenPublicView?: (invoice: Invoice) => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  invoice,
  business,
  onClose,
  onEdit,
  onOpenPublicView,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [targetPhone, setTargetPhone] = useState(invoice.customer.phone || '');
  const [showWaPreview, setShowWaPreview] = useState(false); // Closed by default to keep invoice view clean
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);
  const currency = business.currency || '₹';
  const publicLink = getPublicInvoiceUrl(invoice.id);
  const waMessage = generateWhatsAppMessage(invoice, business);

  const handlePrint = () => {
    setShowWaPreview(false);
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsProcessingPdf(true);
    try {
      await downloadInvoicePdf(invoice, invoiceRef.current);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      window.print();
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleShareWhatsAppWithPdf = async () => {
    if (!invoiceRef.current) return;
    setIsProcessingPdf(true);
    try {
      await shareInvoiceOnWhatsAppWithPdf(
        invoice,
        business,
        invoiceRef.current,
        targetPhone
      );
    } catch (err) {
      console.error('Error sharing with PDF:', err);
      openWhatsAppDirect(targetPhone, waMessage);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Modal Card */}
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight font-mono">
                #{invoice.invoiceNumber}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-medium">
                {invoice.customer.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Direct */}
            <button
              onClick={() => setShowWaPreview(!showWaPreview)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp & PDF</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isProcessingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Download PDF File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isProcessingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(invoice)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WhatsApp & Customer PDF Sharing Drawer */}
        {showWaPreview && (
          <div className="no-print bg-emerald-50 border-b border-emerald-200 px-6 py-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-700" /> WhatsApp Customer Dispatch
                </span>
                <span className="text-[11px] text-emerald-800">
                  (Includes download link & PDF attachment)
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {onOpenPublicView && (
                  <button
                    type="button"
                    onClick={() => onOpenPublicView(invoice)}
                    className="text-emerald-800 hover:text-emerald-950 underline font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Preview Customer View</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setShowWaPreview(false)}
                  className="text-emerald-700 hover:underline"
                >
                  Hide Panel
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="Customer WhatsApp Number (e.g. 9820123456)"
                  className="w-full text-xs px-3 py-2 border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                />
              </div>

              {/* Primary Dispatch Action */}
              <button
                onClick={handleShareWhatsAppWithPdf}
                disabled={isProcessingPdf}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-lg inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isProcessingPdf ? 'Preparing PDF...' : 'Share on WhatsApp with PDF'}
                </span>
              </button>

              {/* Copy Message */}
              <button
                onClick={handleCopyText}
                className="px-3 py-2 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-medium text-xs rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Copy formatted text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Message'}</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyPublicLink}
                className="px-3 py-2 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-medium text-xs rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Copy customer bill link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Exact WhatsApp Message Card Mockup matching Screenshot */}
            <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-700/50 flex flex-col items-center">
              <div className="w-full max-w-sm bg-[#202c33] text-[#e9edef] rounded-lg overflow-hidden shadow-lg border border-slate-700/40 text-xs">
                {/* PDF Attachment thumbnail card at top */}
                <div className="bg-[#111b21] p-2.5 m-2 rounded-lg flex items-center gap-3 border border-slate-700/60">
                  <div className="w-10 h-12 bg-red-600 rounded flex flex-col items-center justify-center text-white text-[9px] font-bold shrink-0">
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200 text-xs truncate">
                      Invoice_{invoice.invoiceNumber}.pdf
                    </p>
                    <span className="text-[10px] text-slate-400">40 kB · Document</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-3 pt-1 space-y-2 font-sans leading-relaxed text-slate-200 text-[12px]">
                  <p>Hey {invoice.customer.name || 'Customer'} ,</p>
                  <p>Thank you for your business</p>
                  <p>Your Sales Invoice is ready! Check the details below</p>
                  <div className="space-y-0.5 pt-0.5">
                    <p>Sales Invoice No: <span className="font-mono">{invoice.invoiceNumber}</span></p>
                    <p>Invoice Amount: <span className="font-mono">{currency}{invoice.totalAmount.toFixed(1)}</span></p>
                    <p>Balance Due: <span className="font-mono">{currency}0.0</span></p>
                  </div>
                  <p className="pt-0.5">Click the 'Download Invoice' button to download your invoice</p>
                  <div className="pt-0.5">
                    <p>Happy to serve you</p>
                    <p className="font-semibold">{business.name}.</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Download Invoice CTA Button matching user request */}
                <div className="p-2 pt-1.5 border-t border-slate-700/80 bg-[#111b21]">
                  <a
                    href={publicLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-2 px-3 bg-[#202c33] hover:bg-[#2a3942] border border-slate-600/80 rounded-lg text-[#00a884] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00a884]" />
                    <span>Download Invoice</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70">
          <div
            ref={invoiceRef}
            className="shadow-lg rounded-sm overflow-hidden printable-invoice bg-white"
          >
            <InvoicePrintTemplate invoice={invoice} business={business} />
          </div>
        </div>

        {/* Bottom footer status */}
        <div className="no-print px-6 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              Total Amount:{' '}
              <strong className="text-slate-900 font-mono font-semibold">
                {formatCurrency(invoice.totalAmount, currency)}
              </strong>
            </span>
            <span>·</span>
            <span>Created {new Date(invoice.createdAt).toLocaleDateString()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
