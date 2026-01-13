/**
 * Normalize raw OCR text for parsing
 * @param {string} raw - Raw OCR output
 * @returns {string} Normalized text
 */
export function normalizeText(raw) {
  return raw
    // Normalize currency symbols - handle various OCR outputs
    .replace(/\u20b9/g, '₹')           // Unicode rupee sign
    // Only replace "Rs" when it's a currency indicator (not part of words like "Harsh")
    // Must be: start of string/word boundary + Rs + optional dot + space/number
    .replace(/(?:^|(?<=\s))rs\.?\s*(?=\d)/gi, '₹')  // "Rs 500" or "Rs.500"
    .replace(/(?:^|(?<=\s))rs\.(?=\s)/gi, '₹')     // "Rs. " followed by space
    .replace(/inr\s*(?=\d)/gi, '₹')    // INR before number
    .replace(/₹\s+/g, '₹')             // Remove space after ₹
    // Common OCR mistakes
    .replace(/[|l1]/g, (match, offset, str) => {
      // Only replace if it looks like it should be 'I' in context
      // Keep numbers as-is
      const before = str[offset - 1] || '';
      const after = str[offset + 1] || '';
      if (/\d/.test(before) || /\d/.test(after)) return match;
      return match === '|' ? 'I' : match;
    })
    .replace(/[oO](?=\d)/g, '0')       // O before digit -> 0
    .replace(/(?<=\d)[oO]/g, '0')      // O after digit -> 0
    // Normalize newlines FIRST (before whitespace normalization)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Normalize horizontal whitespace only (preserve newlines)
    .replace(/[^\S\n]+/g, ' ')
    .trim();
}

/**
 * Split text into non-empty trimmed lines
 * @param {string} text - Text to split
 * @returns {string[]} Array of lines
 */
export function splitLines(text) {
  return text
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
}

/**
 * Normalize text and convert to lowercase for matching
 * @param {string} raw - Raw OCR output
 * @returns {string} Normalized lowercase text
 */
export function normalizeForMatching(raw) {
  return normalizeText(raw).toLowerCase();
}
