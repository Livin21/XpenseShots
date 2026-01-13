/**
 * Extract all amounts from text
 * Handles various formats: ₹500, Rs.500, Rs 500, 500.00, etc.
 * Also handles OCR misreading ₹ as "3" (e.g., ₹620 → 3620)
 * @param {string} text - Text to search
 * @param {object} options - Options
 * @param {boolean} options.fixMisreadRupee - Try to fix ₹ misread as 3
 * @returns {number[]} Array of amounts found
 */
export function extractAmounts(text, options = {}) {
  const { fixMisreadRupee = false } = options;
  const amounts = [];

  // Pattern 1: ₹ followed by number (with optional space)
  const pattern1 = /₹\s?([0-9,]+(?:\.[0-9]{1,2})?)/g;
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    amounts.push(parseFloat(match[1].replace(/,/g, '')));
  }

  // Pattern 1b: ¥ followed by number - OCR sometimes misreads ₹ as ¥
  const pattern1b = /¥\s?([0-9,]+(?:\.[0-9]{1,2})?)/g;
  while ((match = pattern1b.exec(text)) !== null) {
    amounts.push(parseFloat(match[1].replace(/,/g, '')));
  }

  // Pattern 2: Number followed by ₹ or preceded by currency words
  // e.g., "500₹" or standalone numbers near currency context
  const pattern2 = /([0-9,]+(?:\.[0-9]{1,2})?)\s?₹/g;
  while ((match = pattern2.exec(text)) !== null) {
    amounts.push(parseFloat(match[1].replace(/,/g, '')));
  }

  // Pattern 3: Decimal numbers that look like prices (3+ digits with optional decimals)
  // Only if we found no amounts with currency symbols
  if (amounts.length === 0) {
    const pattern3 = /\b([0-9]{3,}(?:\.[0-9]{1,2})?)\b/g;
    while ((match = pattern3.exec(text)) !== null) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      // Filter out numbers that look like IDs (too long) or dates
      if (num >= 10 && num <= 100000) {
        amounts.push(num);
      }
    }
  }

  // Fix OCR misreading ₹ as "3" (common issue)
  // e.g., ₹620 appears as 3620 in OCR
  if (fixMisreadRupee) {
    return amounts.map(amt => fixMisreadRupeeAmount(amt));
  }

  return amounts;
}

/**
 * Fix amounts where OCR misread ₹ symbol as digit "3"
 * e.g., ₹620 → 3620, ₹330 → 3330, ₹85 → 385
 * @param {number} amount - Amount that might have misread ₹
 * @returns {number} Corrected amount
 */
export function fixMisreadRupeeAmount(amount) {
  const str = String(amount);

  // Check if starts with 3 and could be a misread ₹
  if (!str.startsWith('3')) return amount;

  // Get the amount without the leading 3
  const withoutLeading3 = str.slice(1);
  if (!withoutLeading3) return amount;

  const corrected = parseFloat(withoutLeading3);

  // Heuristics to determine if this is likely a misread ₹:
  // - Original looks too high for typical food order (3xxx for what should be xxx)
  // - Corrected amount is in reasonable range for food/groceries (50-3000)
  // - Pattern: 3XXX where XXX is 2-3 digits (e.g., 3620 → 620, 3330 → 330)

  // For amounts like 3620 → 620, 3330 → 330, 3199 → 199
  if (amount >= 300 && amount < 4000 && corrected >= 50 && corrected < 1000) {
    return corrected;
  }

  // For slightly larger orders: 31500 → 1500, 32000 → 2000
  if (amount >= 3000 && amount < 40000 && corrected >= 500 && corrected <= 5000) {
    return corrected;
  }

  // For amounts with decimals: 3620.00 → 620.00
  if (str.includes('.')) {
    const correctedWithDecimal = parseFloat(withoutLeading3);
    if (correctedWithDecimal >= 50 && correctedWithDecimal <= 5000) {
      return correctedWithDecimal;
    }
  }

  return amount;
}

/**
 * Extract the largest amount from lines, excluding lines with certain keywords
 * @param {string[]} lines - Lines to search
 * @param {string[]} excludeKeywords - Keywords to skip
 * @returns {number | null}
 */
export function extractLargestAmount(lines, excludeKeywords = []) {
  const amounts = [];

  for (const line of lines) {
    // Skip lines with excluded keywords
    if (excludeKeywords.some(k => line.includes(k))) continue;

    const lineAmounts = extractAmounts(line);
    amounts.push(...lineAmounts);
  }

  return amounts.length ? Math.max(...amounts) : null;
}

/**
 * Extract amount near a specific label
 * Labels are checked in order of priority - first label that matches wins
 * @param {string[]} lines - Lines to search
 * @param {string[]} labels - Labels to look for in priority order (e.g., ['bill total', 'total'])
 * @param {object} options - Options to pass to extractAmounts
 * @returns {number | null}
 */
export function extractAmountNearLabel(lines, labels, options = {}) {
  // Search by label priority - check all lines for first label, then all lines for second label, etc.
  for (const label of labels) {
    for (const line of lines) {
      // For multi-word labels, require exact phrase match
      // For single-word labels, use word boundary to avoid "item total" matching "total"
      let hasLabel;
      if (label.includes(' ')) {
        // Multi-word: exact phrase match
        hasLabel = line.includes(label);
      } else {
        // Single-word: word boundary match to avoid partial matches
        // "total" should not match "item total" but should match "total:" or "total 500"
        const regex = new RegExp(`(?:^|\\s)${label}(?:\\s|:|$)`, 'i');
        hasLabel = regex.test(line);
      }

      if (hasLabel) {
        const amounts = extractAmounts(line, options);
        if (amounts.length > 0) {
          // Return the last amount on the line (usually the value after the label)
          return amounts[amounts.length - 1];
        }
      }
    }
  }
  return null;
}

/**
 * Parse date from text
 * @param {string} text - Text to search for date
 * @returns {string | null} ISO date string or null
 */
export function parseDate(text) {
  // Pattern 1: "30 Aug 2025" or "30 August 2025" with optional time
  const dateRegex1 = /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i;

  // Pattern 2: "11 Jan 2026, 8:47 am"
  const dateRegex2 = /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4}),?\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)?/i;

  let match = text.match(dateRegex2) || text.match(dateRegex1);

  if (match) {
    try {
      const dateStr = `${match[1]} ${match[2]} ${match[3]}`;
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch (e) {
      // Fall through
    }
  }

  // Pattern 3: ISO-ish format or other standard formats
  const dateRegex3 = /(\d{4}[-/]\d{2}[-/]\d{2})/;
  match = text.match(dateRegex3);
  if (match) {
    try {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch (e) {
      // Fall through
    }
  }

  return null;
}

/**
 * Convert string to title case
 * @param {string} s - String to convert
 * @returns {string}
 */
export function titleCase(s) {
  return s.replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1).toLowerCase());
}
