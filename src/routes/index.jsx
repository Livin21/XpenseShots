import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
    <div className="space-y-8">
      {/* Upload Section */}
      <section className="space-y-4">
        <UploadDropzone
          onFileSelect={handleFileSelect}
          disabled={isProcessing}
        />

        {/* Processing State */}
        {isProcessing && (
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm font-medium text-foreground">
                {status === 'preprocessing' ? 'Preparing image...' : 'Recognizing text...'}
              </span>
              <span className="ml-auto text-sm text-muted-foreground">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <Progress value={progress * 100} />
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 space-y-3 animate-slide-up">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        )}

        {/* Parse Failed */}
        {status === 'done' && !expense && (
          <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-3 animate-slide-up">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-yellow-200">
                Could not extract expense from this screenshot.
                Try a GPay, Swiggy, Zomato, or Instamart receipt.
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Try Another
            </Button>
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
          <div className="space-y-4 animate-slide-up">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Saving...</span>
              </div>
            )}

            {saveStatus === 'saved' && (
              <>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Expense saved!</span>
                </div>
                <ExpenseCard expense={expense} showConfidence />
                <Button variant="outline" onClick={handleReset} className="w-full">
                  Add Another
                </Button>
              </>
            )}

            {saveStatus === 'duplicate' && (
              <>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Copy className="w-5 h-5" />
                  <span className="text-sm font-medium">This receipt was already added</span>
                </div>
                <ExpenseCard expense={expense} />
                <Button variant="outline" onClick={handleReset} className="w-full">
                  Add Another
                </Button>
              </>
            )}
          </div>
        )}
      </section>

      {/* Recent Expenses */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Expenses</h2>
        <ExpenseList
          expenses={expenses}
          emptyMessage="No expenses yet. Upload a screenshot to get started!"
          compact
          onEditExpense={handleEditExpense}
        />
      </section>

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
