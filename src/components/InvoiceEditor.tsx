import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Sparkles, Package, Save, Check, Send } from 'lucide-react';
import { BusinessProfile, Customer, Invoice, LineItem, SavedProduct } from '../types';
import { customerService, invoiceService, productService } from '../services/storage';
import { formatCurrency } from '../utils/numberToWords';
import { generateWhatsAppMessage, openWhatsAppDirect } from '../utils/whatsapp';

interface InvoiceEditorProps {
  initialInvoice?: Invoice | null;
  business: BusinessProfile;
  onClose: () => void;
  onSave: (invoice: Invoice, openPreview?: boolean) => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  initialInvoice,
  business,
  onClose,
  onSave,
}) => {
  const currency = business.currency || '₹';
  const existingCustomers = customerService.getAllCustomers(business.id);
  const savedProducts = productService.getAllProducts(business.id);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    initialInvoice?.invoiceNumber || invoiceService.generateUniqueInvoiceNumber(business.id)
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(
    initialInvoice?.invoiceDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    initialInvoice?.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  // Customer State
  const [customerName, setCustomerName] = useState(initialInvoice?.customer.name || '');
  const [customerPhone, setCustomerPhone] = useState(initialInvoice?.customer.phone || '');
  const [customerEmail, setCustomerEmail] = useState(initialInvoice?.customer.email || '');
  const [customerAddress, setCustomerAddress] = useState(initialInvoice?.customer.address || '');
  const [customerCity, setCustomerCity] = useState(initialInvoice?.customer.city || '');
  const [customerState, setCustomerState] = useState(initialInvoice?.customer.state || '');
  const [customerPincode, setCustomerPincode] = useState(initialInvoice?.customer.pincode || '');
  const [customerGst, setCustomerGst] = useState(initialInvoice?.customer.gstNumber || '');

  // Line Items
  const [items, setItems] = useState<LineItem[]>(
    initialInvoice?.items && initialInvoice.items.length > 0
      ? initialInvoice.items
      : [
          {
            id: `item_${Date.now()}_1`,
            name: '',
            description: '',
            hsnCode: '',
            quantity: 1,
            unit: 'pcs',
            unitPrice: 0,
            discountPercent: 0,
            gstRate: 18,
            amount: 0,
          },
        ]
  );

  // Additional Payment / Terms
  const [invoiceDiscountPercent, setInvoiceDiscountPercent] = useState<number>(
    initialInvoice?.discountPercent || 0
  );
  const [notes, setNotes] = useState<string>(initialInvoice?.notes ?? business.defaultNotes);
  const [terms, setTerms] = useState<string>(initialInvoice?.terms ?? business.defaultTerms);

  // Product catalog modal
  const [showCatalogPicker, setShowCatalogPicker] = useState<number | null>(null);

  // Auto calculate item amount
  const calculateItemAmount = (item: LineItem): number => {
    const rawTotal = item.quantity * item.unitPrice;
    const discount = (rawTotal * (item.discountPercent || 0)) / 100;
    return Math.max(0, rawTotal - discount);
  };

  // Recalculate line items
  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    item.amount = calculateItemAmount(item);
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item_${Date.now()}_${items.length + 1}`,
        name: '',
        description: '',
        hsnCode: '',
        quantity: 1,
        unit: 'pcs',
        unitPrice: 0,
        discountPercent: 0,
        gstRate: 18,
        amount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const pickCustomer = (cust: Customer) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setCustomerEmail(cust.email || '');
    setCustomerAddress(cust.address || '');
    setCustomerCity(cust.city || '');
    setCustomerState(cust.state || '');
    setCustomerPincode(cust.pincode || '');
    setCustomerGst(cust.gstNumber || '');
  };

  const pickProductForItem = (prod: SavedProduct, index: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      name: prod.name,
      description: prod.description || '',
      hsnCode: prod.hsnCode || '',
      unitPrice: prod.defaultPrice,
      gstRate: prod.defaultGstRate,
      unit: prod.unit || 'pcs',
    };
    newItems[index].amount = calculateItemAmount(newItems[index]);
    setItems(newItems);
    setShowCatalogPicker(null);
  };

  // Summary Calculations
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const itemDiscounts = items.reduce(
    (acc, item) => acc + (item.quantity * item.unitPrice * (item.discountPercent || 0)) / 100,
    0
  );
  const itemsAfterItemDiscount = Math.max(0, subtotal - itemDiscounts);
  const overallDiscount = (itemsAfterItemDiscount * (invoiceDiscountPercent || 0)) / 100;
  const totalDiscount = itemDiscounts + overallDiscount;

  // Tax calculation applied to taxable item amounts
  const totalTax = items.reduce((acc, item) => {
    const discountMultiplier = 1 - (invoiceDiscountPercent || 0) / 100;
    const taxableItem = item.amount * Math.max(0, discountMultiplier);
    return acc + (taxableItem * (item.gstRate || 0)) / 100;
  }, 0);

  const totalAmount = Math.max(0, subtotal - totalDiscount + totalTax);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (action: 'whatsapp' | 'preview' | 'save' = 'whatsapp') => {
    setErrorMsg(null);
    if (!customerName.trim()) {
      setErrorMsg('Please enter customer name');
      return;
    }
    if (items.some((i) => !i.name.trim())) {
      setErrorMsg('Please provide a name for all line items');
      return;
    }

    const payload: Partial<Invoice> = {
      id: initialInvoice?.id,
      invoiceNumber: invoiceNumber.trim(),
      businessId: business.id,
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || undefined,
        address: customerAddress.trim() || undefined,
        city: customerCity.trim() || undefined,
        state: customerState.trim() || undefined,
        pincode: customerPincode.trim() || undefined,
        gstNumber: customerGst.trim() || undefined,
      },
      invoiceDate,
      dueDate,
      items,
      subtotal,
      discountPercent: invoiceDiscountPercent,
      totalDiscount,
      totalTax,
      totalAmount,
      amountPaid: totalAmount,
      balanceDue: 0,
      status: 'PAID',
      paymentRecords: initialInvoice?.paymentRecords || [],
      notes,
      terms,
    };

    const saved = invoiceService.saveInvoice(payload);

    if (customerPhone.trim()) {
      const msg = generateWhatsAppMessage(saved, business);
      openWhatsAppDirect(customerPhone.trim(), msg);
    }
    
    // Immediately open invoice view with generated bill
    onSave(saved, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div>
            <h2 className="font-bold text-base tracking-tight">
              {initialInvoice ? `Edit Invoice #${initialInvoice.invoiceNumber}` : 'Create New Tax Invoice'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unique sequential invoice number automatically managed
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Invoice Meta & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Auto-generated. You can customize prefix/sequence.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
              <div className="flex gap-2 mt-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setDueDate(new Date().toISOString().split('T')[0])}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  Today
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  +7 Days
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setDueDate(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0])}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  +15 Days
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0])}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  +30 Days
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Customer Information */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Customer Details (Billed To)</h3>
              {existingCustomers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Auto-fill existing:</span>
                  <select
                    onChange={(e) => {
                      const found = existingCustomers.find((c) => c.id === e.target.value);
                      if (found) pickCustomer(found);
                    }}
                    defaultValue=""
                    className="text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white focus:outline-none"
                  >
                    <option value="" disabled>
                      Choose customer...
                    </option>
                    {existingCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar / Nexus Tech"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  WhatsApp / Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9820154321 (for WhatsApp direct)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  Used for 1-click WhatsApp bill sending
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">
                  Billing Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Street address, building, suite"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Customer GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27AAAPA1234A1Z5"
                  value={customerGst}
                  onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Line Items */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Line Items & Products</h3>
              {savedProducts.length > 0 && (
                <span className="text-[11px] text-slate-500">
                  Tip: Use the package icon to insert catalog items
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-3"
                >
                  <div className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-12 sm:col-span-5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Item / Service Name *</label>
                        {savedProducts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowCatalogPicker(showCatalogPicker === index ? null : index)}
                            className="text-[10px] text-indigo-700 hover:text-indigo-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Package className="w-3 h-3" /> Insert from Catalog
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Wi-Fi Router / Software Consulting"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                        required
                      />

                      {/* Dropdown if catalog open for this row */}
                      {showCatalogPicker === index && (
                        <div className="mt-1 p-2 bg-white rounded-lg border border-slate-300 shadow-lg space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">
                            Select Saved Item
                          </p>
                          <div className="max-h-36 overflow-y-auto divide-y divide-slate-100">
                            {savedProducts.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => pickProductForItem(p, index)}
                                className="w-full text-left p-1.5 hover:bg-slate-50 flex justify-between items-center text-xs"
                              >
                                <span>{p.name}</span>
                                <span className="font-mono text-slate-500">
                                  {currency} {p.defaultPrice} ({p.defaultGstRate}%)
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder="Optional description / details..."
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full mt-1 px-2.5 py-1 text-[11px] border border-slate-200 rounded bg-white text-slate-600 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">HSN/SAC</label>
                      <input
                        type="text"
                        placeholder="851762"
                        value={item.hsnCode || ''}
                        onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1">
                      <label className="block font-semibold text-slate-700 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white font-mono tabular-nums text-center focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1">
                      <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                      <input
                        type="text"
                        placeholder="pcs"
                        value={item.unit || 'pcs'}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white text-center focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Rate ({currency})</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono tabular-nums text-right focus:outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1">
                      <label className="block font-semibold text-slate-700 mb-1">GST %</label>
                      <select
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', parseInt(e.target.value))}
                        className="w-full px-1 py-1.5 border border-slate-300 rounded-md bg-white text-center font-mono focus:outline-none"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 text-[11px]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Discount:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={item.discountPercent === 0 ? '' : item.discountPercent}
                          onChange={(e) => handleItemChange(index, 'discountPercent', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                          className="w-14 px-1.5 py-0.5 border border-slate-300 rounded text-center font-mono placeholder:text-slate-400"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">
                        Total:{' '}
                        <strong className="font-mono text-slate-900 text-xs">
                          {formatCurrency(item.amount, currency)}
                        </strong>
                      </span>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Line Item</span>
              </button>
            </div>
          </div>

          {/* Section 4: Calculations & Advance Payment */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="md:col-span-7 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes to Customer</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none"
                  placeholder="Notes or pleasantries..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none font-sans"
                  placeholder="Payment conditions, warranty..."
                />
              </div>
            </div>

            <div className="md:col-span-5 space-y-2 border-l border-slate-200 pl-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums">{formatCurrency(subtotal, currency)}</span>
              </div>

              {/* Invoice-wide Discount Percentage */}
              <div className="pt-2 pb-2 border-y border-slate-200/80 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700">Bill Discount (%)</label>
                  <div className="flex gap-1">
                    {[0, 5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setInvoiceDiscountPercent(pct)}
                        className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors cursor-pointer ${
                          invoiceDiscountPercent === pct
                            ? 'bg-slate-900 text-white border-slate-900 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={invoiceDiscountPercent === 0 ? '' : invoiceDiscountPercent}
                    onChange={(e) => setInvoiceDiscountPercent(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 px-2 py-1 border border-slate-300 rounded text-center font-mono font-semibold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
                  />
                  <span className="text-slate-500 text-[11px]">% Special Discount</span>
                  {overallDiscount > 0 && (
                    <span className="font-mono text-emerald-700 font-semibold ml-auto text-[11px]">
                      - {formatCurrency(overallDiscount, currency)}
                    </span>
                  )}
                </div>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="font-mono tabular-nums font-semibold">- {formatCurrency(totalDiscount, currency)}</span>
                </div>
              )}

              {totalTax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax Total:</span>
                  <span className="font-mono tabular-nums">{formatCurrency(totalTax, currency)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2.5 border-t-2 border-slate-900 text-slate-900">
                <span className="text-sm font-bold">Total Amount:</span>
                <span className="font-mono tabular-nums text-base font-extrabold text-slate-900">
                  {formatCurrency(totalAmount, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
            >
              Cancel
            </button>
            {errorMsg && (
              <span className="text-xs text-rose-600 font-semibold">
                ⚠️ {errorMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('whatsapp')}
              className="px-6 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer text-xs inline-flex items-center gap-2 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Generate Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
