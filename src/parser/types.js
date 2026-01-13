/**
 * @typedef {'UPI_RECEIPT' | 'FOOD_DELIVERY' | 'QUICK_COMMERCE' | 'UNKNOWN'} ScreenshotType
 */

/**
 * @typedef {Object} ParsedExpense
 * @property {number} amount
 * @property {'INR'} currency
 * @property {string} merchant
 * @property {string} category
 * @property {string} date - ISO format
 * @property {string} source
 * @property {number} confidence
 * @property {string} rawText
 */

export const ScreenshotTypes = {
  UPI_RECEIPT: 'UPI_RECEIPT',
  FOOD_DELIVERY: 'FOOD_DELIVERY',
  QUICK_COMMERCE: 'QUICK_COMMERCE',
  UNKNOWN: 'UNKNOWN'
};
