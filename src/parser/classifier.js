import { ScreenshotTypes } from './types.js';

/**
 * Check if text contains any of the given words
 * @param {string} text - Text to search
 * @param {string[]} words - Words to look for
 * @returns {boolean}
 */
function hasAny(text, words) {
  return words.some(w => text.includes(w));
}

/**
 * Classify screenshot type based on text content
 * @param {string} text - Normalized OCR text
 * @returns {import('./types.js').ScreenshotType}
 */
export function classifyScreenshot(text) {
  const t = text.toLowerCase();

  if (hasAny(t, ['g pay', 'google pay', 'upi transaction id', 'paid to'])) {
    return ScreenshotTypes.UPI_RECEIPT;
  }

  if (
    hasAny(t, ['order details', 'bill summary', 'reorder', 'invoice']) &&
    hasAny(t, ['swiggy', 'zomato'])
  ) {
    return ScreenshotTypes.FOOD_DELIVERY;
  }

  if (hasAny(t, ['instamart', 'grand total', 'item bill'])) {
    return ScreenshotTypes.QUICK_COMMERCE;
  }

  return ScreenshotTypes.UNKNOWN;
}
