import { ExpenseList } from '../components/ExpenseList.jsx';
import { useExpenses } from '../hooks/useExpenses.js';

/**
 * Expenses route - Full expense list
 */
export function ExpensesPage() {
  const { expenses, loading } = useExpenses();

  // Calculate total
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <h1 className="page-title">All Expenses</h1>
        {expenses.length > 0 && (
          <div className="expenses-total">
            Total: ₹{total.toLocaleString('en-IN')}
          </div>
        )}
      </div>

      <ExpenseList
        expenses={expenses}
        loading={loading}
        emptyMessage="No expenses recorded. Go home and upload a screenshot!"
      />
    </div>
  );
}
