import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Send,
  Printer,
  CreditCard,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { BusinessProfile, Invoice, InvoiceStatus } from '../types';
import { formatCurrency } from '../utils/numberToWords';
import { generateWhatsAppMessage, openWhatsAppDirect } from '../utils/whatsapp';

interface InvoiceListProps {
  invoices: Invoice[];
  business: BusinessProfile;
  initialFilterStatus?: string;
  onCreateInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  business,
  initialFilterStatus = 'ALL',
  onCreateInvoice,
  onViewInvoice,
  onEditInvoice,
  onRecordPayment,
  onDeleteInvoice,
}) => {
  const currency = business.currency || '₹';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterStatus);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Status counts
  const counts = useMemo(() => {
    const res = { ALL: invoices.length, PENDING: 0, PARTIAL: 0, PAID: 0, OVERDUE: 0 };
    invoices.forEach((inv) => {
      if (inv.status === 'PAID') res.PAID++;
      else if (inv.status === 'PARTIAL') res.PARTIAL++;
      else if (inv.status === 'OVERDUE') res.OVERDUE++;
      else if (inv.status === 'PENDING') res.PENDING++;
    });
    return res;
  }, [invoices]);

  // Filtered List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search query matches invoice number, customer name, or customer phone
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesName = inv.customer.name.toLowerCase().includes(q);
        const matchesPhone = inv.customer.phone.toLowerCase().includes(q);
        if (!matchesNum && !matchesName && !matchesPhone) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (startDate && inv.invoiceDate < startDate) {
        return false;
      }
      if (endDate && inv.invoiceDate > endDate) {
        return false;
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter, startDate, endDate]);

  const handleSendWhatsApp = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    const message = generateWhatsAppMessage(inv, business);
    openWhatsAppDirect(inv.customer.phone, message);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'ALL' || startDate || endDate);

  return (
    <div className="space-y-4">
      {/* Top Header & New Invoice Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Invoices & Bills
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search invoices, dispatch via WhatsApp, monitor collections, and print records
          </p>
        </div>

        <button
          onClick={onCreateInvoice}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box: Unique auto-search by invoice number, customer name, phone */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice Number (#INV-2026-...), Customer Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date range inputs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tabbed Status Filter Controls */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          {[
            { id: 'ALL', label: 'All Invoices', count: counts.ALL },
            { id: 'PENDING', label: 'Pending', count: counts.PENDING },
            { id: 'PARTIAL', label: 'Partial', count: counts.PARTIAL },
            { id: 'OVERDUE', label: 'Overdue', count: counts.OVERDUE },
            { id: 'PAID', label: 'Paid', count: counts.PAID },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-sm font-mono ${
                  statusFilter === tab.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/60 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">No matching invoices found</p>
            <p className="text-xs mt-1">
              {hasActiveFilters
                ? 'Try clearing your search query or date filters'
                : 'Get started by creating your first business bill'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onCreateInvoice}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Create Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onViewInvoice(inv)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      #{inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{inv.customer.name}</p>
                      {inv.customer.phone && (
                        <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                          {inv.customer.phone}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{inv.invoiceDate}</td>
                    <td className="py-3 px-4 text-center text-slate-600 font-mono">
                      {inv.items.length} {inv.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {inv.totalDiscount > 0 ? (
                        <span className="text-emerald-700 font-medium">
                          -{formatCurrency(inv.totalDiscount, currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums text-xs">
                      {formatCurrency(inv.totalAmount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* WhatsApp Send */}
                        <button
                          onClick={(e) => handleSendWhatsApp(e, inv)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="Direct WhatsApp Send"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* View & PDF Print */}
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="View / Print PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete invoice #${inv.invoiceNumber}?`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
          <span>
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </span>
          <span className="font-mono">
            Total Displayed: {formatCurrency(filteredInvoices.reduce((acc, i) => acc + i.totalAmount, 0), currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
