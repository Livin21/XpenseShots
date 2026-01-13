import { useState, useEffect } from 'react';
import { X, Trash2, Save, Store, Calendar, Tag, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Utilities',
  'Subscriptions',
  'Shopping',
  'Transport',
  'Entertainment',
  'Health',
  'Miscellaneous'
];

/**
 * Format date for input[type="date"]
 * @param {string} isoDate
 * @returns {string}
 */
function formatDateForInput(isoDate) {
  const date = new Date(isoDate);
  return date.toISOString().split('T')[0];
}

/**
 * Modal for editing an expense
 * @param {{
 *   expense: import('../storage/db.js').Expense,
 *   onSave: (updates: Partial<import('../storage/db.js').Expense>) => void,
 *   onCancel: () => void,
 *   onDelete: () => void
 * }} props
 */
export function EditExpenseModal({ expense, onSave, onCancel, onDelete }) {
  const [amount, setAmount] = useState(expense.amount);
  const [merchant, setMerchant] = useState(expense.merchant);
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(formatDateForInput(expense.date));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleSave = () => {
    onSave({
      amount: Number(amount),
      merchant,
      category,
      date: new Date(date).toISOString()
    });
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Edit Expense</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 rounded-full hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
                className="pl-10 text-2xl font-bold h-14"
              />
            </div>
          </div>

          {/* Merchant */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              Merchant
            </label>
            <Input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Merchant name"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(
                'flex h-11 w-full rounded-lg border border-border bg-secondary/50 px-4 py-2',
                'text-sm text-foreground transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
              )}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Source (Read-only) */}
          <div className="rounded-lg bg-secondary/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Source</span>
              <Badge variant="secondary">{expense.source}</Badge>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-secondary/30">
          <Button
            variant={showDeleteConfirm ? 'destructive' : 'ghost'}
            onClick={handleDelete}
            className={cn(
              'transition-all duration-200',
              showDeleteConfirm && 'animate-pulse'
            )}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
