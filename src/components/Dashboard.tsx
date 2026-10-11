import React, { useMemo, useState } from 'react';
import {
  FileText,
  TrendingUp,
  Calendar,
  Plus,
  Send,
  Printer,
  ChevronRight,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react';
import { BusinessProfile, Invoice } from '../types';
import { formatCurrency } from '../utils/numberToWords';
import { generateWhatsAppMessage, openWhatsAppDirect } from '../utils/whatsapp';
import { MonthlySalesAnalysisGraph } from './MonthlySalesAnalysisGraph';

interface DashboardProps {
  invoices: Invoice[];
  business: BusinessProfile;
  onCreateInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onNavigateToInvoices: (filterStatus?: string) => void;
}

interface MonthlyStat {
  monthKey: string; // "2026-10"
  monthLabel: string; // "October 2026"
  invoiceCount: number;
  totalAmount: number;
  averageAmount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  invoices,
  business,
  onCreateInvoice,
  onViewInvoice,
  onRecordPayment,
  onNavigateToInvoices,
}) => {
  const currency = business.currency || '₹';
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Compute overall KPI metrics
  const totalInvoiceCount = invoices.length;
  const totalAmount = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return invoices.reduce((acc, inv) => {
      if (inv.status === 'PAID') return acc + inv.totalAmount;
      return acc + (inv.amountPaid || 0);
    }, 0);
  }, [invoices]);

  const totalPending = Math.max(0, totalAmount - totalPaid);
  const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 100;

  // Compute Month-by-Month Amounts
  const monthlyStats = useMemo(() => {
    const monthMap = new Map<string, { count: number; total: number }>();

    invoices.forEach((inv) => {
      const datePart = inv.invoiceDate || inv.createdAt.split('T')[0];
      const key = datePart.substring(0, 7); // e.g. "2026-10"
      const prev = monthMap.get(key) || { count: 0, total: 0 };
      monthMap.set(key, {
        count: prev.count + 1,
        total: prev.total + inv.totalAmount,
      });
    });

    // Sort descending by month key
    const sortedKeys = Array.from(monthMap.keys()).sort().reverse();

    const stats: MonthlyStat[] = sortedKeys.map((key) => {
      const [year, month] = key.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthLabel = dateObj.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      const data = monthMap.get(key)!;
      return {
        monthKey: key,
        monthLabel,
        invoiceCount: data.count,
        totalAmount: data.total,
        averageAmount: data.count > 0 ? data.total / data.count : 0,
      };
    });

    return stats;
  }, [invoices]);

  // Current Month Stats
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthStat = monthlyStats.find((m) => m.monthKey === currentMonthKey) || {
    monthKey: currentMonthKey,
    monthLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    invoiceCount: 0,
    totalAmount: 0,
    averageAmount: 0,
  };

  // Filtered recent invoices
  const recentInvoices = useMemo(() => {
    let list = [...invoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (selectedMonth !== 'ALL') {
      list = list.filter((inv) => (inv.invoiceDate || '').startsWith(selectedMonth));
    }
    return list.slice(0, 7);
  }, [invoices, selectedMonth]);

  const handleShareWhatsApp = (inv: Invoice) => {
    const msg = generateWhatsAppMessage(inv, business);
    openWhatsAppDirect(inv.customer.phone, msg);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of your sales performance, monthly collections, and invoices.
          </p>
        </div>
        <button
          onClick={onCreateInvoice}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Billed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalAmount, currency)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {totalInvoiceCount} {totalInvoiceCount === 1 ? 'invoice' : 'invoices'} created
            </div>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalPaid, currency)}
            </div>
            <div className="text-xs text-emerald-700/80 mt-1">
              {collectionRate}% collection rate
            </div>
          </div>
        </div>

        {/* Pending Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(totalPending, currency)}
            </div>
            <div className="text-xs text-amber-700/80 mt-1">
              Outstanding payments
            </div>
          </div>
        </div>

        {/* This Month's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>This Month</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(currentMonthStat.totalAmount, currency)}
            </div>
            <div className="text-xs text-indigo-700/80 mt-1">
              {currentMonthStat.invoiceCount} invoices in {currentMonthStat.monthLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Colorful Monthly Sales Analysis Graph */}
      <MonthlySalesAnalysisGraph
        invoices={invoices}
        currency={currency}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      {/* Two-Column Grid: Monthly Breakdown & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Billing Breakdown List */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">Billing summary per month</p>
            </div>
            {selectedMonth !== 'ALL' && (
              <button
                onClick={() => setSelectedMonth('ALL')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {monthlyStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No monthly records yet</p>
            ) : (
              monthlyStats.map((stat) => {
                const isSelected = selectedMonth === stat.monthKey;
                return (
                  <button
                    key={stat.monthKey}
                    onClick={() => setSelectedMonth(isSelected ? 'ALL' : stat.monthKey)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/70'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{stat.monthLabel}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {stat.invoiceCount} {stat.invoiceCount === 1 ? 'bill' : 'bills'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCurrency(stat.totalAmount, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Avg: {formatCurrency(stat.averageAmount, currency)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Recent Invoices */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Invoices</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedMonth === 'ALL'
                  ? 'Latest transactions'
                  : `Filtered by month: ${selectedMonth}`}
              </p>
            </div>
            <button
              onClick={() => onNavigateToInvoices()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 flex-1 overflow-x-auto">
            {recentInvoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No invoices found in this view.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100">
                    <th className="pb-2.5 font-medium">Invoice</th>
                    <th className="pb-2.5 font-medium">Customer</th>
                    <th className="pb-2.5 font-medium">Date</th>
                    <th className="pb-2.5 font-medium">Amount</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInvoices.map((inv) => {
                    const isPaid = inv.status === 'PAID' || (inv.amountPaid || 0) >= inv.totalAmount;
                    const isPartial = !isPaid && (inv.amountPaid || 0) > 0;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 text-slate-700 whitespace-nowrap max-w-[120px] truncate">
                          {inv.customer.name}
                        </td>
                        <td className="py-3 text-slate-500 whitespace-nowrap">
                          {inv.invoiceDate || inv.createdAt.split('T')[0]}
                        </td>
                        <td className="py-3 font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(inv.totalAmount, currency)}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isPartial
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING'}
                          </span>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-end">
                            {/* WhatsApp */}
                            {inv.customer.phone && (
                              <button
                                onClick={() => handleShareWhatsApp(inv)}
                                title="Send on WhatsApp"
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* View / Print */}
                            <button
                              onClick={() => onViewInvoice(inv)}
                              title="View / Print PDF"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {/* Payment */}
                            {!isPaid && onRecordPayment && (
                              <button
                                onClick={() => onRecordPayment(inv)}
                                title="Record Payment"
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
