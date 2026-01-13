import { ScreenshotTypes } from './types.js';

const DEBUG = import.meta.env.DEV;

function log(...args) {
  if (DEBUG) console.log('[Classifier]', ...args);
}

/**
 * Check if text contains any of the given words
 * @param {string} text - Text to search
 * @param {string[]} words - Words to look for
 * @returns {boolean}
 */
function hasAny(text, words) {
  const found = words.filter(w => text.includes(w));
  if (found.length > 0 && DEBUG) {
    log('Found keywords:', found);
  }
  return found.length > 0;
}

/**
 * Classify screenshot type based on text content
 * @param {string} text - Normalized OCR text
 * @returns {import('./types.js').ScreenshotType}
 */
export function classifyScreenshot(text) {
  const t = text.toLowerCase();
  log('Classifying text of length:', t.length);

  // Check for Instamart first (most specific)
  if (hasAny(t, ['instamart'])) {
    log('Result: QUICK_COMMERCE (instamart keyword)');
    return ScreenshotTypes.QUICK_COMMERCE;
  }

  // Check for food delivery apps
  // Looking for Swiggy or Zomato indicators
  const foodAppKeywords = [
    'swiggy',
    'zomato',
    'order details',
    'order was delivered',
    'bill summary',
    'reorder',
    'bill details',
    'item total',
    'delivery partner',
    'restaurant packaging'
  ];

  const foodIndicatorKeywords = [
    'delivered',
    'delivery fee',
    'platform fee',
    'item total',
    'gst',
    'taxes'
  ];

  const isFoodApp = hasAny(t, foodAppKeywords);
  const hasFoodIndicators = hasAny(t, foodIndicatorKeywords);

  log('Food app detected:', isFoodApp, '| Food indicators:', hasFoodIndicators);

  // If it has food app name or multiple food indicators
  if (isFoodApp && hasFoodIndicators) {
    log('Result: FOOD_DELIVERY');
    return ScreenshotTypes.FOOD_DELIVERY;
  }

  // Check for UPI/GPay - should come after food delivery check
  // because food delivery can also have UPI payment
  const upiKeywords = [
    'g pay',
    'gpay',
    'google pay',
    'upi transaction',
    'upi lite',
    'paid to',
    'payment to',
    'to:',
    'from:',
    'google transaction'
  ];

  const upiIndicatorKeywords = [
    'completed',
    'successful',
    'paid',
    'transaction id',
    '@',  // UPI IDs contain @
    'hdfc',
    'sbi',
    'icici',
    'axis',
    'bank'
  ];

  const isUpi = hasAny(t, upiKeywords);
  const hasUpiIndicators = hasAny(t, upiIndicatorKeywords);

  log('UPI detected:', isUpi, '| UPI indicators:', hasUpiIndicators);

  if (isUpi && hasUpiIndicators) {
    log('Result: UPI_RECEIPT');
    return ScreenshotTypes.UPI_RECEIPT;
  }

  // Fallback: if we see grand total or item bill, likely quick commerce
  if (hasAny(t, ['grand total', 'item bill'])) {
    log('Result: QUICK_COMMERCE (grand total/item bill fallback)');
    return ScreenshotTypes.QUICK_COMMERCE;
  }

  // If has strong UPI indicators without food context
  if (isUpi) {
    log('Result: UPI_RECEIPT (UPI keywords only)');
    return ScreenshotTypes.UPI_RECEIPT;
  }

  // If has food indicators without UPI context
  if (isFoodApp) {
    log('Result: FOOD_DELIVERY (food app keywords only)');
    return ScreenshotTypes.FOOD_DELIVERY;
  }

  log('Result: UNKNOWN');
  return ScreenshotTypes.UNKNOWN;
}
