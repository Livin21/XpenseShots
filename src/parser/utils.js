/**
 * Extract all amounts from text
 * Handles various formats: ₹500, Rs.500, Rs 500, 500.00, etc.
 * Also handles OCR misreading ₹ as "3" (e.g., ₹620 → 3620)
 * And OCR losing decimal points (e.g., 300.90 → 30090)
 * @param {string} text - Text to search
 * @param {object} options - Options
 * @param {boolean} options.fixMisreadRupee - Try to fix ₹ misread as 2/3 and lost decimals
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

  // Pattern 1c: R followed by number - OCR sometimes misreads ₹ as R (capital R)
  // Only match at start of line or after whitespace to avoid matching words like "R2D2"
  const pattern1c = /(?:^|[\s\n])R([0-9,]+(?:\.[0-9]{1,2})?)/g;
  while ((match = pattern1c.exec(text)) !== null) {
    amounts.push(parseFloat(match[1].replace(/,/g, '')));
  }

  // Pattern 1d: F followed by number - OCR sometimes misreads ₹ as F (especially on dark backgrounds)
  // e.g., "F275" → ₹275, "F664.70" → ₹664.70
  const pattern1d = /(?:^|[\s\n])F([0-9,]+(?:\.[0-9]{1,2})?)/g;
  while ((match = pattern1d.exec(text)) !== null) {
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

  // Filter out NaN values that can occur from malformed OCR text
  const validAmounts = amounts.filter(a => !isNaN(a));

  // Fix OCR issues: ₹ misread as "2" or "3", and lost decimal points
  // e.g., ₹620 appears as 3620, ₹300.90 appears as 330090
  if (fixMisreadRupee) {
    return validAmounts.map(amt => fixMisreadRupeeAmount(amt));
  }

  return validAmounts;
}

/**
 * Fix amounts where OCR misread ₹ symbol as digit "2" or "3"
 * and/or lost decimal points
 * Examples:
 * - ₹620 → 3620 or 2620 (misread ₹ as 3 or 2)
 * - ₹300.90 → 330090 (misread ₹ as 3, lost decimal)
 * - ₹299.00 → 2299.00 (misread ₹ as 2)
 * @param {number} amount - Amount that might have misread ₹
 * @returns {number} Corrected amount
 */
export function fixMisreadRupeeAmount(amount) {
  const str = String(amount);

  // Case 1: Large integers that might have lost decimals (5-6 digits starting with 2 or 3)
  // e.g., 330090 → 300.90, 230050 → 300.50
  if (/^[23]\d{4,5}$/.test(str)) {
    // Try interpreting as amount with misread ₹ prefix and missing decimal
    const withoutPrefix = str.slice(1);
    // Insert decimal before last 2 digits
    const intPart = withoutPrefix.slice(0, -2);
    const decPart = withoutPrefix.slice(-2);
    const corrected = parseFloat(`${intPart}.${decPart}`);

    // Validate it's in reasonable transaction range
    if (corrected >= 10 && corrected <= 10000) {
      return corrected;
    }
  }

  // Case 2: Amount starts with 2 or 3 and might have misread ₹ (with decimal intact)
  // e.g., 2299.00 → 299.00, 3620.50 → 620.50
  if (/^[23]/.test(str)) {
    const withoutPrefix = str.slice(1);
    if (!withoutPrefix) return amount;

    const corrected = parseFloat(withoutPrefix);

    // Heuristics for 4-digit numbers: 3620 → 620, 2299 → 299
    if (amount >= 200 && amount < 10000 && corrected >= 50 && corrected < 5000) {
      // Additional check: if original is way higher than corrected, likely misread
      if (amount > corrected * 2) {
        return corrected;
      }
    }

    // For amounts with explicit decimals: 3620.00 → 620.00, 2299.00 → 299.00
    if (str.includes('.') && corrected >= 10 && corrected <= 5000) {
      return corrected;
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
        // First try standard amount extraction
        let amounts = extractAmounts(line, options);

        // If no amounts found, look for large integers that might be amounts with lost decimals
        // e.g., "total amount 230050" where 230050 is actually ₹300.50
        if (amounts.length === 0 && options.fixMisreadRupee) {
          const largeIntPattern = /\b([23]\d{4,5})\b/g;
          let match;
          while ((match = largeIntPattern.exec(line)) !== null) {
            const raw = parseInt(match[1], 10);
            const fixed = fixMisreadRupeeAmount(raw);
            if (fixed !== raw) {
              amounts.push(fixed);
            }
          }
        }

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
  // Pattern 1: "30 Aug 2025" or "30 August 2025" with optional time (space between day and month)
  const dateRegex1 = /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i;

  // Pattern 2: "11 Jan 2026, 8:47 am" (with optional comma and time)
  const dateRegex2 = /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4}),?\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)?/i;

  // Pattern 3: "11Jan 2026" - OCR sometimes loses the space between day and month
  const dateRegex3 = /(\d{1,2})(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i;

  let match = text.match(dateRegex2) || text.match(dateRegex1) || text.match(dateRegex3);

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

  // Pattern 4: ISO-ish format or other standard formats
  const dateRegex4 = /(\d{4}[-/]\d{2}[-/]\d{2})/;
  match = text.match(dateRegex4);
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
