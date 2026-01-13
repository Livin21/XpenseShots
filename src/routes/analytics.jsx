import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Calendar,
  Store,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpenses } from '../hooks/useExpenses.js';

/**
 * Format amount with currency
 */
function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get month name from date
 */
function getMonthName(date) {
  return new Date(date).toLocaleDateString('en-IN', { month: 'short' });
}

/**
 * Category colors for charts
 */
const CATEGORY_COLORS = {
  'Food & Dining': '#f97316',
  'Groceries': '#22c55e',
  'Utilities': '#3b82f6',
  'Subscriptions': '#a855f7',
  'Shopping': '#ec4899',
  'Transport': '#eab308',
  'Entertainment': '#06b6d4',
  'Health': '#ef4444',
  'Miscellaneous': '#6b7280',
};

/**
 * Source colors for charts
 */
const SOURCE_COLORS = {
  'GPay': '#3b82f6',
  'Swiggy': '#f97316',
  'Zomato': '#ef4444',
  'Instamart': '#22c55e',
  'ICICI Bank': '#b45309',
  'HDFC Bank': '#1d4ed8',
  'Federal Bank': '#7c3aed',
  'SBI': '#0891b2',
  'Axis Bank': '#be123c',
  'Kotak Bank': '#ca8a04',
  'Bank SMS': '#6b7280',
  'Manual': '#8b5cf6',
  'Shared': '#14b8a6',
  'Unknown': '#6b7280',
};

/**
 * Stat card component
 */
function StatCard({ icon: Icon, label, value, subvalue, trend }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-foreground truncate">{value}</p>
          {subvalue && (
            <p className="text-xs text-muted-foreground">{subvalue}</p>
          )}
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            trend >= 0 ? 'text-red-400' : 'text-green-400'
          )}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Custom tooltip for charts
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          {entry.name}: {formatAmount(entry.value)}
        </p>
      ))}
    </div>
  );
}

/**
 * Analytics page
 */
export function AnalyticsPage() {
  const { expenses, loading } = useExpenses();

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!expenses.length) return null;

    // Total and average
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const average = total / expenses.length;

    // Category breakdown
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || '#6b7280',
      }))
      .sort((a, b) => b.value - a.value);

    // Source breakdown
    const bySource = expenses.reduce((acc, e) => {
      acc[e.source] = (acc[e.source] || 0) + e.amount;
      return acc;
    }, {});

    const sourceData = Object.entries(bySource)
      .map(([name, value]) => ({
        name,
        value,
        color: SOURCE_COLORS[name] || '#6b7280',
      }))
      .sort((a, b) => b.value - a.value);

    // Monthly breakdown (last 6 months)
    const monthlyMap = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: getMonthName(d), amount: 0 };
    }

    expenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].amount += e.amount;
      }
    });

    const monthlyData = Object.values(monthlyMap);

    // This month vs last month
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const thisMonthTotal = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const lastMonthTotal = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyTrend = lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    // Top merchants
    const byMerchant = expenses.reduce((acc, e) => {
      acc[e.merchant] = (acc[e.merchant] || 0) + e.amount;
      return acc;
    }, {});

    const topMerchants = Object.entries(byMerchant)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      total,
      average,
      count: expenses.length,
      thisMonthTotal,
      monthlyTrend,
      categoryData,
      sourceData,
      monthlyData,
      topMerchants,
    };
  }, [expenses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PieChartIcon className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">No Data Yet</h2>
        <p className="text-muted-foreground">
          Add some expenses to see your analytics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insights into your spending patterns
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Wallet}
          label="Total Spent"
          value={formatAmount(analytics.total)}
        />
        <StatCard
          icon={Receipt}
          label="Expenses"
          value={analytics.count}
          subvalue={`Avg ${formatAmount(analytics.average)}`}
        />
        <StatCard
          icon={Calendar}
          label="This Month"
          value={formatAmount(analytics.thisMonthTotal)}
          trend={analytics.monthlyTrend}
        />
        <StatCard
          icon={Store}
          label="Top Merchant"
          value={analytics.topMerchants[0]?.name || '-'}
          subvalue={analytics.topMerchants[0] ? formatAmount(analytics.topMerchants[0].amount) : ''}
        />
      </div>

      {/* Monthly Spending Chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Monthly Spending
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.monthlyData}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="amount"
                name="Spent"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category & Source Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Category */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            By Category
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {analytics.categoryData.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-muted-foreground">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Source */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            By Source
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analytics.sourceData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {analytics.sourceData.map((src) => (
              <div key={src.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: src.color }}
                />
                <span className="text-muted-foreground">{src.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Merchants */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          Top Merchants
        </h3>
        <div className="space-y-3">
          {analytics.topMerchants.map((merchant, index) => (
            <div key={merchant.name} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {merchant.name}
                </p>
                <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${(merchant.amount / analytics.topMerchants[0].amount) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatAmount(merchant.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
