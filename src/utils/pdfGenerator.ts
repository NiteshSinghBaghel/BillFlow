import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, BusinessProfile } from '../types';

/**
 * Renders an HTML invoice element into a crisp A4 jsPDF instance and returns a PDF Blob.
 */
export async function generateInvoicePdfBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2, // 2x high resolution
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1024,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  // Standard A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

  return pdf.output('blob');
}

/**
 * Triggers direct download of the PDF file.
 */
export async function downloadInvoicePdf(
  invoice: Invoice,
  element: HTMLElement
): Promise<Blob> {
  const blob = await generateInvoicePdfBlob(element);
  const fileName = `Invoice_${invoice.invoiceNumber.replace(/[^\w-]/g, '_')}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return blob;
}

/**
 * Creates a File object from the PDF blob for Web Share API.
 */
export function createInvoicePdfFile(blob: Blob, invoiceNumber: string): File {
  const fileName = `Invoice_${invoiceNumber.replace(/[^\w-]/g, '_')}.pdf`;
  return new File([blob], fileName, { type: 'application/pdf' });
}
