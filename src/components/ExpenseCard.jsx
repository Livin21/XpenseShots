import { Calendar, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * Format amount with currency
 * @param {number} amount
 * @returns {string}
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
 * Format date for display
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Get source badge variant
 * @param {string} source
 * @returns {string}
 */
function getSourceVariant(source) {
  const sourceMap = {
    'GPay': 'info',
    'Swiggy': 'warning',
    'Zomato': 'destructive',
    'Instamart': 'success',
    'ICICI Bank': 'secondary',
    'HDFC Bank': 'info',
    'Federal Bank': 'secondary',
    'SBI': 'info',
    'Axis Bank': 'destructive',
    'Kotak Bank': 'warning',
    'Bank SMS': 'secondary',
  };
  return sourceMap[source] || 'secondary';
}

/**
 * Get category icon color
 * @param {string} category
 * @returns {string}
 */
function getCategoryColor(category) {
  const colorMap = {
    'Food & Dining': 'text-orange-400',
    'Groceries': 'text-green-400',
    'Utilities': 'text-blue-400',
    'Subscriptions': 'text-purple-400',
    'Shopping': 'text-pink-400',
    'Transport': 'text-yellow-400',
  };
  return colorMap[category] || 'text-muted-foreground';
}

/**
 * Expense card component
 * @param {{
 *   expense: import('../parser/types.js').ParsedExpense & { id?: string },
 *   showConfidence?: boolean,
 *   compact?: boolean,
 *   onEdit?: () => void
 * }} props
 */
export function ExpenseCard({ expense, showConfidence = false, compact = false, onEdit }) {
  const { amount, merchant, category, date, source, confidence } = expense;

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card p-4 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        compact && 'p-3',
        onEdit && 'cursor-pointer active:scale-[0.98]'
      )}
      onClick={onEdit}
    >
      {/* Main row */}
      <div className="flex items-start justify-between gap-4">
        {/* Amount and Merchant */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-bold text-foreground gradient-text',
            compact ? 'text-xl' : 'text-2xl'
          )}>
            {formatAmount(amount)}
          </p>
          <p className="text-sm text-muted-foreground truncate mt-0.5 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 flex-shrink-0" />
            {merchant}
          </p>
        </div>
      </div>

      {/* Details row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Badge variant={getSourceVariant(source)} className="text-xs">
          {source}
        </Badge>
        <Badge variant="outline" className={cn('text-xs', getCategoryColor(category))}>
          {category}
        </Badge>
        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
          <Calendar className="w-3 h-3" />
          {formatDate(date)}
        </span>
      </div>

      {/* Confidence indicator */}
      {showConfidence && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className={cn(
              'font-medium',
              confidence >= 0.9 ? 'text-green-400' :
              confidence >= 0.75 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                confidence >= 0.9 ? 'bg-green-500' :
                confidence >= 0.75 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
