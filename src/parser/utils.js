/**
 * Extract all amounts from text
 * Handles various formats: ₹500, Rs.500, Rs 500, 500.00, etc.
 * @param {string} text - Text to search
 * @returns {number[]} Array of amounts found
 */
export function extractAmounts(text) {
  const amounts = [];

  // Pattern 1: ₹ followed by number (with optional space)
  const pattern1 = /₹\s?([0-9,]+(?:\.[0-9]{1,2})?)/g;
  let match;
  while ((match = pattern1.exec(text)) !== null) {
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

  return amounts;
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
 * @param {string[]} lines - Lines to search
 * @param {string[]} labels - Labels to look for (e.g., ['total', 'paid'])
 * @returns {number | null}
 */
export function extractAmountNearLabel(lines, labels) {
  for (const line of lines) {
    const hasLabel = labels.some(l => line.includes(l));
    if (hasLabel) {
      const amounts = extractAmounts(line);
      if (amounts.length > 0) {
        // Return the last amount on the line (usually the value after the label)
        return amounts[amounts.length - 1];
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
