import { useState, useEffect, useCallback } from 'react';
import {
  getAllExpenses,
  getRecentExpenses,
  addExpense,
  deleteExpense,
  updateExpense,
  expenseExists
} from '../storage/expenses.js';

/**
 * Hook for managing expenses
 * @param {{ recent?: boolean, limit?: number }} options
 * @returns {{
 *   expenses: import('../storage/db.js').Expense[],
 *   loading: boolean,
 *   add: (expense: import('../storage/db.js').Expense) => Promise<string>,
 *   update: (id: string, updates: Partial<import('../storage/db.js').Expense>) => Promise<void>,
 *   remove: (id: string) => Promise<void>,
 *   exists: (id: string) => Promise<boolean>,
 *   refresh: () => Promise<void>
 * }}
 */
export function useExpenses({ recent = false, limit = 5 } = {}) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = recent
        ? await getRecentExpenses(limit)
        : await getAllExpenses();
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  }, [recent, limit]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const add = useCallback(async (expense) => {
    const id = await addExpense(expense);
    await loadExpenses();
    return id;
  }, [loadExpenses]);

  const update = useCallback(async (id, updates) => {
    await updateExpense(id, updates);
    await loadExpenses();
  }, [loadExpenses]);

  const remove = useCallback(async (id) => {
    await deleteExpense(id);
    await loadExpenses();
  }, [loadExpenses]);

  const exists = useCallback(async (id) => {
    return expenseExists(id);
  }, []);

  return {
    expenses,
    loading,
    add,
    update,
    remove,
    exists,
    refresh: loadExpenses
  };
}
