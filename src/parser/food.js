import { parseDate, titleCase } from './utils.js';

/**
 * Extract restaurant name from lines
 * @param {string[]} lines
 * @returns {string}
 */
function extractRestaurant(lines) {
  for (const l of lines) {
    if (
      /^[a-z\s]{3,30}$/.test(l) &&
      !l.includes('order') &&
      !l.includes('delivered')
    ) {
      return titleCase(l);
    }
  }
  return 'Food Order';
}

/**
 * Parse Swiggy/Zomato food delivery receipt
 * @param {string} text - Normalized text
 * @param {string[]} lines - Split lines
 * @returns {import('./types.js').ParsedExpense | null}
 */
export function parseFoodDelivery(text, lines) {
  let amount = null;

  for (const l of lines) {
    const m = l.match(
      /(bill total|paid|grand total)\s*₹\s?([0-9,]+(\.[0-9]{1,2})?)/
    );
    if (m) {
      amount = Number(m[2].replace(/,/g, ''));
      break;
    }
  }

  if (!amount) return null;

  const merchant = extractRestaurant(lines);
  const date = parseDate(text);

  return {
    amount,
    currency: 'INR',
    merchant,
    category: 'Food & Dining',
    date: date ?? new Date().toISOString(),
    source: text.includes('zomato') ? 'Zomato' : 'Swiggy',
    confidence: 0.9,
    rawText: text
  };
}
