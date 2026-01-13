import { ExpenseCard } from './ExpenseCard.jsx';
import { EmptyState } from './EmptyState.jsx';

/**
 * Expense list component
 * @param {{
 *   expenses: Array<import('../parser/types.js').ParsedExpense & { id: string }>,
 *   loading?: boolean,
 *   emptyMessage?: string,
 *   compact?: boolean
 * }} props
 */
export function ExpenseList({
  expenses,
  loading = false,
  emptyMessage = 'No expenses yet',
  compact = false
}) {
  if (loading) {
    return <div className="expense-list-loading">Loading...</div>;
  }

  if (expenses.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="expense-list">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} compact={compact} />
      ))}
    </div>
  );
}
