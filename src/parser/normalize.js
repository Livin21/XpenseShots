/**
 * Normalize raw OCR text for parsing
 * @param {string} raw - Raw OCR output
 * @returns {string} Normalized text
 */
export function normalizeText(raw) {
  return raw
    .replace(/\u20b9|rs\.?|inr/gi, '₹')
    .replace(/[|]/g, 'I')
    .replace(/\s+/g, ' ')
    .toLowerCase()
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
