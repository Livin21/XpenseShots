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
 */

export const db = new Dexie('expenses-db');

db.version(1).stores({
  expenses: 'id, amount, merchant, category, date, source, createdAt'
});

export default db;
