/**
 * Converts numeric amounts into formal English words for tax invoices.
 */
export function numberToWords(num: number, currency: string = '₹'): string {
  if (isNaN(num) || num === 0) return 'Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10] + (a[n % 10] ? ' ' : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  const rounded = Math.round(num * 100) / 100;
  const wholePart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - wholePart) * 100);

  const prefix = currency === '₹' ? 'INR' : currency === '$' ? 'USD' : '';
  let words = inWords(wholePart).trim();
  
  if (decimalPart > 0) {
    words += ' and ' + inWords(decimalPart).trim() + ' Cents/Paise';
  }

  return (prefix ? prefix + ' ' : '') + words + ' Only';
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return `${currency} ${safeAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
