export interface BusinessProfile {
  id: string;
  name: string;
  tagline?: string;
  logoUrl?: string; // Data URL or icon
  signatureUrl?: string; // Data URL for authorised signatory
  phone: string;
  email: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  gstNumber: string;
  panNumber?: string;
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;
    upiId: string;
  };
  invoicePrefix: string;
  invoiceNextSeq: number;
  currency: string;
  defaultNotes: string;
  defaultTerms: string;
  themeColor: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  businessId: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  name: string;
  description?: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  gstRate: number; // e.g., 0, 5, 12, 18, 28
  amount: number;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: 'UPI' | 'Bank Transfer' | 'Cash' | 'Card' | 'Cheque';
  transactionRef?: string;
  notes?: string;
}

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  businessId: string;
  customer: {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstNumber?: string;
  };
  invoiceDate: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  discountPercent?: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  paymentRecords: PaymentRecord[];
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedProduct {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  hsnCode?: string;
  defaultPrice: number;
  defaultGstRate: number;
  unit: string;
}
