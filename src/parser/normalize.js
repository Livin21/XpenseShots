/**
 * Normalize raw OCR text for parsing
 * @param {string} raw - Raw OCR output
 * @returns {string} Normalized text
 */
export function normalizeText(raw) {
  return raw
    // Normalize currency symbols - handle various OCR outputs
    .replace(/\u20b9/g, '₹')           // Unicode rupee sign
    .replace(/rs\.?\s*/gi, '₹')        // Rs. or Rs
    .replace(/inr\s*/gi, '₹')          // INR
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
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Normalize newlines for line splitting
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
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
