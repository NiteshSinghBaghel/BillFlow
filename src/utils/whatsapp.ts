import { Invoice, BusinessProfile } from '../types';
import { generateInvoicePdfBlob, createInvoicePdfFile, downloadInvoicePdf } from './pdfGenerator';

export function cleanPhoneNumber(rawPhone: string, defaultCountryCode: string = '91'): string {
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = defaultCountryCode + cleaned;
  }
  return cleaned;
}

export function getPublicInvoiceUrl(invoiceId: string): string {
  const origin = window.location.origin;
  const path = window.location.pathname;
  return `${origin}${path}?bill=${encodeURIComponent(invoiceId)}`;
}

export function generateWhatsAppMessage(
  invoice: Invoice,
  business: BusinessProfile,
  customLink?: string
): string {
  const currency = business.currency || '₹';
  const totalStr = `${currency}${invoice.totalAmount.toFixed(1)}`;
  const balanceStr = `${currency}0.0`;
  const viewUrl = customLink || getPublicInvoiceUrl(invoice.id);

  return `Hey ${invoice.customer.name || 'Customer'} ,

Thank you for your business

Your Sales Invoice is ready! Check the details below

Sales Invoice No: ${invoice.invoiceNumber}
Invoice Amount: ${totalStr}
Balance Due: ${balanceStr}

Click the 'Download Invoice' button to download your invoice

Happy to serve you
${business.name}.

👉 Download Invoice: ${viewUrl}`;
}

export function openWhatsAppDirect(phone: string, message: string): void {
  const cleaned = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);

  const url = cleaned
    ? `https://wa.me/${cleaned}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Intelligent WhatsApp share with PDF attachment:
 * - On supported browsers/mobile: uses Web Share API to attach the actual PDF file directly into WhatsApp!
 * - On desktop or fallback: auto-downloads the PDF file for the owner and opens WhatsApp with the live link!
 */
export async function shareInvoiceOnWhatsAppWithPdf(
  invoice: Invoice,
  business: BusinessProfile,
  invoiceElement: HTMLElement,
  targetPhone?: string
): Promise<{ method: 'native-share' | 'wa-link'; error?: string }> {
  try {
    const message = generateWhatsAppMessage(invoice, business);
    const pdfBlob = await generateInvoicePdfBlob(invoiceElement);
    const pdfFile = createInvoicePdfFile(pdfBlob, invoice.invoiceNumber);

    // Check if browser supports sharing files (Android / iOS / Chrome / Edge)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: `Invoice #${invoice.invoiceNumber}`,
          text: message,
        });
        return { method: 'native-share' };
      } catch (shareErr: any) {
        // If user cancelled, return cleanly; if error, fall back to wa.me
        if (shareErr.name === 'AbortError') {
          return { method: 'native-share' };
        }
      }
    }

    // Fallback: auto-download the PDF so user has the file immediately, then open WhatsApp
    downloadInvoicePdf(invoice, invoiceElement);
    openWhatsAppDirect(targetPhone || invoice.customer.phone || '', message);
    return { method: 'wa-link' };
  } catch (err: any) {
    console.error('Error sharing invoice:', err);
    // Ultimate fallback: open WhatsApp text
    const message = generateWhatsAppMessage(invoice, business);
    openWhatsAppDirect(targetPhone || invoice.customer.phone || '', message);
    return { method: 'wa-link', error: err?.message };
  }
}
