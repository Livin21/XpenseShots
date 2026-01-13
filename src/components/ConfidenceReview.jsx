import { useState } from 'react';

/**
 * Format amount with currency
 * @param {number} amount
 * @returns {string}
 */
function formatAmount(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Confidence review component for low-confidence expenses
 * @param {{
 *   expense: import('../parser/types.js').ParsedExpense,
 *   onConfirm: (updatedExpense: import('../parser/types.js').ParsedExpense) => void,
 *   onCancel: () => void
 * }} props
 */
export function ConfidenceReview({ expense, onConfirm, onCancel }) {
  const [amount, setAmount] = useState(expense.amount);
  const [merchant, setMerchant] = useState(expense.merchant);

  const handleConfirm = () => {
    onConfirm({
      ...expense,
      amount,
      merchant,
      confidence: 1 // User verified
    });
  };

  return (
    <div className="confidence-review">
      <div className="review-header">
        <span className="review-badge">Needs Review</span>
        <span className="review-confidence">
          {Math.round(expense.confidence * 100)}% confident
        </span>
      </div>

      <div className="review-field">
        <label>Amount</label>
        <div className="amount-input">
          <span className="currency">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="review-field">
        <label>Merchant</label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
        />
      </div>

      <div className="review-info">
        <div className="info-row">
          <span className="info-label">Category</span>
          <span className="info-value">{expense.category}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Source</span>
          <span className="info-value">{expense.source}</span>
        </div>
      </div>

      <div className="review-actions">
        <button className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-confirm" onClick={handleConfirm}>
          Confirm
        </button>
      </div>
    </div>
  );
}
