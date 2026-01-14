/**
 * OCR Post-Processing Layer
 * Normalizes OCR output before parsing to fix common recognition issues
 */

const DEBUG = import.meta.env.DEV;

function log(...args) {
  if (DEBUG) console.log('[OCR Normalize]', ...args);
}

/**
 * Check if a value is a likely UPI/payment amount
 * @param {number} value
 * @returns {boolean}
 */
function isLikelyPaymentAmount(value) {
  return value > 1 && value < 10000;
}

/**
 * Normalize amounts in OCR text
 * Handles cases where:
 * - Decimal point is missing (e.g., "61200" should be "612.00")
 * - ₹ is misread as "R" (e.g., "R475" should be "₹475")
 * - ₹ is misread as "2" or "3" prefix
 * @param {string} text - Raw OCR text
 * @returns {string} Normalized text
 */
export function normalizeAmounts(text) {
  let result = text;

  // Pattern 0a: R followed by number (₹ misread as R)
  // e.g., "R475" -> "₹475", "R612" -> "₹612"
  result = result.replace(
    /(?:^|[\s\n])R(\d{2,6}(?:\.\d{2})?)\b/g,
    (match, num) => {
      const value = parseFloat(num);
      if (isLikelyPaymentAmount(value)) {
        log(`R misread as ₹: R${num} -> ₹${num}`);
        return match.replace(`R${num}`, `₹${num}`);
      }
      return match;
    }
  );

  // Pattern 0b: I followed by number in amount context (₹ misread as I)
  // e.g., "4 items, I554" -> "4 items, ₹554"
  result = result.replace(
    /(items|total|paid|bill)\s*,?\s*I(\d{2,6}(?:\.\d{2})?)\b/gi,
    (match, context, num) => {
      const value = parseFloat(num);
      if (isLikelyPaymentAmount(value)) {
        log(`I misread as ₹: I${num} -> ₹${num}`);
        return `${context}, ₹${num}`;
      }
      return match;
    }
  );

  // Pattern 1: Large numbers near amount labels that are likely missing decimals
  // e.g., "total amount 61200" -> "total amount ₹612.00"
  result = result.replace(
    /(total amount|bill total|grand total|amount paid|paid|total)\s+(\d{4,7})(?!\d)/gi,
    (match, label, num) => {
      const value = Number(num);

      // If already reasonable, don't change
      if (value < 10000) {
        log(`Keeping ${num} as-is (already reasonable)`);
        return match;
      }

      // Ignore absurdly large numbers
      if (value > 10000000) {
        log(`Ignoring ${num} (too large)`);
        return match;
      }

      // Try reconstructing with decimal at position -2 (assume .00 cents)
      const normalized = num.slice(0, -2) + '.' + num.slice(-2);
      const parsed = parseFloat(normalized);

      if (isLikelyPaymentAmount(parsed)) {
        log(`Normalized: ${num} -> ₹${normalized}`);
        return `${label} ₹${normalized}`;
      }

      // Try without the leading digit (might be misread ₹)
      const withoutFirst = num.slice(1);
      const withoutFirstDecimal = withoutFirst.length > 2
        ? withoutFirst.slice(0, -2) + '.' + withoutFirst.slice(-2)
        : withoutFirst;
      const parsedWithoutFirst = parseFloat(withoutFirstDecimal);

      if (isLikelyPaymentAmount(parsedWithoutFirst)) {
        log(`Normalized (stripped first): ${num} -> ₹${withoutFirstDecimal}`);
        return `${label} ₹${withoutFirstDecimal}`;
      }

      log(`Could not normalize ${num}, keeping as-is`);
      return match;
    }
  );

  // Pattern 2: Large numbers near amount labels that start with 2 or 3 (misread ₹)
  // Only convert when preceded by amount context words, NOT for bank IDs, years, etc.
  // e.g., "Items, 2640.00" -> "Items, ₹640.00"
  result = result.replace(
    /(items|total|paid|amount|bill|price|fee|₹)\s*,?\s*([23])(\d{2,5})(?:\.(\d{2}))?\b/gi,
    (match, context, prefix, intPart, decPart) => {
      const fullNum = prefix + intPart + (decPart ? '.' + decPart : '');
      const withoutPrefix = intPart + (decPart ? '.' + decPart : '');
      const value = parseFloat(withoutPrefix);

      if (isLikelyPaymentAmount(value)) {
        log(`Likely misread ₹ (context: ${context}): ${fullNum} -> ₹${withoutPrefix}`);
        return `${context} ₹${withoutPrefix}`;
      }

      return match;
    }
  );

  // Pattern 3: Standalone 5-6 digit numbers starting with 2 or 3 that look like amounts with lost decimals
  // e.g., "330090" -> "₹300.90" (but NOT "2026" which is a year, or "3833" which is a bank ID)
  result = result.replace(
    /\b([23])(\d{4,5})\b/g,
    (match, prefix, rest) => {
      const fullNum = prefix + rest;

      // Skip if it looks like a year (2020-2030)
      if (/^20[2-3]\d$/.test(fullNum)) {
        return match;
      }

      // Try with decimal reconstruction (insert decimal before last 2 digits)
      if (rest.length >= 3) {
        const withDecimal = rest.slice(0, -2) + '.' + rest.slice(-2);
        const parsed = parseFloat(withDecimal);
        if (isLikelyPaymentAmount(parsed)) {
          log(`Likely misread ₹ with decimal: ${fullNum} -> ₹${withDecimal}`);
          return `₹${withDecimal}`;
        }
      }

      return match;
    }
  );

  return result;
}

/**
 * Mask numbers that should never be treated as amounts
 * @param {string} text - OCR text
 * @returns {string} Text with non-amount numbers masked
 */
export function maskNonAmountNumbers(text) {
  let result = text;

  // Mask years (1990-2039)
  result = result.replace(/\b(19|20)\d{2}\b/g, (match) => {
    log(`Masking year: ${match}`);
    return '____';
  });

  // Mask long IDs (10+ digits) - transaction IDs, order numbers
  result = result.replace(/\b\d{10,}\b/g, (match) => {
    log(`Masking long ID: ${match.substring(0, 10)}...`);
    return '____';
  });

  // Mask phone numbers (10 digits, possibly with space)
  result = result.replace(/\b\d{5}\s?\d{5}\b/g, (match) => {
    log(`Masking phone: ${match}`);
    return '____';
  });

  // Mask PIN codes (6 digits after state/city context)
  result = result.replace(/\b\d{6}\b(?=\s*,?\s*india)/gi, (match) => {
    log(`Masking PIN code: ${match}`);
    return '____';
  });

  return result;
}

/**
 * Full OCR normalization pipeline
 * @param {string} text - Raw OCR text
 * @returns {string} Normalized text ready for parsing
 */
export function normalizeOcrText(text) {
  log('Starting OCR normalization, length:', text.length);

  let result = text;

  // Step 1: Normalize amounts (fix missing decimals, misread ₹)
  result = normalizeAmounts(result);

  // Step 2: Mask non-amount numbers (years, IDs, phones)
  result = maskNonAmountNumbers(result);

  log('Normalization complete, length:', result.length);

  if (DEBUG) {
    console.log('[OCR Normalize] ========== AFTER NORMALIZATION ==========');
    console.log(result);
    console.log('[OCR Normalize] ========================================');
  }

  return result;
}
