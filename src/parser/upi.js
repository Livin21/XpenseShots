import { extractAmounts, extractAmountNearLabel, parseDate, titleCase } from './utils.js';

const DEBUG = import.meta.env.DEV;

function log(...args) {
  if (DEBUG) console.log('[UPI Parser]', ...args);
}

/**
 * Extract merchant name from lines
 * @param {string[]} lines
 * @param {string} fullText
 * @returns {string}
 */
function extractMerchant(lines, fullText) {
  // Pattern 1: "To: MERCHANT NAME" or "to MERCHANT"
  for (const line of lines) {
    // Match "to: merchant" or "to merchant" patterns
    const toMatch = line.match(/to[:\s]+([a-z0-9 .&_-]{2,})/i);
    if (toMatch) {
      const merchant = toMatch[1].trim();
      // Filter out email-like strings and transaction IDs
      if (!merchant.includes('@') && !/^\d+$/.test(merchant) && merchant.length > 2) {
        log('Merchant found via "to:" pattern:', merchant);
        return titleCase(merchant);
      }
    }
  }

  // Pattern 2: Look for merchant name at top of receipt (first few non-empty meaningful lines)
  for (const line of lines.slice(0, 10)) {
    // Skip common header text
    if (/completed|paid|repeat|transaction|upi|google|payment/i.test(line)) continue;
    // Skip amounts
    if (/₹|rs\.?/i.test(line)) continue;
    // Skip dates
    if (/\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line)) continue;

    // Look for business-like names (letters with optional spaces/dots)
    if (/^[a-z][a-z\s.&]{2,30}$/i.test(line.trim())) {
      log('Merchant found via header scan:', line.trim());
      return titleCase(line.trim());
    }
  }

  // Pattern 3: Extract from "paid to" context
  const paidToMatch = fullText.match(/paid\s+to\s+([a-z][a-z\s.&]{2,30})/i);
  if (paidToMatch) {
    log('Merchant found via "paid to" pattern:', paidToMatch[1].trim());
    return titleCase(paidToMatch[1].trim());
  }

  log('Merchant not found, using default');
  return 'Unknown Merchant';
}

/**
 * Infer category from merchant name
 * @param {string} merchant
 * @param {string} fullText
 * @returns {string}
 */
function inferCategory(merchant, fullText) {
  const m = merchant.toLowerCase();
  const t = fullText.toLowerCase();

  // Utilities
  if (m.includes('vi ') || m.includes('vi prepaid') || m.includes('jio') ||
      m.includes('airtel') || m.includes('bsnl') || t.includes('recharge') ||
      t.includes('prepaid')) {
    return 'Utilities';
  }

  // Subscriptions
  if (m.includes('apple') || m.includes('netflix') || m.includes('spotify') ||
      m.includes('amazon prime') || m.includes('youtube') || t.includes('subscription')) {
    return 'Subscriptions';
  }

  // Food
  if (m.includes('hotel') || m.includes('restaurant') || m.includes('cafe') ||
      m.includes('food') || m.includes('kitchen') || m.includes('biryani') ||
      m.includes('pizza') || m.includes('burger')) {
    return 'Food & Dining';
  }

  // Shopping
  if (m.includes('mart') || m.includes('store') || m.includes('shop') ||
      m.includes('mall') || m.includes('retail')) {
    return 'Shopping';
  }

  // Transport
  if (m.includes('uber') || m.includes('ola') || m.includes('rapido') ||
      m.includes('metro') || m.includes('petrol') || m.includes('fuel')) {
    return 'Transport';
  }

  return 'Miscellaneous';
}

/**
 * Compute confidence score
 * @param {number | null} amount
 * @param {string} merchant
 * @param {string | null} date
 * @returns {number}
 */
function computeConfidence(amount, merchant, date) {
  let score = 0.4;
  if (amount && amount > 0) score += 0.2;
  if (merchant !== 'Unknown Merchant') score += 0.25;
  if (date) score += 0.15;
  return Math.min(score, 1);
}

/**
 * Parse UPI/GPay receipt
 * @param {string} text - Normalized text
 * @param {string[]} lines - Split lines
 * @returns {import('./types.js').ParsedExpense | null}
 */
export function parseUpiReceipt(text, lines) {
  log('Starting UPI parse');

  // Check for failed/pending transactions - but be lenient
  const isFailed = text.includes('failed') && !text.includes('completed');
  const isPending = text.includes('pending') && !text.includes('completed');

  if (isFailed) {
    log('Transaction appears failed, skipping');
    return null;
  }
  if (isPending) {
    log('Transaction appears pending, skipping');
    return null;
  }

  // Try to extract amount - multiple strategies
  let amount = null;

  // Strategy 1: Look for "total amount" or "paid" labels
  log('Strategy 1: Looking for labeled amounts...');
  amount = extractAmountNearLabel(lines, ['total amount', 'paid', 'amount']);
  if (amount) log('Found via label:', amount);

  // Strategy 2: Look for largest amount, excluding fees
  if (!amount) {
    log('Strategy 2: Looking for largest amount excluding fees...');
    const excludeKeywords = [
      'platform fee',
      'gst',
      'tax',
      'cashback',
      'plan price',
      'fee for',
      'inclusive'
    ];

    // Get all amounts from text
    const allAmounts = [];
    for (const line of lines) {
      if (excludeKeywords.some(k => line.includes(k))) continue;
      const lineAmounts = extractAmounts(line);
      allAmounts.push(...lineAmounts);
    }

    log('Amounts found (excluding fees):', allAmounts);
    if (allAmounts.length > 0) {
      amount = Math.max(...allAmounts);
      log('Using max:', amount);
    }
  }

  // Strategy 3: Just get the largest prominent amount
  if (!amount) {
    log('Strategy 3: Looking for any reasonable amount...');
    const amounts = extractAmounts(text);
    log('All amounts in text:', amounts);
    if (amounts.length > 0) {
      // Filter to reasonable transaction amounts
      const validAmounts = amounts.filter(a => a >= 1 && a <= 100000);
      if (validAmounts.length > 0) {
        amount = Math.max(...validAmounts);
        log('Using max valid:', amount);
      }
    }
  }

  if (!amount) {
    log('No amount found, parse failed');
    return null;
  }

  const merchant = extractMerchant(lines, text);
  const date = parseDate(text);
  const category = inferCategory(merchant, text);

  log('Parse result:', { amount, merchant, category, date: date ? 'found' : 'not found' });

  return {
    amount,
    currency: 'INR',
    merchant,
    category,
    date: date ?? new Date().toISOString(),
    source: 'GPay',
    confidence: computeConfidence(amount, merchant, date),
    rawText: text
  };
}
