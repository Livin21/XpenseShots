import { useState } from 'react';
import { TrendingUp, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExpenseList } from '../components/ExpenseList.jsx';
import { EditExpenseModal } from '../components/EditExpenseModal.jsx';
import { useExpenses } from '../hooks/useExpenses.js';

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
 * Expenses route - Full expense list
 */
export function ExpensesPage() {
  const { expenses, loading, update, remove } = useExpenses();
  const [editingExpense, setEditingExpense] = useState(null);

  // Calculate total
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            All Expenses
          </h1>
          {expenses.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            </span>
          )}
        </div>

        {/* Total Card */}
        {expenses.length > 0 && (
          <div className={cn(
            'rounded-xl border border-border bg-gradient-to-br from-card to-secondary/30 p-5',
            'relative overflow-hidden'
          )}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-3xl font-bold gradient-text">
                  {formatAmount(total)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense List */}
      <ExpenseList
        expenses={expenses}
        loading={loading}
        emptyMessage="No expenses recorded. Go home and upload a screenshot!"
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
