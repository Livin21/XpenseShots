import { Loader2 } from 'lucide-react';
import { ExpenseCard } from './ExpenseCard.jsx';
import { EmptyState } from './EmptyState.jsx';

/**
 * Expense list component
 * @param {{
 *   expenses: Array<import('../parser/types.js').ParsedExpense & { id: string }>,
 *   loading?: boolean,
 *   emptyMessage?: string,
 *   compact?: boolean,
 *   onEditExpense?: (expense: import('../parser/types.js').ParsedExpense & { id: string }) => void
 * }} props
 */
export function ExpenseList({
  expenses,
  loading = false,
  emptyMessage = 'No expenses yet',
  compact = false,
  onEditExpense
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Loading expenses...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => (
        <div
          key={expense.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ExpenseCard
            expense={expense}
            compact={compact}
            onEdit={onEditExpense ? () => onEditExpense(expense) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
