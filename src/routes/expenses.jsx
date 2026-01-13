import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  Search,
  Filter,
  X,
  ArrowUpDown,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExpenseList } from '../components/ExpenseList.jsx';
import { EditExpenseModal } from '../components/EditExpenseModal.jsx';
import { useExpenses } from '../hooks/useExpenses.js';

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Utilities',
  'Subscriptions',
  'Shopping',
  'Transport',
  'Entertainment',
  'Health',
  'Miscellaneous',
];

const SOURCES = ['GPay', 'Swiggy', 'Zomato', 'Instamart'];

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'this-month' },
  { label: 'Last Month', value: 'last-month' },
  { label: 'Last 3 Months', value: 'last-3-months' },
  { label: 'This Year', value: 'this-year' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'date-desc' },
  { label: 'Oldest First', value: 'date-asc' },
  { label: 'Highest Amount', value: 'amount-desc' },
  { label: 'Lowest Amount', value: 'amount-asc' },
  { label: 'Merchant A-Z', value: 'merchant-asc' },
];

/**
 * Format amount with currency
 */
function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get date range boundaries
 */
function getDateRange(rangeValue) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (rangeValue) {
    case 'this-month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    case 'last-month':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
    case 'last-3-months':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    case 'this-year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };
    default:
      return null;
  }
}

/**
 * Expenses route - Full expense list with search and filters
 */
export function ExpensesPage() {
  const { expenses, loading, update, remove } = useExpenses();
  const [editingExpense, setEditingExpense] = useState(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search by merchant
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.merchant.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((e) => e.category === selectedCategory);
    }

    // Filter by source
    if (selectedSource) {
      result = result.filter((e) => e.source === selectedSource);
    }

    // Filter by date range
    const range = getDateRange(dateRange);
    if (range) {
      result = result.filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= range.start && expenseDate <= range.end;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'amount-asc':
          return a.amount - b.amount;
        case 'amount-desc':
          return b.amount - a.amount;
        case 'merchant-asc':
          return a.merchant.localeCompare(b.merchant);
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return result;
  }, [expenses, searchQuery, selectedCategory, selectedSource, dateRange, sortBy]);

  // Calculate filtered total
  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedCategory || selectedSource || dateRange !== 'all';
  const activeFilterCount = [searchQuery, selectedCategory, selectedSource, dateRange !== 'all' ? dateRange : ''].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSource('');
    setDateRange('all');
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
  };

  const handleSaveExpense = async (updates) => {
    if (editingExpense) {
      await update(editingExpense.id, updates);
      setEditingExpense(null);
    }
  };

  const handleDeleteExpense = async () => {
    if (editingExpense) {
      await remove(editingExpense.id);
      setEditingExpense(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="w-6 h-6 text-primary" />
          Expenses
        </h1>
        {expenses.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {filteredExpenses.length} of {expenses.length}
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={cn(
                  'flex h-9 w-full rounded-lg border border-border bg-secondary/50 px-3 py-1',
                  'text-sm text-foreground transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className={cn(
                  'flex h-9 w-full rounded-lg border border-border bg-secondary/50 px-3 py-1',
                  'text-sm text-foreground transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                <option value="">All Sources</option>
                {SOURCES.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={cn(
                  'flex h-9 w-full rounded-lg border border-border bg-secondary/50 px-3 py-1',
                  'text-sm text-foreground transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                {DATE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={cn(
                  'flex h-9 w-full rounded-lg border border-border bg-secondary/50 px-3 py-1',
                  'text-sm text-foreground transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedCategory('')}
                  />
                </Badge>
              )}
              {selectedSource && (
                <Badge variant="secondary" className="gap-1">
                  {selectedSource}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedSource('')}
                  />
                </Badge>
              )}
              {dateRange !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {DATE_RANGES.find((r) => r.value === dateRange)?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setDateRange('all')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Total Card */}
      {filteredExpenses.length > 0 && (
        <div className={cn(
          'rounded-xl border border-border bg-gradient-to-br from-card to-secondary/30 p-4',
          'relative overflow-hidden'
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {hasActiveFilters ? 'Filtered Total' : 'Total Spent'}
              </p>
              <p className="text-2xl font-bold gradient-text">
                {formatAmount(filteredTotal)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Expense List */}
      <ExpenseList
        expenses={filteredExpenses}
        loading={loading}
        emptyMessage={
          hasActiveFilters
            ? "No expenses match your filters"
            : "No expenses recorded. Go home and upload a screenshot!"
        }
        onEditExpense={handleEditExpense}
      />

      {/* Edit Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onSave={handleSaveExpense}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteExpense}
        />
      )}
    </div>
  );
}
