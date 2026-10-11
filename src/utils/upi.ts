import QRCode from 'qrcode';

export interface UpiParams {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  currency?: string;
}

export function generateUpiUri({ upiId, payeeName, amount, transactionNote, currency = 'INR' }: UpiParams): string {
  if (!upiId) return '';
  const cleanUpi = upiId.trim();
  const encodedName = encodeURIComponent(payeeName.trim().slice(0, 50));
  const encodedNote = encodeURIComponent(transactionNote.trim().slice(0, 50));
  const validAmount = isNaN(amount) ? 0 : Math.max(0, amount).toFixed(2);

  // Standard NPCI UPI URI specification
  return `upi://pay?pa=${cleanUpi}&pn=${encodedName}&am=${validAmount}&cu=${currency}&tn=${encodedNote}`;
}

export async function generateQrDataUrl(text: string): Promise<string> {
  if (!text) return '';
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}
