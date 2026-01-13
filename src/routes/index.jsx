import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Copy, Loader2, ImagePlus, MessageSquareText, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UploadDropzone } from '../components/UploadDropzone.jsx';
import { ExpenseCard } from '../components/ExpenseCard.jsx';
import { ExpenseList } from '../components/ExpenseList.jsx';
import { ConfidenceReview } from '../components/ConfidenceReview.jsx';
import { EditExpenseModal } from '../components/EditExpenseModal.jsx';
import { useOcr } from '../hooks/useOcr.js';
import { useParseExpense } from '../hooks/useParseExpense.js';
import { useExpenses } from '../hooks/useExpenses.js';
import { parseBankSms } from '../parser/banksms.js';

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Utilities',
  'Subscriptions',
  'Shopping',
  'Transport',
  'Entertainment',
  'Health',
  'Miscellaneous',
];

/**
 * Generate a simple hash from text
 */
async function generateHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Format date for input[type="date"]
 */
function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Home route - Upload + Recent Expenses
 */
export function HomePage() {
  const { status, progress, text, imageHash, error, processImage, reset } = useOcr();
  const { expense, needsReview } = useParseExpense(text, imageHash);
  const { expenses, add, update, remove, exists, refresh } = useExpenses({ recent: true, limit: 5 });
  const [showReview, setShowReview] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // Input mode: 'screenshot' | 'sms' | 'manual'
  const [inputMode, setInputMode] = useState('screenshot');

  // SMS input state
  const [smsText, setSmsText] = useState('');
  const [smsExpense, setSmsExpense] = useState(null);
  const [smsError, setSmsError] = useState(null);
  const [smsNeedsReview, setSmsNeedsReview] = useState(false);

  // Manual entry state
  const [manualAmount, setManualAmount] = useState('');
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualCategory, setManualCategory] = useState('Food & Dining');
  const [manualDate, setManualDate] = useState(formatDateForInput(new Date()));
  const [manualExpense, setManualExpense] = useState(null);
  const [manualError, setManualError] = useState(null);

  // Auto-save high confidence expenses (screenshot mode)
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
    setSmsNeedsReview(false);
  }, [add, exists]);

  const handleCancelReview = useCallback(() => {
    setShowReview(false);
    setSmsNeedsReview(false);
    reset();
    setSaveStatus(null);
    setSmsExpense(null);
  }, [reset]);

  const handleReset = useCallback(() => {
    reset();
    setSaveStatus(null);
    setShowReview(false);
    setSmsText('');
    setSmsExpense(null);
    setSmsError(null);
    setSmsNeedsReview(false);
    setManualAmount('');
    setManualMerchant('');
    setManualCategory('Food & Dining');
    setManualDate(formatDateForInput(new Date()));
    setManualExpense(null);
    setManualError(null);
  }, [reset]);

  // Handle SMS paste/parse
  const handleParseSms = useCallback(async () => {
    if (!smsText.trim()) return;

    setSmsError(null);
    setSmsExpense(null);
    setSmsNeedsReview(false);
    setSaveStatus(null);

    try {
      const parsed = parseBankSms(smsText);

      if (!parsed) {
        setSmsError('Could not extract expense from this SMS. Make sure it\'s a valid bank transaction SMS.');
        return;
      }

      // Generate hash for deduplication
      const hash = await generateHash(smsText);
      const expenseWithId = { ...parsed, id: hash };

      setSmsExpense(expenseWithId);

      // Check confidence
      if (parsed.confidence < 0.75) {
        setSmsNeedsReview(true);
      } else {
        // Auto-save
        setSaveStatus('saving');
        const isDuplicate = await exists(hash);
        if (isDuplicate) {
          setSaveStatus('duplicate');
        } else {
          await add(expenseWithId);
          setSaveStatus('saved');
        }
      }
    } catch (err) {
      setSmsError('Failed to parse SMS: ' + err.message);
    }
  }, [smsText, add, exists]);

  // Handle manual expense entry
  const handleManualSubmit = useCallback(async () => {
    setManualError(null);
    setManualExpense(null);
    setSaveStatus(null);

    // Validation
    const amount = parseFloat(manualAmount);
    if (!amount || amount <= 0) {
      setManualError('Please enter a valid amount');
      return;
    }
    if (!manualMerchant.trim()) {
      setManualError('Please enter a merchant name');
      return;
    }

    try {
      // Create expense object
      const expenseData = {
        amount,
        currency: 'INR',
        merchant: manualMerchant.trim(),
        category: manualCategory,
        date: new Date(manualDate).toISOString(),
        source: 'Manual',
        confidence: 1,
        rawText: '',
      };

      // Generate hash for deduplication
      const hashInput = `${amount}-${manualMerchant}-${manualDate}-${Date.now()}`;
      const hash = await generateHash(hashInput);
      const expenseWithId = { ...expenseData, id: hash };

      setManualExpense(expenseWithId);

      // Save directly (manual entries are always high confidence)
      setSaveStatus('saving');
      await add(expenseWithId);
      setSaveStatus('saved');
    } catch (err) {
      setManualError('Failed to save expense: ' + err.message);
    }
  }, [manualAmount, manualMerchant, manualCategory, manualDate, add]);

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

  // Current expense based on mode
  const currentExpense = inputMode === 'screenshot' ? expense : inputMode === 'sms' ? smsExpense : manualExpense;
  const currentNeedsReview = inputMode === 'screenshot' ? (showReview && expense) : inputMode === 'sms' ? smsNeedsReview : false;

  return (
    <div className="space-y-8">
      {/* Input Mode Tabs */}
      <div className="flex rounded-lg border border-border bg-card p-1 gap-1">
        <button
          onClick={() => { setInputMode('screenshot'); handleReset(); }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
            inputMode === 'screenshot'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <ImagePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Screenshot</span>
        </button>
        <button
          onClick={() => { setInputMode('sms'); handleReset(); }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
            inputMode === 'sms'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <MessageSquareText className="w-4 h-4" />
          <span className="hidden sm:inline">Bank SMS</span>
        </button>
        <button
          onClick={() => { setInputMode('manual'); handleReset(); }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
            inputMode === 'manual'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <PenLine className="w-4 h-4" />
          <span className="hidden sm:inline">Manual</span>
        </button>
      </div>

      {/* Upload Section */}
      <section className="space-y-4">
        {/* Screenshot Mode */}
        {inputMode === 'screenshot' && (
          <>
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
                    Try a GPay, Swiggy, Zomato, Instamart receipt, or Bank SMS.
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Try Another
                </Button>
              </div>
            )}
          </>
        )}

        {/* SMS Mode */}
        {inputMode === 'sms' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Paste Bank SMS
                </label>
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="INR 2,664.00 spent using ICICI Bank Card XX9006 on 11-Jan-26 on AMAZON PAY..."
                  className={cn(
                    'w-full min-h-[120px] rounded-lg border border-border bg-secondary/50 px-4 py-3',
                    'text-sm text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                    'resize-none'
                  )}
                />
              </div>
              <Button
                onClick={handleParseSms}
                disabled={!smsText.trim()}
                className="w-full"
              >
                Parse SMS
              </Button>
            </div>

            {/* SMS Error */}
            {smsError && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 space-y-3 animate-slide-up">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-sm text-destructive">{smsError}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSmsError(null); setSmsText(''); }}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Manual Mode */}
        {inputMode === 'manual' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="pl-10 text-xl font-bold h-12"
                  />
                </div>
              </div>

              {/* Merchant */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Merchant
                </label>
                <Input
                  type="text"
                  value={manualMerchant}
                  onChange={(e) => setManualMerchant(e.target.value)}
                  placeholder="Where did you spend?"
                />
              </div>

              {/* Category & Date Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className={cn(
                      'flex h-11 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2',
                      'text-sm text-foreground transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
                    )}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={!manualAmount || !manualMerchant.trim()}
                className="w-full"
              >
                Add Expense
              </Button>
            </div>

            {/* Manual Error */}
            {manualError && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 space-y-3 animate-slide-up">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-sm text-destructive">{manualError}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setManualError(null)}>
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Review UI (both modes) */}
        {currentNeedsReview && currentExpense && (
          <ConfidenceReview
            expense={currentExpense}
            onConfirm={handleConfirmReview}
            onCancel={handleCancelReview}
          />
        )}

        {/* Success Preview (both modes) */}
        {currentExpense && !currentNeedsReview && saveStatus && (
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
                <ExpenseCard expense={currentExpense} showConfidence />
                <Button variant="outline" onClick={handleReset} className="w-full">
                  Add Another
                </Button>
              </>
            )}

            {saveStatus === 'duplicate' && (
              <>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Copy className="w-5 h-5" />
                  <span className="text-sm font-medium">This SMS was already added</span>
                </div>
                <ExpenseCard expense={currentExpense} />
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
          emptyMessage="No expenses yet. Upload a screenshot or paste a bank SMS to get started!"
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
