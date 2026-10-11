import React, { useState, useEffect, useCallback } from 'react';
import {
  authService,
  businessService,
  customerService,
  invoiceService,
  productService,
  initDatabase,
} from './services/storage';
import { BusinessProfile, Customer, Invoice, SavedProduct, UserAccount } from './types';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoiceViewModal } from './components/InvoiceViewModal';
import { PaymentModal } from './components/PaymentModal';
import { BusinessProfileView } from './components/BusinessProfileView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { AuthPage } from './components/AuthPage';
import { PublicInvoiceView } from './components/PublicInvoiceView';

export default function App() {
  // App initialization
  const [user, setUser] = useState<UserAccount | null>(null);
  const [business, setBusiness] = useState<BusinessProfile>(() => {
    initDatabase();
    return businessService.getCurrentBusiness();
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<SavedProduct[]>([]);

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<string>('ALL');

  // Modals & Editors
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);
  const [publicViewInvoice, setPublicViewInvoice] = useState<Invoice | null>(null);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);

  // Check URL query parameters for ?bill=... to show public customer view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billId = params.get('bill');
    if (billId) {
      initDatabase();
      const allInvoices = invoiceService.getAllInvoices();
      const found =
        allInvoices.find((i) => i.id === billId || i.invoiceNumber.toLowerCase() === billId.toLowerCase()) ||
        invoiceService.getInvoiceById(billId);
      if (found) {
        setPublicViewInvoice(found);
      }
    }
  }, []);

  // Refresh data function
  const refreshAll = useCallback(() => {
    const curUser = authService.getCurrentUser();
    setUser(curUser);
    const curBiz = businessService.getCurrentBusiness();
    setBusiness(curBiz);
    setInvoices(invoiceService.getAllInvoices(curBiz.id));
    setCustomers(customerService.getAllCustomers(curBiz.id));
    setProducts(productService.getAllProducts(curBiz.id));
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Invoice Handlers
  const handleOpenNewInvoice = () => {
    setEditingInvoice(null);
    setIsEditorOpen(true);
  };

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setIsEditorOpen(true);
    setPreviewingInvoice(null);
  };

  const handleSaveInvoice = (saved: Invoice, openPreview?: boolean) => {
    setIsEditorOpen(false);
    setEditingInvoice(null);
    refreshAll();
    if (openPreview) {
      setPreviewingInvoice(saved);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    invoiceService.deleteInvoice(id);
    refreshAll();
  };

  const handleRecordPayment = (invoiceId: string, payment: any) => {
    invoiceService.recordPayment(invoiceId, payment);
    refreshAll();
    // Update preview if open
    if (previewingInvoice && previewingInvoice.id === invoiceId) {
      const updated = invoiceService.getInvoiceById(invoiceId);
      if (updated) setPreviewingInvoice(updated);
    }
  };

  const handleNewInvoiceForCustomer = (cust: Customer) => {
    setEditingInvoice({
      id: '',
      invoiceNumber: invoiceService.generateUniqueInvoiceNumber(business.id),
      businessId: business.id,
      customer: {
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        address: cust.address,
        city: cust.city,
        state: cust.state,
        pincode: cust.pincode,
        gstNumber: cust.gstNumber,
      },
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: `item_${Date.now()}`,
          name: '',
          quantity: 1,
          unit: 'pcs',
          unitPrice: 0,
          discountPercent: 0,
          gstRate: 18,
          amount: 0,
        },
      ],
      subtotal: 0,
      discountPercent: 0,
      totalDiscount: 0,
      totalTax: 0,
      totalAmount: 0,
      amountPaid: 0,
      balanceDue: 0,
      status: 'PENDING',
      paymentRecords: [],
      notes: business.defaultNotes,
      terms: business.defaultTerms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsEditorOpen(true);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentTab('dashboard');
  };

  const handleNavigateToInvoices = (statusFilter?: string) => {
    if (statusFilter) {
      setInvoiceFilterStatus(statusFilter);
    }
    setCurrentTab('invoices');
  };

  // If a public customer view is requested (e.g. from WhatsApp link)
  if (publicViewInvoice) {
    return (
      <PublicInvoiceView
        invoice={publicViewInvoice}
        business={business}
        onBackToApp={() => {
          setPublicViewInvoice(null);
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  // If user is logged out, render the Login & Signup page
  if (!user) {
    return <AuthPage onLoginSuccess={refreshAll} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewInvoice={handleOpenNewInvoice}
        business={business}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Viewport Container */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            invoices={invoices}
            business={business}
            onCreateInvoice={handleOpenNewInvoice}
            onViewInvoice={(inv) => setPreviewingInvoice(inv)}
            onRecordPayment={(inv) => setPaymentTargetInvoice(inv)}
            onNavigateToInvoices={handleNavigateToInvoices}
          />
        )}

        {currentTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            business={business}
            initialFilterStatus={invoiceFilterStatus}
            onCreateInvoice={handleOpenNewInvoice}
            onViewInvoice={(inv) => setPreviewingInvoice(inv)}
            onEditInvoice={handleEditInvoice}
            onRecordPayment={(inv) => setPaymentTargetInvoice(inv)}
            onDeleteInvoice={handleDeleteInvoice}
          />
        )}

        {currentTab === 'customers' && (
          <CustomersView
            customers={customers}
            invoices={invoices}
            business={business}
            onRefreshCustomers={refreshAll}
            onNewInvoiceForCustomer={handleNewInvoiceForCustomer}
          />
        )}

        {currentTab === 'catalog' && (
          <ProductsView
            products={products}
            business={business}
            onRefreshProducts={refreshAll}
          />
        )}

        {currentTab === 'settings' && (
          <BusinessProfileView
            business={business}
            onUpdateBusiness={(updated) => {
              businessService.updateBusiness(updated);
              refreshAll();
            }}
            onRefreshAllData={refreshAll}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            BillFlow · {business.name} · All records stored locally in browser storage
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Direct WhatsApp Invoicing</span>
            <span>·</span>
            <span>A4 PDF Printing</span>
            <span>·</span>
            <span>UPI QR Scan & Pay</span>
          </div>
        </div>
      </footer>

      {/* Invoice Editor Modal */}
      {isEditorOpen && (
        <InvoiceEditor
          initialInvoice={editingInvoice}
          business={business}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingInvoice(null);
          }}
          onSave={handleSaveInvoice}
        />
      )}

      {/* Invoice View / Print / WhatsApp Modal */}
      {previewingInvoice && (
        <InvoiceViewModal
          invoice={previewingInvoice}
          business={business}
          onClose={() => setPreviewingInvoice(null)}
          onEdit={(inv) => handleEditInvoice(inv)}
          onOpenPublicView={(inv) => {
            setPreviewingInvoice(null);
            setPublicViewInvoice(inv);
          }}
        />
      )}

      {/* Payment Recording Modal */}
      {paymentTargetInvoice && (
        <PaymentModal
          invoice={paymentTargetInvoice}
          business={business}
          onClose={() => setPaymentTargetInvoice(null)}
          onSavePayment={handleRecordPayment}
        />
      )}
    </div>
  );
}
