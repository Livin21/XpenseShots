import { useState, useCallback, useEffect } from 'react';
import { UploadDropzone } from '../components/UploadDropzone.jsx';
import { ExpenseCard } from '../components/ExpenseCard.jsx';
import { ExpenseList } from '../components/ExpenseList.jsx';
import { ConfidenceReview } from '../components/ConfidenceReview.jsx';
import { EditExpenseModal } from '../components/EditExpenseModal.jsx';
import { useOcr } from '../hooks/useOcr.js';
import { useParseExpense } from '../hooks/useParseExpense.js';
import { useExpenses } from '../hooks/useExpenses.js';

/**
 * Home route - Upload + Recent Expenses
 */
export function HomePage() {
  const { status, progress, text, imageHash, error, processImage, reset } = useOcr();
  const { expense, needsReview } = useParseExpense(text, imageHash);
  const { expenses, add, update, remove, exists, refresh } = useExpenses({ recent: true, limit: 5 });
  const [showReview, setShowReview] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | 'duplicate' | 'error'
  const [editingExpense, setEditingExpense] = useState(null);

  // Auto-save high confidence expenses
  useEffect(() => {
    async function autoSave() {
      if (expense && !needsReview && status === 'done') {
        setSaveStatus('saving');
        const isDuplicate = await exists(expense.id);
        if (isDuplicate) {
          setSaveStatus('duplicate');
        } else {
          await add(expense);
          setSaveStatus('saved');
        }
      } else if (expense && needsReview && status === 'done') {
        setShowReview(true);
      }
    }
    autoSave();
  }, [expense, needsReview, status, add, exists]);

  const handleFileSelect = useCallback((file) => {
    reset();
    setSaveStatus(null);
    setShowReview(false);
    processImage(file);
  }, [processImage, reset]);

  const handleConfirmReview = useCallback(async (updatedExpense) => {
    setSaveStatus('saving');
    const isDuplicate = await exists(updatedExpense.id);
    if (isDuplicate) {
      setSaveStatus('duplicate');
    } else {
      await add(updatedExpense);
      setSaveStatus('saved');
    }
    setShowReview(false);
  }, [add, exists]);

  const handleCancelReview = useCallback(() => {
    setShowReview(false);
    reset();
    setSaveStatus(null);
  }, [reset]);

  const handleReset = useCallback(() => {
    reset();
    setSaveStatus(null);
    setShowReview(false);
  }, [reset]);

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
  };

  const handleSaveExpense = async (updates) => {
    if (editingExpense) {
      await update(editingExpense.id, updates);
      setEditingExpense(null);
    }
  };

  const handleDeleteExpense = async () => {
    if (editingExpense) {
      await remove(editingExpense.id);
      setEditingExpense(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  const isProcessing = status === 'preprocessing' || status === 'recognizing';

  return (
    <div className="home-page">
      <div className="upload-section">
        <UploadDropzone
          onFileSelect={handleFileSelect}
          disabled={isProcessing}
        />

        {/* Processing State */}
        {isProcessing && (
          <div className="processing-status">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="progress-text">
              {status === 'preprocessing' ? 'Preparing image...' : `Recognizing text... ${Math.round(progress * 100)}%`}
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="error-message">
            <div className="error-text">{error}</div>
            <button className="btn-retry" onClick={handleReset}>Try Again</button>
          </div>
        )}

        {/* Parse Failed */}
        {status === 'done' && !expense && (
          <div className="parse-failed">
            <div className="parse-failed-text">
              Could not extract expense from this screenshot.
              Try a GPay, Swiggy, Zomato, or Instamart receipt.
            </div>
            <button className="btn-retry" onClick={handleReset}>Try Another</button>
          </div>
        )}

        {/* Review UI */}
        {showReview && expense && (
          <ConfidenceReview
            expense={expense}
            onConfirm={handleConfirmReview}
            onCancel={handleCancelReview}
          />
        )}

        {/* Success Preview */}
        {expense && !showReview && saveStatus && (
          <div className="save-result">
            {saveStatus === 'saving' && (
              <div className="saving-text">Saving...</div>
            )}
            {saveStatus === 'saved' && (
              <>
                <div className="saved-text">Expense saved!</div>
                <ExpenseCard expense={expense} showConfidence />
                <button className="btn-add-another" onClick={handleReset}>Add Another</button>
              </>
            )}
            {saveStatus === 'duplicate' && (
              <>
                <div className="duplicate-text">This receipt was already added</div>
                <ExpenseCard expense={expense} />
                <button className="btn-add-another" onClick={handleReset}>Add Another</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Recent Expenses */}
      <div className="recent-section">
        <h2 className="section-title">Recent Expenses</h2>
        <ExpenseList
          expenses={expenses}
          emptyMessage="No expenses yet. Upload a screenshot to get started!"
          compact
          onEditExpense={handleEditExpense}
        />
      </div>

      {/* Edit Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onSave={handleSaveExpense}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteExpense}
        />
      )}
    </div>
  );
}
