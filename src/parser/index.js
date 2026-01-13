import { normalizeText, splitLines } from './normalize.js';
import { classifyScreenshot } from './classifier.js';
import { parseUpiReceipt } from './upi.js';
import { parseFoodDelivery } from './food.js';
import { parseInstamart } from './instamart.js';
import { ScreenshotTypes } from './types.js';

/**
 * Parse expense from raw OCR text
 * @param {string} rawText - Raw OCR output
 * @returns {import('./types.js').ParsedExpense | null}
 */
export function parseExpenseFromOcr(rawText) {
  const normalized = normalizeText(rawText);
  const lines = splitLines(normalized);

  const type = classifyScreenshot(normalized);

  switch (type) {
    case ScreenshotTypes.UPI_RECEIPT:
      return parseUpiReceipt(normalized, lines);
    case ScreenshotTypes.FOOD_DELIVERY:
      return parseFoodDelivery(normalized, lines);
    case ScreenshotTypes.QUICK_COMMERCE:
      return parseInstamart(normalized, lines);
    default:
      return null;
  }
}

export { ScreenshotTypes } from './types.js';
export { classifyScreenshot } from './classifier.js';
