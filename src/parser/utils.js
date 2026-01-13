/**
 * Extract the largest amount from lines, excluding lines with certain keywords
 * @param {string[]} lines - Lines to search
 * @param {string[]} excludeKeywords - Keywords to skip
 * @returns {number | null}
 */
export function extractLargestAmount(lines, excludeKeywords = []) {
  const amounts = [];

  for (const line of lines) {
    if (excludeKeywords.some(k => line.includes(k))) continue;

    const matches = [...line.matchAll(/₹\s?([0-9,]+(\.[0-9]{1,2})?)/g)];
    for (const m of matches) {
      amounts.push(Number(m[1].replace(/,/g, '')));
    }
  }

  return amounts.length ? Math.max(...amounts) : null;
}

/**
 * Parse date from text
 * @param {string} text - Text to search for date
 * @returns {string | null} ISO date string or null
 */
export function parseDate(text) {
  const dateRegex =
    /(\d{1,2}\s[a-z]{3,9}\s\d{4}).*?(\d{1,2}:\d{2}\s?(am|pm))?/i;

  const m = text.match(dateRegex);
  if (!m) return null;

  const parsed = new Date(m[0]);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Convert string to title case
 * @param {string} s - String to convert
 * @returns {string}
 */
export function titleCase(s) {
  return s.replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1));
}
