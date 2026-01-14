import { extractAmounts, extractAmountNearLabel, parseDate, titleCase, fixMisreadRupeeAmount } from './utils.js';

const DEBUG = import.meta.env.DEV;

// Options for amount extraction - fix ₹ being misread as "3"
const AMOUNT_OPTIONS = { fixMisreadRupee: true };

function log(...args) {
  if (DEBUG) console.log('[Food Parser]', ...args);
}

/**
 * Extract restaurant name from lines
 * @param {string[]} lines
 * @param {string} fullText
 * @returns {string}
 */
function extractRestaurant(lines, fullText) {
  log('Looking for restaurant name...');

  // Look for restaurant name - typically appears near the top
  // after "Order Details" or before order items

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i].trim();
    // Clean version for checking - remove OCR artifacts like stray ₹ symbols
    const cleanLine = line.replace(/₹/g, 's').replace(/[^\w\s.'&-]/g, '');

    // Skip common header/status text
    if (/order details|order was|delivered|support|help|bill/i.test(cleanLine)) continue;
    // Skip order IDs
    if (/order\s*(id|#)|#\d{5,}/i.test(cleanLine)) continue;
    // Skip lines that are primarily prices (₹ followed by numbers)
    if (/₹\s*\d+/.test(line)) continue;
    // Skip lines with large numbers (likely prices)
    if (/\d{3,}/.test(line) && !/dhaba|hotel|restaurant|cafe|kitchen|foods?|biryani/i.test(cleanLine)) continue;
    // Skip item listings (1x, 2x, etc.)
    if (/^\d+\s*x\s/i.test(line)) continue;
    // Skip dates
    if (/\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line)) continue;
    // Skip location/address indicators
    if (/kakkanad|kochi|kerala|india|infopark|road|tower|building|pin\s*code/i.test(cleanLine)) continue;
    // Skip swiggy/zomato UI elements
    if (/swiggy|zomato|reorder|track|rating|review|download/i.test(cleanLine)) continue;

    // Look for business-like names (letters with optional spaces)
    // Check clean version but use original line with proper cleaning
    if (/^[a-z][a-z\s.'&-]{2,30}$/i.test(cleanLine) && cleanLine.length >= 3 && cleanLine.length <= 35) {
      log('Restaurant found via header scan:', cleanLine, '(original:', line, ')');
      return titleCase(cleanLine);
    }
  }

  // Try to find restaurant from context - "from [restaurant]"
  const restaurantMatch = fullText.match(/from\s+([a-z][a-z\s.&']{2,25})/i);
  if (restaurantMatch) {
    log('Restaurant found via "from" pattern:', restaurantMatch[1].trim());
    return titleCase(restaurantMatch[1].trim());
  }

  // Try to find common restaurant name patterns
  const dhabaMatch = fullText.match(/([a-z]+\s*(?:dhaba|hotel|kitchen|cafe|restaurant|biryani|foods?))/i);
  if (dhabaMatch) {
    const name = dhabaMatch[1].replace(/₹/g, 's').trim();
    log('Restaurant found via keyword pattern:', name);
    return titleCase(name);
  }

  log('Restaurant not found, using default');
  return 'Food Order';
}

/**
 * Detect source (Swiggy, Zomato, etc.)
 * @param {string} text
 * @returns {string}
 */
function detectSource(text) {
  const t = text.toLowerCase();
  if (t.includes('zomato')) return 'Zomato';
  if (t.includes('swiggy')) return 'Swiggy';
  // Default to Swiggy if we see Swiggy-specific UI elements
  if (t.includes('reorder') || t.includes('swiggy one')) return 'Swiggy';
  return 'Food Delivery';
}

/**
 * Parse Swiggy/Zomato food delivery receipt
 * @param {string} text - Normalized text
 * @param {string[]} lines - Split lines
 * @returns {import('./types.js').ParsedExpense | null}
 */
export function parseFoodDelivery(text, lines) {
  log('Starting food delivery parse');
  let amount = null;

  // Strategy 1: Look for bill total / paid / grand total labels
  log('Strategy 1: Looking for labeled amounts...');
  amount = extractAmountNearLabel(lines, [
    'bill total',
    'paid',
    'grand total',
    'total',
    'amount paid'
  ], AMOUNT_OPTIONS);
  if (amount) log('Found via label:', amount);

  // Strategy 2: Look for specific patterns in lines
  if (!amount) {
    log('Strategy 2: Looking for total patterns...');
    for (const line of lines) {
      // Match patterns like "Paid ₹664.70" or "Bill Total ₹640.00"
      const match = line.match(/(bill total|paid|grand total|total)\s*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
      if (match) {
        amount = fixMisreadRupeeAmount(parseFloat(match[2].replace(/,/g, '')));
        log('Found via pattern:', amount, 'in line:', line);
        break;
      }
    }
  }

  // Strategy 3: Get the largest amount, excluding item prices
  if (!amount) {
    log('Strategy 3: Looking for largest amount excluding items/fees...');
    const excludeKeywords = [
      'delivery fee',
      'platform fee',
      'gst',
      'taxes',
      'discount',
      'packaging',
      'handling',
      'tip',
      'free'
    ];

    const amounts = [];
    for (const line of lines) {
      // Skip lines with fee/discount keywords
      if (excludeKeywords.some(k => line.includes(k))) continue;
      // Skip item listings (1x, 2x, etc.) - these are individual item prices
      if (/^\d+\s*x\s/i.test(line) || /x\s*\d+/i.test(line)) continue;
      // Skip lines with dates (contain year-like numbers in date context)
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

  // Strategy 4: Just find the largest reasonable amount
  if (!amount) {
    log('Strategy 4: Looking for any reasonable amount...');
    const allAmounts = extractAmounts(text, AMOUNT_OPTIONS)
      .filter(a => a >= 50 && a <= 10000)
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

  const merchant = extractRestaurant(lines, text);
  const date = parseDate(text);
  const source = detectSource(text);

  log('Parse result:', { amount, merchant, source, date: date ? 'found' : 'not found' });

  return {
    amount,
    currency: 'INR',
    merchant,
    category: 'Food & Dining',
    date: date ?? new Date().toISOString(),
    source,
    confidence: 0.85,
    rawText: text
  };
}
