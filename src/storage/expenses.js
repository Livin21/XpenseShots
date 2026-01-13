import db from './db.js';

/**
 * Add expense (deduplicates by id)
 * @param {import('./db.js').Expense} expense
 * @returns {Promise<string>} The expense id
 */
export async function addExpense(expense) {
  // Check if already exists
  const existing = await db.expenses.get(expense.id);
  if (existing) {
    return existing.id;
  }

  await db.expenses.add({
    ...expense,
    createdAt: new Date().toISOString()
  });

  return expense.id;
}

/**
 * Get all expenses sorted by createdAt descending
 * @returns {Promise<import('./db.js').Expense[]>}
 */
export async function getAllExpenses() {
  return db.expenses.orderBy('createdAt').reverse().toArray();
}

/**
 * Get recent expenses
 * @param {number} limit - Number of expenses to return
 * @returns {Promise<import('./db.js').Expense[]>}
 */
export async function getRecentExpenses(limit = 5) {
  return db.expenses.orderBy('createdAt').reverse().limit(limit).toArray();
}

/**
 * Delete expense by id
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteExpense(id) {
  await db.expenses.delete(id);
}

/**
 * Check if expense exists by id
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function expenseExists(id) {
  const expense = await db.expenses.get(id);
  return !!expense;
}
