import { normalizeText, splitLines } from './normalize.js';
import { normalizeOcrText } from '../ocr/normalizeOcr.js';
import { classifyScreenshot } from './classifier.js';
import { parseUpiReceipt } from './upi.js';
import { parseFoodDelivery } from './food.js';
import { parseInstamart } from './instamart.js';
import { ScreenshotTypes } from './types.js';

const DEBUG = import.meta.env.DEV;

function log(...args) {
  if (DEBUG) console.log('[Parser]', ...args);
}

/**
 * Parse expense from raw OCR text
 * @param {string} rawText - Raw OCR output
 * @returns {import('./types.js').ParsedExpense | null}
 */
export function parseExpenseFromOcr(rawText) {
  if (!rawText || rawText.trim().length < 10) {
    log('Text too short, skipping');
    return null;
  }

  log('Starting parse, raw text length:', rawText.length);

  // Step 1: Basic text normalization (currency symbols, whitespace)
  const normalized = normalizeText(rawText);

  // Step 2: OCR-specific normalization (fix amounts, mask non-amounts)
  const ocrNormalized = normalizeOcrText(normalized);

  // Step 3: Lowercase and split for parsing
  const normalizedLower = ocrNormalized.toLowerCase();
  const lines = splitLines(normalizedLower);

  log('Normalized text length:', normalizedLower.length);
  log('Number of lines:', lines.length);

  if (DEBUG) {
    console.log('[Parser] ========== NORMALIZED TEXT START ==========');
    console.log(normalizedLower);
    console.log('[Parser] ========== NORMALIZED TEXT END ==========');
  }

  // Classify based on lowercase text
  const type = classifyScreenshot(normalizedLower);
  log('Classified as:', type);

  let result = null;

  switch (type) {
    case ScreenshotTypes.UPI_RECEIPT:
      log('Trying UPI parser...');
      result = parseUpiReceipt(normalizedLower, lines);
      break;
    case ScreenshotTypes.FOOD_DELIVERY:
      log('Trying food delivery parser...');
      result = parseFoodDelivery(normalizedLower, lines);
      break;
    case ScreenshotTypes.QUICK_COMMERCE:
      log('Trying Instamart parser...');
      result = parseInstamart(normalizedLower, lines);
      break;
    default:
      log('Unknown type, trying fallback parsers...');

      // Try UPI first (most common)
      log('Fallback: trying UPI parser...');
      result = parseUpiReceipt(normalizedLower, lines);
      if (result) {
        log('Fallback UPI parser succeeded');
        break;
      }

      // Try food delivery
      log('Fallback: trying food delivery parser...');
      result = parseFoodDelivery(normalizedLower, lines);
      if (result) {
        log('Fallback food delivery parser succeeded');
        break;
      }

      // Try instamart
      log('Fallback: trying Instamart parser...');
      result = parseInstamart(normalizedLower, lines);
      if (result) {
        log('Fallback Instamart parser succeeded');
        break;
      }

      log('All parsers failed');
  }

  if (result) {
    log('Parse successful:', {
      amount: result.amount,
      merchant: result.merchant,
      category: result.category,
      source: result.source,
      confidence: result.confidence
    });
  } else {
    log('Parse failed - no result');
  }

  return result;
}

export { ScreenshotTypes } from './types.js';
export { classifyScreenshot } from './classifier.js';
