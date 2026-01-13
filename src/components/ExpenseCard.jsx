/**
 * Format amount with currency
 * @param {number} amount
 * @returns {string}
 */
function formatAmount(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format date for display
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Get confidence level class
 * @param {number} confidence
 * @returns {string}
 */
function getConfidenceClass(confidence) {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.75) return 'medium';
  return 'low';
}

/**
 * Expense card component
 * @param {{
 *   expense: import('../parser/types.js').ParsedExpense & { id?: string },
 *   showConfidence?: boolean,
 *   compact?: boolean
 * }} props
 */
export function ExpenseCard({ expense, showConfidence = false, compact = false }) {
  const { amount, merchant, category, date, source, confidence } = expense;

  return (
    <div className={`expense-card ${compact ? 'compact' : ''}`}>
      <div className="expense-main">
        <div className="expense-amount">{formatAmount(amount)}</div>
        <div className="expense-merchant">{merchant}</div>
      </div>
      <div className="expense-details">
        <span className="expense-category">{category}</span>
        <span className="expense-source">{source}</span>
        <span className="expense-date">{formatDate(date)}</span>
      </div>
      {showConfidence && (
        <div className={`expense-confidence ${getConfidenceClass(confidence)}`}>
          {Math.round(confidence * 100)}% confident
        </div>
      )}
    </div>
  );
}
