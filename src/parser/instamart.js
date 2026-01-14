import { extractAmounts, extractAmountNearLabel, parseDate, fixMisreadRupeeAmount } from './utils.js';

const DEBUG = import.meta.env.DEV;

// Options for amount extraction - fix ₹ being misread as "3"
const AMOUNT_OPTIONS = { fixMisreadRupee: true };

function log(...args) {
  if (DEBUG) console.log('[Instamart Parser]', ...args);
}

/**
 * Parse Swiggy Instamart receipt
 * @param {string} text - Normalized text
 * @param {string[]} lines - Split lines
 * @returns {import('./types.js').ParsedExpense | null}
 */
export function parseInstamart(text, lines) {
  log('Starting Instamart parse');
  let amount = null;

  // Strategy 1: Look for grand total / total labels
  log('Strategy 1: Looking for labeled amounts...');
  amount = extractAmountNearLabel(lines, [
    'grand total',
    'total',
    'amount paid',
    'paid'
  ], AMOUNT_OPTIONS);
  if (amount) log('Found via label:', amount);

  // Strategy 2: Look for specific patterns
  if (!amount) {
    log('Strategy 2: Looking for total patterns...');
    for (const line of lines) {
      const match = line.match(/(grand total|total|paid)\s*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
      if (match) {
        amount = fixMisreadRupeeAmount(parseFloat(match[2].replace(/,/g, '')));
        log('Found via pattern:', amount, 'in line:', line);
        break;
      }
    }
  }

  // Strategy 3: Get the largest amount excluding fees
  if (!amount) {
    log('Strategy 3: Looking for largest amount excluding fees...');
    const excludeKeywords = [
      'delivery fee',
      'handling',
      'free',
      'item bill'
    ];

    const amounts = [];
    for (const line of lines) {
      if (excludeKeywords.some(k => line.includes(k))) continue;
      // Skip individual item prices (1x, etc.)
      if (/^\d+\s*x\s/i.test(line)) continue;
      // Skip lines with dates
      if (/\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line)) continue;

      const lineAmounts = extractAmounts(line, AMOUNT_OPTIONS);
      // Filter out year-like numbers (2020-2030)
      const filtered = lineAmounts.filter(a => !(a >= 2020 && a <= 2030));
      amounts.push(...filtered);
    }

    log('Amounts found:', amounts);
    if (amounts.length > 0) {
      amount = Math.max(...amounts);
      log('Using max:', amount);
    }
  }

  // Strategy 4: Fallback to largest reasonable amount
  if (!amount) {
    log('Strategy 4: Looking for any reasonable amount...');
    const allAmounts = extractAmounts(text, AMOUNT_OPTIONS)
      .filter(a => a >= 50 && a <= 50000)
      .filter(a => !(a >= 2020 && a <= 2030)); // Exclude year-like numbers
    log('All reasonable amounts:', allAmounts);
    if (allAmounts.length > 0) {
      amount = Math.max(...allAmounts);
      log('Using max:', amount);
    }
  }

  if (!amount) {
    log('No amount found, parse failed');
    return null;
  }

  const date = parseDate(text);
  log('Parse result:', { amount, date: date ? 'found' : 'not found' });

  return {
    amount,
    currency: 'INR',
    merchant: 'Swiggy Instamart',
    category: 'Groceries',
    date: date ?? new Date().toISOString(),
    source: 'Instamart',
    confidence: 0.9,
    rawText: text
  };
}
