import { BusinessProfile, Customer, Invoice, InvoiceStatus, LineItem, PaymentRecord, SavedProduct, UserAccount } from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'billflow_accounts_v1',
  CURRENT_USER: 'billflow_current_user_v1',
  BUSINESSES: 'billflow_businesses_v1',
  INVOICES: 'billflow_invoices_v1',
  CUSTOMERS: 'billflow_customers_v1',
  PRODUCTS: 'billflow_products_v1',
};

// Seed initial data if first time
function seedInitialData(): {
  user: UserAccount;
  business: BusinessProfile;
  invoices: Invoice[];
  customers: Customer[];
  products: SavedProduct[];
} {
  const defaultBusinessId = 'biz_default_01';
  const defaultUserId = 'usr_default_01';

  const user: UserAccount = {
    id: defaultUserId,
    name: 'Vikram Mehta',
    email: 'owner@apexenterprises.in',
    password: 'password123',
    businessId: defaultBusinessId,
    createdAt: new Date().toISOString(),
  };

  const business: BusinessProfile = {
    id: defaultBusinessId,
    name: 'Apex Infotech & Hardware',
    tagline: 'Enterprise Hardware, Networking & Cloud Solutions',
    logoUrl: '',
    phone: '+91 98201 54321',
    email: 'billing@apexinfotech.in',
    website: 'https://apexinfotech.in',
    address: {
      street: '402, Trade Square, Cyber Park Road, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      country: 'India',
    },
    gstNumber: '27AABCA5432K1Z8',
    panNumber: 'AABCA5432K',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountHolderName: 'Apex Infotech Solutions',
      accountNumber: '50200087451299',
      ifscCode: 'HDFC0000240',
      branchName: 'Andheri East Branch, Mumbai',
      upiId: 'apexinfotech@okhdfcbank',
    },
    invoicePrefix: 'INV-2026-',
    invoiceNextSeq: 1005,
    currency: '₹',
    defaultNotes: 'Thank you for partnering with Apex Infotech. We appreciate your prompt payment.',
    defaultTerms: '1. Payment is due within 15 days of invoice date.\n2. Invoices overdue past 30 days are subject to 1.5% monthly interest.\n3. Goods once sold will be replaced only under manufacturer warranty terms.',
    themeColor: '#0f172a',
  };

  const customers: Customer[] = [
    {
      id: 'cust_01',
      businessId: defaultBusinessId,
      name: 'Rohan Sharma',
      phone: '9820987654',
      email: 'rohan.sharma@nexusmedia.com',
      address: '7th Floor, Prism Tower, Mindspace',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400064',
      gstNumber: '27AABCN9988D1Z2',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'cust_02',
      businessId: defaultBusinessId,
      name: 'Priya Deshmukh',
      phone: '9819123456',
      email: 'priya@zenithtech.org',
      address: 'Plot 45, MIDC Industrial Area',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411018',
      gstNumber: '27AAACZ1122E1Z4',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'cust_03',
      businessId: defaultBusinessId,
      name: 'Amit Patel',
      phone: '9909055443',
      email: 'amit@patellogistics.in',
      address: 'Warehouse Complex 12, Sarkhej Highway',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382210',
      gstNumber: '24AAACP4433F1Z7',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'cust_04',
      businessId: defaultBusinessId,
      name: 'Sunita Rao',
      phone: '9740011223',
      email: 'sunita@raoconsulting.com',
      address: '102, Silicon Terraces, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      gstNumber: '',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ];

  const products: SavedProduct[] = [
    {
      id: 'prod_01',
      businessId: defaultBusinessId,
      name: 'Enterprise Router AX6000',
      description: 'Dual-band Gigabit Wi-Fi 6 router with firewall protection',
      hsnCode: '851762',
      defaultPrice: 14500,
      defaultGstRate: 18,
      unit: 'pcs',
    },
    {
      id: 'prod_02',
      businessId: defaultBusinessId,
      name: 'Managed 24-Port PoE Switch',
      description: 'Layer 2 managed switch with 4x SFP+ uplinks',
      hsnCode: '851762',
      defaultPrice: 28000,
      defaultGstRate: 18,
      unit: 'pcs',
    },
    {
      id: 'prod_03',
      businessId: defaultBusinessId,
      name: 'Cloud Setup & Configuration Service',
      description: 'Setup VPN tunnel, domain routing, and firewall rules',
      hsnCode: '998313',
      defaultPrice: 12000,
      defaultGstRate: 18,
      unit: 'hrs',
    },
    {
      id: 'prod_04',
      businessId: defaultBusinessId,
      name: 'Cat6 Shielded Cable (305m Drum)',
      description: 'High performance pure copper network cable',
      hsnCode: '854449',
      defaultPrice: 8500,
      defaultGstRate: 18,
      unit: 'box',
    },
    {
      id: 'prod_05',
      businessId: defaultBusinessId,
      name: 'Annual IT Support Contract (AMC)',
      description: 'Quarterly maintenance and 24/7 emergency response',
      hsnCode: '998315',
      defaultPrice: 35000,
      defaultGstRate: 18,
      unit: 'year',
    },
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv_1001',
      invoiceNumber: 'INV-2026-1001',
      businessId: defaultBusinessId,
      customer: {
        id: 'cust_01',
        name: 'Rohan Sharma',
        phone: '9820987654',
        email: 'rohan.sharma@nexusmedia.com',
        address: '7th Floor, Prism Tower, Mindspace',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400064',
        gstNumber: '27AABCN9988D1Z2',
      },
      invoiceDate: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: 'item_01',
          name: 'Enterprise Router AX6000',
          description: 'Dual-band Gigabit Wi-Fi 6 router',
          hsnCode: '851762',
          quantity: 2,
          unit: 'pcs',
          unitPrice: 14500,
          discountPercent: 5,
          gstRate: 18,
          amount: 27550,
        },
        {
          id: 'item_02',
          name: 'Cloud Setup & Configuration Service',
          description: 'Secure VPN and network firewall configuration',
          hsnCode: '998313',
          quantity: 1,
          unit: 'hrs',
          unitPrice: 12000,
          discountPercent: 0,
          gstRate: 18,
          amount: 12000,
        },
      ],
      subtotal: 39550,
      totalDiscount: 1450,
      totalTax: 7119,
      totalAmount: 46669,
      amountPaid: 46669,
      balanceDue: 0,
      status: 'PAID',
      paymentRecords: [
        {
          id: 'pay_01',
          date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          amount: 46669,
          method: 'UPI',
          transactionRef: 'UPI/329847291/HDFC',
          notes: 'Received via GPay QR Code',
        },
      ],
      notes: 'Thank you for your business!',
      terms: 'Warranty cards enclosed with delivery box.',
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'inv_1002',
      invoiceNumber: 'INV-2026-1002',
      businessId: defaultBusinessId,
      customer: {
        id: 'cust_02',
        name: 'Priya Deshmukh',
        phone: '9819123456',
        email: 'priya@zenithtech.org',
        address: 'Plot 45, MIDC Industrial Area',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411018',
        gstNumber: '27AAACZ1122E1Z4',
      },
      invoiceDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: 'item_03',
          name: 'Managed 24-Port PoE Switch',
          description: 'Layer 2 managed switch with 4x SFP+ uplinks',
          hsnCode: '851762',
          quantity: 2,
          unit: 'pcs',
          unitPrice: 28000,
          discountPercent: 0,
          gstRate: 18,
          amount: 56000,
        },
        {
          id: 'item_04',
          name: 'Cat6 Shielded Cable (305m Drum)',
          description: 'Network wiring roll',
          hsnCode: '854449',
          quantity: 3,
          unit: 'box',
          unitPrice: 8500,
          discountPercent: 0,
          gstRate: 18,
          amount: 25500,
        },
      ],
      subtotal: 81500,
      totalDiscount: 0,
      totalTax: 14670,
      totalAmount: 96170,
      amountPaid: 40000,
      balanceDue: 56170,
      status: 'PARTIAL',
      paymentRecords: [
        {
          id: 'pay_02',
          date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
          amount: 40000,
          method: 'Bank Transfer',
          transactionRef: 'NEFT/N1029384756',
          notes: 'Advance transfer received',
        },
      ],
      notes: 'Balance due upon installation completion.',
      terms: 'Standard terms apply.',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: 'inv_1003',
      invoiceNumber: 'INV-2026-1003',
      businessId: defaultBusinessId,
      customer: {
        id: 'cust_03',
        name: 'Amit Patel',
        phone: '9909055443',
        email: 'amit@patellogistics.in',
        address: 'Warehouse Complex 12, Sarkhej Highway',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '382210',
        gstNumber: '24AAACP4433F1Z7',
      },
      invoiceDate: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], // Past due!
      items: [
        {
          id: 'item_05',
          name: 'Annual IT Support Contract (AMC)',
          description: 'Quarterly maintenance and support visits',
          hsnCode: '998315',
          quantity: 1,
          unit: 'year',
          unitPrice: 35000,
          discountPercent: 10,
          gstRate: 18,
          amount: 31500,
        },
      ],
      subtotal: 31500,
      totalDiscount: 3500,
      totalTax: 5670,
      totalAmount: 37170,
      amountPaid: 0,
      balanceDue: 37170,
      status: 'OVERDUE',
      paymentRecords: [],
      notes: 'Please expedite payment as grace period has expired.',
      terms: 'Services suspended if overdue exceeds 30 days.',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'inv_1004',
      invoiceNumber: 'INV-2026-1004',
      businessId: defaultBusinessId,
      customer: {
        id: 'cust_04',
        name: 'Sunita Rao',
        phone: '9740011223',
        email: 'sunita@raoconsulting.com',
        address: '102, Silicon Terraces, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      invoiceDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: 'item_06',
          name: 'Enterprise Router AX6000',
          description: 'Branch office Wi-Fi 6 router',
          hsnCode: '851762',
          quantity: 1,
          unit: 'pcs',
          unitPrice: 14500,
          discountPercent: 0,
          gstRate: 18,
          amount: 14500,
        },
      ],
      subtotal: 14500,
      totalDiscount: 0,
      totalTax: 2610,
      totalAmount: 17110,
      amountPaid: 0,
      balanceDue: 17110,
      status: 'PENDING',
      paymentRecords: [],
      notes: 'Hardware dispatched via BlueDart courier.',
      terms: 'Warranty: 1 Year replacement.',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'inv_1005',
      invoiceNumber: 'INV-2026-1005',
      businessId: defaultBusinessId,
      customer: {
        id: 'cust_01',
        name: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul.sharma@apexsol.com',
        address: '402, Trade Tower, Bandra Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        gstNumber: '27AABCA1234F1Z5',
      },
      invoiceDate: new Date(Date.now() - 50 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: 'item_07',
          name: 'Server Rack 42U with PDU',
          description: 'High-density server enclosure',
          hsnCode: '851762',
          quantity: 1,
          unit: 'pcs',
          unitPrice: 52000,
          discountPercent: 5,
          gstRate: 18,
          amount: 49400,
        },
      ],
      subtotal: 49400,
      totalDiscount: 2600,
      totalTax: 8892,
      totalAmount: 58292,
      amountPaid: 58292,
      balanceDue: 0,
      status: 'PAID',
      paymentRecords: [
        {
          id: 'pay_03',
          date: new Date(Date.now() - 48 * 86400000).toISOString().split('T')[0],
          amount: 58292,
          method: 'Bank Transfer',
          transactionRef: 'RTGS/R9283746152',
          notes: 'Full payment cleared via RTGS',
        },
      ],
      notes: 'Prompt payment received with thanks.',
      terms: 'Standard hardware warranty applicable.',
      createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 48 * 86400000).toISOString(),
    },
    {
      id: 'inv_1006',
      invoiceNumber: 'INV-2026-1006',
      businessId: defaultBusinessId,
      customer: {
        id: 'cust_02',
        name: 'Priya Deshmukh',
        phone: '9819123456',
        email: 'priya@zenithtech.org',
        address: 'Plot 45, MIDC Industrial Area',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411018',
        gstNumber: '27AAACZ1122E1Z4',
      },
      invoiceDate: new Date(Date.now() - 80 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() - 65 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: 'item_08',
          name: 'Structured Cabling Certification & Auditing',
          description: 'Fluke network test report and validation',
          hsnCode: '998313',
          quantity: 2,
          unit: 'sites',
          unitPrice: 22000,
          discountPercent: 0,
          gstRate: 18,
          amount: 44000,
        },
      ],
      subtotal: 44000,
      totalDiscount: 0,
      totalTax: 7920,
      totalAmount: 51920,
      amountPaid: 51920,
      balanceDue: 0,
      status: 'PAID',
      paymentRecords: [
        {
          id: 'pay_04',
          date: new Date(Date.now() - 79 * 86400000).toISOString().split('T')[0],
          amount: 51920,
          method: 'UPI',
          transactionRef: 'UPI/7728192301/SBI',
          notes: 'Received on official UPI',
        },
      ],
      notes: 'Certification reports handed over.',
      terms: 'Payment terms: Immediate.',
      createdAt: new Date(Date.now() - 80 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 79 * 86400000).toISOString(),
    },
  ];

  return { user, business, invoices, customers, products };
}

// Storage helpers
function getFromStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultVal;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

// Initialize on module load
export function initDatabase(): void {
  const existingAccounts = getFromStorage<UserAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
  if (existingAccounts.length === 0) {
    const seed = seedInitialData();
    saveToStorage(STORAGE_KEYS.ACCOUNTS, [seed.user]);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, seed.user.id);
    saveToStorage(STORAGE_KEYS.BUSINESSES, [seed.business]);
    saveToStorage(STORAGE_KEYS.INVOICES, seed.invoices);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, seed.customers);
    saveToStorage(STORAGE_KEYS.PRODUCTS, seed.products);
  }
}

// Auto compute status based on payment & due date
export function computeInvoiceStatus(inv: {
  balanceDue: number;
  amountPaid: number;
  dueDate: string;
}): InvoiceStatus {
  if (inv.balanceDue <= 0.01) {
    return 'PAID';
  }
  if (inv.amountPaid > 0) {
    return 'PARTIAL';
  }
  const today = new Date().toISOString().split('T')[0];
  if (inv.dueDate && inv.dueDate < today) {
    return 'OVERDUE';
  }
  return 'PENDING';
}

// Authentication
export const authService = {
  getCurrentUser(): UserAccount | null {
    initDatabase();
    const currentId = getFromStorage<string | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!currentId) return null;
    const accounts = getFromStorage<UserAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
    return accounts.find((a) => a.id === currentId) || null;
  },

  login(email: string, password?: string): { success: boolean; message: string; user?: UserAccount } {
    initDatabase();
    const accounts = getFromStorage<UserAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
    const user = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: 'Account not found with this email' };
    }
    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user.id);
    return { success: true, message: 'Welcome back!', user };
  },

  register(
    name: string,
    email: string,
    password: string,
    businessName: string,
    phone?: string
  ): { success: boolean; message: string; user?: UserAccount } {
    initDatabase();
    const accounts = getFromStorage<UserAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
    if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'An account with this email already exists. Please sign in.' };
    }

    const businessId = `biz_${Date.now()}`;
    const userId = `usr_${Date.now()}`;

    const newBusiness: BusinessProfile = {
      id: businessId,
      name: businessName.trim() || 'My Business',
      tagline: 'Quality Products & Services',
      logoUrl: '',
      phone: phone ? phone.trim() : '',
      email: email.trim(),
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      },
      gstNumber: '',
      bankDetails: {
        bankName: '',
        accountHolderName: businessName.trim() || name.trim(),
        accountNumber: '',
        ifscCode: '',
        upiId: '',
      },
      invoicePrefix: 'INV-2026-',
      invoiceNextSeq: 1001,
      currency: '₹',
      defaultNotes: 'Thank you for your business. Please make payment before the due date.',
      defaultTerms: '1. Goods once sold will not be returned.\n2. Interest @ 18% p.a. will be charged after due date.\n3. Subject to local jurisdiction.',
      themeColor: '#0f172a',
    };

    const newUser: UserAccount = {
      id: userId,
      name: name.trim(),
      email: email.trim(),
      password,
      businessId,
      createdAt: new Date().toISOString(),
    };

    const businesses = getFromStorage<BusinessProfile[]>(STORAGE_KEYS.BUSINESSES, []);
    businesses.push(newBusiness);
    saveToStorage(STORAGE_KEYS.BUSINESSES, businesses);

    accounts.push(newUser);
    saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, userId);

    return { success: true, message: 'Business account created successfully!', user: newUser };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
};

// Business Profile Service
export const businessService = {
  getCurrentBusiness(): BusinessProfile {
    initDatabase();
    const user = authService.getCurrentUser();
    const businesses = getFromStorage<BusinessProfile[]>(STORAGE_KEYS.BUSINESSES, []);
    if (user) {
      const match = businesses.find((b) => b.id === user.businessId);
      if (match) return match;
    }
    return businesses[0] || seedInitialData().business;
  },

  updateBusiness(updated: BusinessProfile): BusinessProfile {
    const businesses = getFromStorage<BusinessProfile[]>(STORAGE_KEYS.BUSINESSES, []);
    const index = businesses.findIndex((b) => b.id === updated.id);
    if (index >= 0) {
      businesses[index] = updated;
    } else {
      businesses.push(updated);
    }
    saveToStorage(STORAGE_KEYS.BUSINESSES, businesses);
    return updated;
  },
};

// Invoices Service
export const invoiceService = {
  getAllInvoices(businessId?: string): Invoice[] {
    initDatabase();
    const bId = businessId || businessService.getCurrentBusiness().id;
    const all = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    // Re-check overdue status dynamically
    const updated = all.map((inv) => {
      const computed = computeInvoiceStatus(inv);
      return computed !== inv.status ? { ...inv, status: computed } : inv;
    });
    return updated.filter((inv) => inv.businessId === bId);
  },

  getInvoiceById(id: string): Invoice | null {
    const all = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const found = all.find((i) => i.id === id);
    if (!found) return null;
    const computed = computeInvoiceStatus(found);
    return { ...found, status: computed };
  },

  generateUniqueInvoiceNumber(businessId: string): string {
    const business = businessService.getCurrentBusiness();
    const invoices = invoiceService.getAllInvoices(businessId);
    const existingNumbers = new Set(invoices.map((i) => i.invoiceNumber.trim().toUpperCase()));

    let seq = business.invoiceNextSeq || 1001;
    const prefix = business.invoicePrefix || 'INV-2026-';

    while (existingNumbers.has(`${prefix}${seq}`.toUpperCase())) {
      seq++;
    }

    return `${prefix}${seq}`;
  },

  saveInvoice(invoiceData: Partial<Invoice>): Invoice {
    const business = businessService.getCurrentBusiness();
    const all = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const now = new Date().toISOString();

    const isExisting = Boolean(invoiceData.id && all.some((i) => i.id === invoiceData.id));

    let finalInvoiceNumber = invoiceData.invoiceNumber?.trim() || '';
    if (!finalInvoiceNumber) {
      finalInvoiceNumber = invoiceService.generateUniqueInvoiceNumber(business.id);
    }

    // Check uniqueness if new or if invoice number changed
    const collision = all.find((i) => i.id !== invoiceData.id && i.invoiceNumber.toUpperCase() === finalInvoiceNumber.toUpperCase());
    if (collision) {
      finalInvoiceNumber = invoiceService.generateUniqueInvoiceNumber(business.id);
    }

    const subtotal = invoiceData.subtotal ?? 0;
    const totalTax = invoiceData.totalTax ?? 0;
    const totalAmount = invoiceData.totalAmount ?? (subtotal + totalTax);
    const amountPaid = invoiceData.amountPaid ?? 0;
    const balanceDue = Math.max(0, totalAmount - amountPaid);

    const calculatedStatus = computeInvoiceStatus({
      balanceDue,
      amountPaid,
      dueDate: invoiceData.dueDate || '',
    });

    const fullInvoice: Invoice = {
      id: isExisting ? invoiceData.id! : `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      invoiceNumber: finalInvoiceNumber,
      businessId: invoiceData.businessId || business.id,
      customer: invoiceData.customer || { name: 'Cash Customer', phone: '' },
      invoiceDate: invoiceData.invoiceDate || now.split('T')[0],
      dueDate: invoiceData.dueDate || now.split('T')[0],
      items: invoiceData.items || [],
      subtotal,
      discountPercent: invoiceData.discountPercent ?? 0,
      totalDiscount: invoiceData.totalDiscount ?? 0,
      totalTax,
      totalAmount,
      amountPaid,
      balanceDue,
      status: calculatedStatus,
      paymentRecords: invoiceData.paymentRecords || [],
      notes: invoiceData.notes ?? business.defaultNotes,
      terms: invoiceData.terms ?? business.defaultTerms,
      createdAt: isExisting ? invoiceData.createdAt || now : now,
      updatedAt: now,
    };

    if (isExisting) {
      const idx = all.findIndex((i) => i.id === fullInvoice.id);
      all[idx] = fullInvoice;
    } else {
      all.unshift(fullInvoice);
      // Bump business sequence if invoice number ended with current seq
      if (business.invoiceNextSeq && finalInvoiceNumber.endsWith(String(business.invoiceNextSeq))) {
        business.invoiceNextSeq += 1;
        businessService.updateBusiness(business);
      }
    }

    saveToStorage(STORAGE_KEYS.INVOICES, all);

    // Auto-update or add customer in directory
    if (fullInvoice.customer?.name) {
      customerService.syncCustomerFromInvoice(fullInvoice.businessId, fullInvoice.customer);
    }

    return fullInvoice;
  },

  deleteInvoice(id: string): void {
    const all = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const filtered = all.filter((i) => i.id !== id);
    saveToStorage(STORAGE_KEYS.INVOICES, filtered);
  },

  recordPayment(invoiceId: string, payment: Omit<PaymentRecord, 'id'>): Invoice | null {
    const inv = invoiceService.getInvoiceById(invoiceId);
    if (!inv) return null;

    const newRecord: PaymentRecord = {
      id: `pay_${Date.now()}`,
      ...payment,
    };

    const newPaymentRecords = [...inv.paymentRecords, newRecord];
    const newAmountPaid = inv.amountPaid + payment.amount;
    const newBalanceDue = Math.max(0, inv.totalAmount - newAmountPaid);
    const newStatus = computeInvoiceStatus({
      balanceDue: newBalanceDue,
      amountPaid: newAmountPaid,
      dueDate: inv.dueDate,
    });

    const updatedInvoice: Invoice = {
      ...inv,
      amountPaid: newAmountPaid,
      balanceDue: newBalanceDue,
      status: newStatus,
      paymentRecords: newPaymentRecords,
      updatedAt: new Date().toISOString(),
    };

    return invoiceService.saveInvoice(updatedInvoice);
  },

  duplicateInvoice(sourceInvoiceId: string): Invoice | null {
    const source = invoiceService.getInvoiceById(sourceInvoiceId);
    if (!source) return null;

    const business = businessService.getCurrentBusiness();
    const newNumber = invoiceService.generateUniqueInvoiceNumber(business.id);
    const today = new Date().toISOString().split('T')[0];
    
    // Add 15 days for due date default
    const due = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    const copyData: Partial<Invoice> = {
      businessId: business.id,
      invoiceNumber: newNumber,
      customer: { ...source.customer },
      invoiceDate: today,
      dueDate: due,
      items: source.items.map((it) => ({ ...it, id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}` })),
      subtotal: source.subtotal,
      totalDiscount: source.totalDiscount,
      totalTax: source.totalTax,
      totalAmount: source.totalAmount,
      amountPaid: 0,
      balanceDue: source.totalAmount,
      status: 'PENDING',
      paymentRecords: [],
      notes: source.notes,
      terms: source.terms,
    };

    return invoiceService.saveInvoice(copyData);
  },
};

// Customer Service
export const customerService = {
  getAllCustomers(businessId?: string): Customer[] {
    initDatabase();
    const bId = businessId || businessService.getCurrentBusiness().id;
    const all = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    return all.filter((c) => c.businessId === bId);
  },

  saveCustomer(cust: Partial<Customer>): Customer {
    const business = businessService.getCurrentBusiness();
    const all = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const isExisting = Boolean(cust.id && all.some((c) => c.id === cust.id));

    const fullCustomer: Customer = {
      id: isExisting ? cust.id! : `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: cust.businessId || business.id,
      name: cust.name || 'Unnamed Customer',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      city: cust.city || '',
      state: cust.state || '',
      pincode: cust.pincode || '',
      gstNumber: cust.gstNumber || '',
      createdAt: cust.createdAt || new Date().toISOString(),
    };

    if (isExisting) {
      const idx = all.findIndex((c) => c.id === fullCustomer.id);
      all[idx] = fullCustomer;
    } else {
      all.unshift(fullCustomer);
    }

    saveToStorage(STORAGE_KEYS.CUSTOMERS, all);
    return fullCustomer;
  },

  syncCustomerFromInvoice(businessId: string, invoiceCustomer: Invoice['customer']): void {
    if (!invoiceCustomer.name) return;
    const all = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const existing = all.find(
      (c) =>
        c.businessId === businessId &&
        (c.name.trim().toLowerCase() === invoiceCustomer.name.trim().toLowerCase() ||
          (invoiceCustomer.phone && c.phone === invoiceCustomer.phone))
    );

    if (existing) {
      existing.phone = invoiceCustomer.phone || existing.phone;
      existing.email = invoiceCustomer.email || existing.email;
      existing.address = invoiceCustomer.address || existing.address;
      existing.city = invoiceCustomer.city || existing.city;
      existing.state = invoiceCustomer.state || existing.state;
      existing.pincode = invoiceCustomer.pincode || existing.pincode;
      existing.gstNumber = invoiceCustomer.gstNumber || existing.gstNumber;
      saveToStorage(STORAGE_KEYS.CUSTOMERS, all);
    } else {
      customerService.saveCustomer({
        businessId,
        name: invoiceCustomer.name,
        phone: invoiceCustomer.phone,
        email: invoiceCustomer.email,
        address: invoiceCustomer.address,
        city: invoiceCustomer.city,
        state: invoiceCustomer.state,
        pincode: invoiceCustomer.pincode,
        gstNumber: invoiceCustomer.gstNumber,
      });
    }
  },

  deleteCustomer(id: string): void {
    const all = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    saveToStorage(
      STORAGE_KEYS.CUSTOMERS,
      all.filter((c) => c.id !== id)
    );
  },
};

// Products / Catalog Service
export const productService = {
  getAllProducts(businessId?: string): SavedProduct[] {
    initDatabase();
    const bId = businessId || businessService.getCurrentBusiness().id;
    const all = getFromStorage<SavedProduct[]>(STORAGE_KEYS.PRODUCTS, []);
    return all.filter((p) => p.businessId === bId);
  },

  saveProduct(prod: Partial<SavedProduct>): SavedProduct {
    const business = businessService.getCurrentBusiness();
    const all = getFromStorage<SavedProduct[]>(STORAGE_KEYS.PRODUCTS, []);
    const isExisting = Boolean(prod.id && all.some((p) => p.id === prod.id));

    const full: SavedProduct = {
      id: isExisting ? prod.id! : `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: prod.businessId || business.id,
      name: prod.name || 'New Item',
      description: prod.description || '',
      hsnCode: prod.hsnCode || '',
      defaultPrice: prod.defaultPrice ?? 0,
      defaultGstRate: prod.defaultGstRate ?? 18,
      unit: prod.unit || 'pcs',
    };

    if (isExisting) {
      const idx = all.findIndex((p) => p.id === full.id);
      all[idx] = full;
    } else {
      all.unshift(full);
    }

    saveToStorage(STORAGE_KEYS.PRODUCTS, all);
    return full;
  },

  deleteProduct(id: string): void {
    const all = getFromStorage<SavedProduct[]>(STORAGE_KEYS.PRODUCTS, []);
    saveToStorage(
      STORAGE_KEYS.PRODUCTS,
      all.filter((p) => p.id !== id)
    );
  },
};

// Data Backup & Export Service
export const backupService = {
  exportAllData(): string {
    const payload = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      accounts: getFromStorage(STORAGE_KEYS.ACCOUNTS, []),
      businesses: getFromStorage(STORAGE_KEYS.BUSINESSES, []),
      invoices: getFromStorage(STORAGE_KEYS.INVOICES, []),
      customers: getFromStorage(STORAGE_KEYS.CUSTOMERS, []),
      products: getFromStorage(STORAGE_KEYS.PRODUCTS, []),
    };
    return JSON.stringify(payload, null, 2);
  },

  downloadBackupFile(): void {
    const json = backupService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData(jsonContent: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.businesses || !parsed.invoices) {
        return { success: false, message: 'Invalid backup file structure' };
      }
      if (parsed.accounts) saveToStorage(STORAGE_KEYS.ACCOUNTS, parsed.accounts);
      if (parsed.businesses) saveToStorage(STORAGE_KEYS.BUSINESSES, parsed.businesses);
      if (parsed.invoices) saveToStorage(STORAGE_KEYS.INVOICES, parsed.invoices);
      if (parsed.customers) saveToStorage(STORAGE_KEYS.CUSTOMERS, parsed.customers);
      if (parsed.products) saveToStorage(STORAGE_KEYS.PRODUCTS, parsed.products);
      return { success: true, message: 'All data restored successfully!' };
    } catch (err) {
      return { success: false, message: 'Failed to read JSON backup file' };
    }
  },

  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.BUSINESSES);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    initDatabase();
  },
};
