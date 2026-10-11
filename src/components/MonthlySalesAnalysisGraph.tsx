import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/numberToWords';

interface MonthlySalesAnalysisGraphProps {
  invoices: Invoice[];
  currency: string;
  selectedMonth: string;
  onSelectMonth: (monthKey: string) => void;
}

export interface DetailedMonthlyStat {
  monthKey: string; // "2026-10"
  shortLabel: string; // "Oct '26"
  fullLabel: string; // "October 2026"
  invoiceCount: number;
  totalAmount: number;
  paidAmount: number;
  averageAmount: number;
  growthPercent: number | null; // vs previous month in chronological order
}

type ChartViewType = 'BAR' | 'TREND' | 'BREAKDOWN';

// Curated vibrant gradient definitions for bars
const VIBRANT_GRADIENTS = [
  { id: 'grad-emerald', start: '#10b981', end: '#06b6d4', glow: '#10b98188', text: 'text-emerald-700', bg: 'bg-emerald-500' },
  { id: 'grad-blue', start: '#3b82f6', end: '#6366f1', glow: '#3b82f688', text: 'text-blue-700', bg: 'bg-blue-500' },
  { id: 'grad-violet', start: '#8b5cf6', end: '#d946ef', glow: '#8b5cf688', text: 'text-purple-700', bg: 'bg-purple-500' },
  { id: 'grad-rose', start: '#f43f5e', end: '#fb923c', glow: '#f43f5e88', text: 'text-rose-700', bg: 'bg-rose-500' },
  { id: 'grad-amber', start: '#f59e0b', end: '#eab308', glow: '#f59e0b88', text: 'text-amber-700', bg: 'bg-amber-500' },
  { id: 'grad-teal', start: '#14b8a6', end: '#10b981', glow: '#14b8a688', text: 'text-teal-700', bg: 'bg-teal-500' },
  { id: 'grad-indigo', start: '#6366f1', end: '#ec4899', glow: '#6366f188', text: 'text-indigo-700', bg: 'bg-indigo-500' },
  { id: 'grad-cyan', start: '#06b6d4', end: '#3b82f6', glow: '#06b6d488', text: 'text-cyan-700', bg: 'bg-cyan-500' },
];

export const MonthlySalesAnalysisGraph: React.FC<MonthlySalesAnalysisGraphProps> = ({
  invoices,
  currency,
  selectedMonth,
  onSelectMonth,
}) => {
  const [chartView, setChartView] = useState<ChartViewType>('BAR');
  const [timeRange, setTimeRange] = useState<'6M' | '12M' | 'ALL'>('6M');
  const [hoveredMonth, setHoveredMonth] = useState<DetailedMonthlyStat | null>(null);

  // Compute month-by-month stats
  const { allMonthlyStats, chronologicalStats } = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        count: number;
        total: number;
        paid: number;
      }
    >();

    invoices.forEach((inv) => {
      const datePart = inv.invoiceDate || inv.createdAt.split('T')[0];
      const key = datePart.substring(0, 7); // "2026-10"
      const current = monthMap.get(key) || {
        count: 0,
        total: 0,
        paid: 0,
      };

      current.count += 1;
      current.total += inv.totalAmount;
      current.paid += inv.amountPaid || 0;
      monthMap.set(key, current);
    });

    // Sort ascending for chronological calculation (trends, growth rates)
    const ascKeys = Array.from(monthMap.keys()).sort();

    // If there are less than 6 months, fill rolling recent months so chart has full continuous context
    const rollingKeys = new Set(ascKeys);
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      rollingKeys.add(k);
    }
    const finalAscKeys = Array.from(rollingKeys).sort();

    let prevTotal = 0;
    const chrono: DetailedMonthlyStat[] = finalAscKeys.map((key, idx) => {
      const [year, month] = key.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
      const shortLabel = dateObj.toLocaleDateString('en-US', { month: 'short' }) + " '" + year.slice(2);
      const fullLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const data = monthMap.get(key) || {
        count: 0,
        total: 0,
        paid: 0,
      };

      const average = data.count > 0 ? data.total / data.count : 0;
      let growth: number | null = null;
      if (idx > 0 && prevTotal > 0) {
        growth = Math.round(((data.total - prevTotal) / prevTotal) * 100);
      } else if (idx > 0 && prevTotal === 0 && data.total > 0) {
        growth = 100;
      }
      if (data.total > 0) {
        prevTotal = data.total;
      }

      return {
        monthKey: key,
        shortLabel,
        fullLabel,
        invoiceCount: data.count,
        totalAmount: data.total,
        paidAmount: data.paid,
        averageAmount: average,
        growthPercent: growth,
      };
    });

    // Descending for list views
    const all = [...chrono].reverse();

    return { allMonthlyStats: all, chronologicalStats: chrono };
  }, [invoices]);

  // Filter based on selected time range
  const displayStats = useMemo(() => {
    let list = [...chronologicalStats];
    if (timeRange === '6M') {
      list = list.slice(-6);
    } else if (timeRange === '12M') {
      list = list.slice(-12);
    }
    return list;
  }, [chronologicalStats, timeRange]);

  // Summary Metrics across visible data
  const summary = useMemo(() => {
    const totalSales = displayStats.reduce((sum, m) => sum + m.totalAmount, 0);
    const totalPaid = displayStats.reduce((sum, m) => sum + m.paidAmount, 0);
    const totalBills = displayStats.reduce((sum, m) => sum + m.invoiceCount, 0);

    const nonZeroMonths = displayStats.filter((m) => m.totalAmount > 0);
    const averageMonthly = nonZeroMonths.length > 0 ? totalSales / nonZeroMonths.length : 0;

    let peakMonth = displayStats[0];
    displayStats.forEach((m) => {
      if (!peakMonth || m.totalAmount > peakMonth.totalAmount) {
        peakMonth = m;
      }
    });

    const collectionRate = totalSales > 0 ? Math.round((totalPaid / totalSales) * 100) : 0;

    return {
      totalSales,
      totalPaid,
      totalBills,
      averageMonthly,
      peakMonth,
      collectionRate,
    };
  }, [displayStats]);

  // Max value for scaling chart
  const maxSalesValue = useMemo(() => {
    const maxVal = Math.max(...displayStats.map((m) => m.totalAmount), 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    return Math.ceil(maxVal / magnitude) * magnitude || 10000;
  }, [displayStats]);

  // SVG Chart Layout dimensions
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;
  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // Generate trend line points (Cubic Bezier curve)
  const linePathData = useMemo(() => {
    if (displayStats.length === 0) return { line: '', area: '', points: [] };

    const step = chartInnerWidth / Math.max(1, displayStats.length - 1);
    const pts = displayStats.map((stat, i) => {
      const x = paddingLeft + i * step;
      const normalized = Math.min(1, stat.totalAmount / maxSalesValue);
      const y = paddingTop + chartInnerHeight - normalized * chartInnerHeight;
      return { x, y, stat };
    });

    if (pts.length === 1) {
      return {
        line: `M ${pts[0].x} ${pts[0].y}`,
        area: '',
        points: pts,
      };
    }

    // Build smooth cubic spline
    let lineStr = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      lineStr += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const baselineY = paddingTop + chartInnerHeight;
    const areaStr = `${lineStr} L ${pts[pts.length - 1].x} ${baselineY} L ${pts[0].x} ${baselineY} Z`;

    return { line: lineStr, area: areaStr, points: pts };
  }, [displayStats, maxSalesValue, chartInnerWidth, chartInnerHeight]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 1. Header with title, only the requested view options: Bar Graph, Trend Curve, Status Ratio */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-900 tracking-tight">
                  Monthly Sales & Billing Analysis
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  Live Graph
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vibrant revenue trends, sales performance, and billing volume
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Chart Type Selector (Bar Graph, Trend Curve, Status Ratio ONLY) & Timeframe */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View Mode Tabs - Only Bar Graph, Trend Curve, Status Ratio */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartView('BAR')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                chartView === 'BAR'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bar Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('TREND')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                chartView === 'TREND'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-pink-600" />
              <span>Trend Curve</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('BREAKDOWN')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                chartView === 'BREAKDOWN'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status Ratio</span>
            </button>
          </div>

          {/* Time range pill buttons */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setTimeRange('6M')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                timeRange === '6M'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('12M')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                timeRange === '12M'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                timeRange === 'ALL'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* 2. Colorful KPI Highlights Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-purple-50/30 border-b border-slate-100">
        {/* Metric 1: Total Sales */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Sales Billed</span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(summary.totalSales, currency)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-indigo-600">{summary.totalBills} bills</span>
            <span>across period</span>
          </div>
        </div>

        {/* Metric 2: Paid Collections */}
        <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>Collected / Paid</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono tracking-tight text-emerald-700 tabular-nums">
            {formatCurrency(summary.totalPaid, currency)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <span className="px-1.5 py-0.2 bg-emerald-100 rounded text-[10px] font-bold">
              {summary.collectionRate}%
            </span>
            <span>collected</span>
          </div>
        </div>

        {/* Metric 3: Average Monthly Sales */}
        <div className="p-3.5 bg-white rounded-xl border border-blue-200/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
            <span>Average Monthly</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold font-mono tracking-tight text-blue-700 tabular-nums">
            {formatCurrency(summary.averageMonthly, currency)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-700">
            <span>Monthly run-rate</span>
          </div>
        </div>

        {/* Metric 4: Peak Month */}
        <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold text-purple-800">
            <span>Peak Month 🏆</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="mt-2 text-lg font-bold text-purple-900 truncate">
            {summary.peakMonth?.shortLabel || 'N/A'}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-700 font-mono font-semibold">
            {summary.peakMonth?.totalAmount
              ? formatCurrency(summary.peakMonth.totalAmount, currency)
              : `${currency}0`}
          </div>
        </div>
      </div>

      {/* 3. Graph View Area */}
      <div className="p-5">
        {/* Helper badge for bar chart */}
        {chartView === 'BAR' && (
          <div className="flex items-center justify-between gap-3 mb-4 text-xs">
            <span className="text-slate-500 font-medium">Monthly Sales Breakdown</span>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Click on any month bar to filter invoices below</span>
            </div>
          </div>
        )}

        {/* CHART VIEW 1: COLORFUL BAR GRAPH */}
        {chartView === 'BAR' && (
          <div className="relative w-full overflow-x-auto pb-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[550px] overflow-visible"
            >
              {/* Vibrant Gradients definitions */}
              <defs>
                {VIBRANT_GRADIENTS.map((grad) => (
                  <linearGradient
                    key={grad.id}
                    id={grad.id}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={grad.start} stopOpacity="1" />
                    <stop offset="100%" stopColor={grad.end} stopOpacity="0.85" />
                  </linearGradient>
                ))}
                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Horizontal gridlines & Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const yPos = paddingTop + chartInnerHeight - pct * chartInnerHeight;
                const value = Math.round(maxSalesValue * pct);
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={svgWidth - paddingRight}
                      y2={yPos}
                      stroke="#f1f5f9"
                      strokeDasharray={pct === 0 ? '0' : '4 4'}
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={yPos + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                      fontFamily="monospace"
                    >
                      {value >= 1000 ? `${currency}${Math.round(value / 1000)}k` : `${currency}${value}`}
                    </text>
                  </g>
                );
              })}

              {/* Monthly Bar Columns */}
              {displayStats.map((stat, index) => {
                const barSlotWidth = chartInnerWidth / displayStats.length;
                const slotCenterX = paddingLeft + index * barSlotWidth + barSlotWidth / 2;
                const barWidth = Math.min(48, Math.max(22, barSlotWidth * 0.55));
                const isSelected = selectedMonth === stat.monthKey;
                const isHovered = hoveredMonth?.monthKey === stat.monthKey;
                const gradTheme = VIBRANT_GRADIENTS[index % VIBRANT_GRADIENTS.length];

                const normalized = Math.min(1, stat.totalAmount / maxSalesValue);
                const barHeight = Math.max(4, normalized * chartInnerHeight);
                const barY = paddingTop + chartInnerHeight - barHeight;

                return (
                  <g
                    key={stat.monthKey}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => onSelectMonth(isSelected ? 'ALL' : stat.monthKey)}
                    onMouseEnter={() => setHoveredMonth(stat)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {/* Active/Selected indicator column background */}
                    {isSelected && (
                      <rect
                        x={slotCenterX - barWidth / 2 - 8}
                        y={paddingTop - 10}
                        width={barWidth + 16}
                        height={chartInnerHeight + 20}
                        fill="#f8fafc"
                        rx="8"
                        stroke="#cbd5e1"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Main Bar with Vibrant Gradient */}
                    <rect
                      x={slotCenterX - barWidth / 2}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx="6"
                      fill={`url(#${gradTheme.id})`}
                      filter={isHovered || isSelected ? 'url(#glow)' : undefined}
                      className="transition-all duration-300 hover:opacity-95"
                    />

                    {/* Top cap glow line */}
                    {stat.totalAmount > 0 && (
                      <rect
                        x={slotCenterX - barWidth / 2 + 2}
                        y={barY + 1}
                        width={barWidth - 4}
                        height={2.5}
                        rx="1.5"
                        fill="#ffffff"
                        opacity="0.7"
                      />
                    )}

                    {/* Top value label on bar */}
                    {stat.totalAmount > 0 && (
                      <text
                        x={slotCenterX}
                        y={barY - 8}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill={isSelected ? '#0f172a' : '#334155'}
                        fontFamily="monospace"
                      >
                        {stat.totalAmount >= 1000
                          ? `${currency}${Math.round(stat.totalAmount / 1000)}k`
                          : `${currency}${stat.totalAmount}`}
                      </text>
                    )}

                    {/* X-axis Month Label */}
                    <text
                      x={slotCenterX}
                      y={svgHeight - 16}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isSelected ? '800' : '600'}
                      fill={isSelected ? '#0f172a' : '#64748b'}
                    >
                      {stat.shortLabel}
                    </text>

                    {/* Bill count badge below label */}
                    <text
                      x={slotCenterX}
                      y={svgHeight - 2}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                      fontFamily="monospace"
                    >
                      {stat.invoiceCount} {stat.invoiceCount === 1 ? 'bill' : 'bills'}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredMonth && (
              <div className="absolute top-2 right-4 bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs z-20 pointer-events-none animate-fadeIn border border-slate-700">
                <div className="font-bold text-slate-100 flex items-center justify-between gap-4 pb-1.5 border-b border-slate-800">
                  <span>{hoveredMonth.fullLabel}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono">
                    {hoveredMonth.invoiceCount} bills
                  </span>
                </div>
                <div className="space-y-1 pt-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Total Billed:</span>
                    <span className="font-bold text-white">
                      {formatCurrency(hoveredMonth.totalAmount, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-emerald-400">Collected / Paid:</span>
                    <span className="text-emerald-300">
                      {formatCurrency(hoveredMonth.paidAmount, currency)}
                    </span>
                  </div>
                  {hoveredMonth.growthPercent !== null && (
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[10px]">
                      <span className="text-slate-400">Month Growth:</span>
                      <span
                        className={`font-sans font-semibold ${
                          hoveredMonth.growthPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {hoveredMonth.growthPercent >= 0 ? '+' : ''}
                        {hoveredMonth.growthPercent}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHART VIEW 2: VIBRANT TREND LINE & GLOWING AREA */}
        {chartView === 'TREND' && (
          <div className="relative w-full overflow-x-auto pb-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[550px] overflow-visible"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#ec4899" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="35%" stopColor="#8b5cf6" />
                  <stop offset="70%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const yPos = paddingTop + chartInnerHeight - pct * chartInnerHeight;
                const value = Math.round(maxSalesValue * pct);
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={svgWidth - paddingRight}
                      y2={yPos}
                      stroke="#f1f5f9"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={yPos + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                      fontFamily="monospace"
                    >
                      {value >= 1000 ? `${currency}${Math.round(value / 1000)}k` : `${currency}${value}`}
                    </text>
                  </g>
                );
              })}

              {/* Glowing Area Fill */}
              {linePathData.area && (
                <path d={linePathData.area} fill="url(#curveGradient)" />
              )}

              {/* Vibrant Stroke Curve */}
              {linePathData.line && (
                <path
                  d={linePathData.line}
                  fill="none"
                  stroke="url(#strokeGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Data Point Dots */}
              {linePathData.points.map((pt) => {
                const isSelected = selectedMonth === pt.stat.monthKey;
                const isHovered = hoveredMonth?.monthKey === pt.stat.monthKey;

                return (
                  <g
                    key={pt.stat.monthKey}
                    className="cursor-pointer"
                    onClick={() => onSelectMonth(isSelected ? 'ALL' : pt.stat.monthKey)}
                    onMouseEnter={() => setHoveredMonth(pt.stat)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {/* Hover halo */}
                    {(isHovered || isSelected) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill="#8b5cf6"
                        fillOpacity="0.2"
                      />
                    )}

                    {/* Dot circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="6"
                      fill="#ffffff"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                    />

                    {/* Top Value Label */}
                    {pt.stat.totalAmount > 0 && (
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill="#475569"
                        fontFamily="monospace"
                      >
                        {formatCurrency(pt.stat.totalAmount, currency)}
                      </text>
                    )}

                    {/* X-axis Month Label */}
                    <text
                      x={pt.x}
                      y={svgHeight - 16}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isSelected ? '800' : '600'}
                      fill={isSelected ? '#0f172a' : '#64748b'}
                    >
                      {pt.stat.shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* CHART VIEW 3: PAYMENT STATUS RATIO & BREAKDOWN DONUT */}
        {chartView === 'BREAKDOWN' && (
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Visual Donut representation */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const total = Math.max(1, summary.totalSales);
                    const paidPct = (summary.totalPaid / total) * 100;
                    const remainingPct = Math.max(0, 100 - paidPct);

                    const circumference = 2 * Math.PI * 38; // r=38
                    let currentOffset = 0;

                    const segments = [
                      { pct: paidPct, color: '#10b981', label: 'Collected / Paid' },
                      { pct: remainingPct, color: '#6366f1', label: 'Remaining Balance' },
                    ];

                    return segments.map((seg, i) => {
                      const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -currentOffset;
                      currentOffset += (seg.pct / 100) * circumference;

                      return (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Inner Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Collection Rate
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    {summary.collectionRate}%
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Received
                  </span>
                </div>
              </div>
            </div>

            {/* Status Ratio Legend Breakdown */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Collection Status Ratio
              </h3>

              {/* Fully Paid Status */}
              <div className="p-3 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Collected / Paid</p>
                    <p className="text-[11px] text-slate-500">Received payments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-emerald-700">
                    {formatCurrency(summary.totalPaid, currency)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {summary.collectionRate}% of sales
                  </p>
                </div>
              </div>

              {/* Remaining Balance */}
              <div className="p-3 bg-white rounded-lg border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Remaining Balance</p>
                    <p className="text-[11px] text-slate-500">Unsettled amounts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-indigo-700">
                    {formatCurrency(
                      Math.max(0, summary.totalSales - summary.totalPaid),
                      currency
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {Math.max(0, 100 - summary.collectionRate)}% remaining
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Monthly Amounts Breakdown Rows (Interactive list below graph) */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Month-by-Month Detailed Amounts ({allMonthlyStats.length})
            </h3>
          </div>
          {selectedMonth !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectMonth('ALL')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Clear Filter (Show All)
            </button>
          )}
        </div>

        {allMonthlyStats.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No monthly sales data recorded yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {allMonthlyStats.map((m, idx) => {
              const maxAmount = Math.max(...allMonthlyStats.map((item) => item.totalAmount), 1);
              const isSelected = selectedMonth === m.monthKey;
              const gradTheme = VIBRANT_GRADIENTS[idx % VIBRANT_GRADIENTS.length];

              return (
                <div
                  key={m.monthKey}
                  onClick={() => onSelectMonth(isSelected ? 'ALL' : m.monthKey)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    {/* Left: Month badge & bill count */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${gradTheme.bg} shadow-xs shrink-0`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {m.fullLabel}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">
                              Selected
                            </span>
                          )}
                          {m.growthPercent !== null && (
                            <span
                              className={`inline-flex items-center text-[10px] font-semibold ${
                                m.growthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {m.growthPercent >= 0 ? (
                                <ArrowUpRight className="w-3 h-3 inline" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3 inline" />
                              )}
                              {Math.abs(m.growthPercent)}%
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {m.invoiceCount} {m.invoiceCount === 1 ? 'bill generated' : 'bills generated'} • Avg{' '}
                          {formatCurrency(m.averageAmount, currency)}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amounts (Paid, Total) */}
                    <div className="flex items-baseline gap-4 text-right">
                      {m.paidAmount > 0 && (
                        <div className="hidden sm:block text-[11px]">
                          <span className="text-slate-400">Paid: </span>
                          <span className="font-mono text-emerald-600 font-semibold">
                            {formatCurrency(m.paidAmount, currency)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                          {formatCurrency(m.totalAmount, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Colorful Progress Bar matching month's vibrant theme */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    {m.totalAmount > 0 && (
                      <div
                        className={`h-full ${gradTheme.bg} transition-all duration-500 rounded-full`}
                        style={{
                          width: `${(m.totalAmount / maxAmount) * 100}%`,
                        }}
                        title={`${m.fullLabel}: ${formatCurrency(m.totalAmount, currency)}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
