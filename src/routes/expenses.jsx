import { useState } from 'react';
import { ExpenseList } from '../components/ExpenseList.jsx';
import { EditExpenseModal } from '../components/EditExpenseModal.jsx';
import { useExpenses } from '../hooks/useExpenses.js';

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
        onEditExpense={handleEditExpense}
      />

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
