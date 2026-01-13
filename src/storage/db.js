import Dexie from 'dexie';

/**
 * @typedef {Object} Expense
 * @property {string} id - Image hash for deduplication
 * @property {number} amount
 * @property {'INR'} currency
 * @property {string} merchant
 * @property {string} category
 * @property {string} date - ISO format
 * @property {string} source
 * @property {number} confidence
 * @property {string} createdAt - ISO format
 * @property {string[]} [tags] - Optional tags
 * @property {SplitInfo} [split] - Optional split information
 */

/**
 * @typedef {Object} SplitInfo
 * @property {boolean} enabled - Whether this expense is split
 * @property {SplitPerson[]} people - People involved in the split
 * @property {string} [sharedBy] - Name of person who shared this expense
 */

/**
 * @typedef {Object} SplitPerson
 * @property {string} name - Person's name
 * @property {number} share - Their share amount
 * @property {boolean} [paid] - Whether they've paid their share
 */

/**
 * @typedef {Object} Category
 * @property {string} id - Category ID
 * @property {string} name - Category name
 * @property {string} color - Color for display
 * @property {boolean} isDefault - Whether it's a default category
 * @property {number} order - Sort order
 */

export const db = new Dexie('expenses-db');

// Version 1: Original schema
db.version(1).stores({
  expenses: 'id, amount, merchant, category, date, source, createdAt'
});

// Version 2: Add tags, split info, and categories table
db.version(2).stores({
  expenses: 'id, amount, merchant, category, date, source, createdAt, *tags',
  categories: 'id, name, order'
}).upgrade(async tx => {
  // Add default categories if categories table is empty
  const categories = tx.table('categories');
  const count = await categories.count();

  if (count === 0) {
    const defaultCategories = [
      { id: 'food', name: 'Food & Dining', color: '#f97316', isDefault: true, order: 0 },
      { id: 'groceries', name: 'Groceries', color: '#22c55e', isDefault: true, order: 1 },
      { id: 'utilities', name: 'Utilities', color: '#3b82f6', isDefault: true, order: 2 },
      { id: 'subscriptions', name: 'Subscriptions', color: '#a855f7', isDefault: true, order: 3 },
      { id: 'shopping', name: 'Shopping', color: '#ec4899', isDefault: true, order: 4 },
      { id: 'transport', name: 'Transport', color: '#eab308', isDefault: true, order: 5 },
      { id: 'entertainment', name: 'Entertainment', color: '#06b6d4', isDefault: true, order: 6 },
      { id: 'health', name: 'Health', color: '#ef4444', isDefault: true, order: 7 },
      { id: 'misc', name: 'Miscellaneous', color: '#6b7280', isDefault: true, order: 8 },
    ];
    await categories.bulkAdd(defaultCategories);
  }
});

export default db;
