import { parseDate } from './utils.js';

/**
 * Parse Swiggy Instamart receipt
 * @param {string} text - Normalized text
 * @param {string[]} lines - Split lines
 * @returns {import('./types.js').ParsedExpense | null}
 */
export function parseInstamart(text, lines) {
  let amount = null;

  for (const l of lines) {
    const m = l.match(/grand total\s*₹\s?([0-9,]+(\.[0-9]{1,2})?)/);
    if (m) {
      amount = Number(m[1].replace(/,/g, ''));
      break;
    }
  }

  if (!amount) return null;

  return {
    amount,
    currency: 'INR',
    merchant: 'Swiggy Instamart',
    category: 'Groceries',
    date: parseDate(text) ?? new Date().toISOString(),
    source: 'Instamart',
    confidence: 0.95,
    rawText: text
  };
}
