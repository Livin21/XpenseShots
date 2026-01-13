import { useState, useEffect } from 'react';

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Utilities',
  'Subscriptions',
  'Shopping',
  'Transport',
  'Entertainment',
  'Health',
  'Miscellaneous'
];

/**
 * Format date for input[type="date"]
 * @param {string} isoDate
 * @returns {string}
 */
function formatDateForInput(isoDate) {
  const date = new Date(isoDate);
  return date.toISOString().split('T')[0];
}

/**
 * Modal for editing an expense
 * @param {{
 *   expense: import('../storage/db.js').Expense,
 *   onSave: (updates: Partial<import('../storage/db.js').Expense>) => void,
 *   onCancel: () => void,
 *   onDelete: () => void
 * }} props
 */
export function EditExpenseModal({ expense, onSave, onCancel, onDelete }) {
  const [amount, setAmount] = useState(expense.amount);
  const [merchant, setMerchant] = useState(expense.merchant);
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(formatDateForInput(expense.date));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleSave = () => {
    onSave({
      amount: Number(amount),
      merchant,
      category,
      date: new Date(date).toISOString()
    });
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Expense</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-field">
            <label>Amount</label>
            <div className="amount-input">
              <span className="currency">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
          </div>

          <div className="form-field">
            <label>Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Merchant name"
            />
          </div>

          <div className="form-field">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-field readonly">
            <label>Source</label>
            <div className="readonly-value">{expense.source}</div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className={`btn-delete ${showDeleteConfirm ? 'confirm' : ''}`}
            onClick={handleDelete}
          >
            {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
          </button>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
