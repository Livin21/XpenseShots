import { extractLargestAmount, parseDate, titleCase } from './utils.js';

/**
 * Extract merchant name from lines
 * @param {string[]} lines
 * @returns {string}
 */
function extractMerchant(lines) {
  for (const l of lines) {
    const m = l.match(/to\s+([a-z0-9 .&_-]{3,})/);
    if (m) return titleCase(m[1]);
  }

  // header fallback
  for (const l of lines.slice(0, 5)) {
    if (/^[a-z\s]{3,40}$/.test(l) && !l.includes('google')) {
      return titleCase(l);
    }
  }

  return 'Unknown Merchant';
}

/**
 * Infer category from merchant name
 * @param {string} merchant
 * @returns {string}
 */
function inferCategory(merchant) {
  const m = merchant.toLowerCase();
  if (m.includes('vi')) return 'Utilities';
  if (m.includes('apple')) return 'Subscriptions';
  if (m.includes('hotel')) return 'Food & Dining';
  return 'Miscellaneous';
}

/**
 * Compute confidence score
 * @param {number} amount
 * @param {string} merchant
 * @param {string | null} date
 * @returns {number}
 */
function computeConfidence(amount, merchant, date) {
  let score = 0.5;
  if (merchant !== 'Unknown Merchant') score += 0.3;
  if (date) score += 0.2;
  return score;
}

/**
 * Parse UPI/GPay receipt
 * @param {string} text - Normalized text
 * @param {string[]} lines - Split lines
 * @returns {import('./types.js').ParsedExpense | null}
 */
export function parseUpiReceipt(text, lines) {
  if (
    text.includes('failed') ||
    text.includes('pending') ||
    !text.includes('completed')
  ) {
    return null;
  }

  const amount = extractLargestAmount(lines, [
    'platform fee',
    'gst',
    'tax',
    'cashback',
    'plan price'
  ]);

  if (!amount) return null;

  const merchant = extractMerchant(lines);
  const date = parseDate(text);

  return {
    amount,
    currency: 'INR',
    merchant,
    category: inferCategory(merchant),
    date: date ?? new Date().toISOString(),
    source: 'GPay',
    confidence: computeConfidence(amount, merchant, date),
    rawText: text
  };
}
