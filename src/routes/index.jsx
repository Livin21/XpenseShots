import { useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Copy, Loader2, ImagePlus, MessageSquareText, PenLine, Download, Wifi, WifiOff } from 'lucide-react';
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
import { useCategories } from '../hooks/useCategories.js';
import { parseBankSms } from '../parser/banksms.js';
import { preloadOcr, isOcrReady } from '../ocr/worker.js';

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
  const { categories } = useCategories();
  const [showReview, setShowReview] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // OCR preload state
  const [ocrReady, setOcrReady] = useState(isOcrReady());
  const [ocrPreloadProgress, setOcrPreloadProgress] = useState(0);
  const preloadStarted = useRef(false);

  // Preload OCR on mount
  useEffect(() => {
    if (preloadStarted.current) return;
    preloadStarted.current = true;

    if (isOcrReady()) {
      setOcrReady(true);
      setOcrPreloadProgress(1);
      return;
    }

    preloadOcr((progress) => {
      setOcrPreloadProgress(progress);
    }).then(() => {
      setOcrReady(true);
    }).catch((err) => {
      console.error('OCR preload failed:', err);
    });
  }, []);

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

  // Shared expense import state
  const [importedExpense, setImportedExpense] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Handle shared expense import from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('import');

    if (importData) {
      try {
        const data = new URLSearchParams(decodeURIComponent(importData));
        const sharedExpense = {
          amount: parseFloat(data.get('a')) || 0,
          merchant: data.get('m') || 'Unknown',
          category: data.get('c') || 'Miscellaneous',
          date: data.get('d') || new Date().toISOString().split('T')[0],
          tags: data.get('t') ? data.get('t').split(',').filter(Boolean) : [],
          split: data.get('s') ? {
            enabled: true,
            people: data.get('s').split(',').map(p => {
              const [name, share] = p.split(':');
              return { name, share: parseFloat(share) || 0, paid: false };
            }),
          } : undefined,
          source: 'Shared',
          confidence: 1,
          currency: 'INR',
        };

        if (sharedExpense.amount > 0) {
          setImportedExpense(sharedExpense);
          setShowImportModal(true);
          // Clear the URL without reload
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (err) {
        console.error('Failed to parse shared expense:', err);
      }
    }
  }, []);

  // Handle importing shared expense
  const handleImportExpense = useCallback(async () => {
    if (!importedExpense) return;

    try {
      const hashInput = `shared-${importedExpense.amount}-${importedExpense.merchant}-${Date.now()}`;
      const hash = await generateHash(hashInput);
      const expenseWithId = {
        ...importedExpense,
        id: hash,
        date: new Date(importedExpense.date).toISOString(),
        createdAt: new Date().toISOString(),
      };

      await add(expenseWithId);
      setShowImportModal(false);
      setImportedExpense(null);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to import expense:', err);
    }
  }, [importedExpense, add]);

  const handleCancelImport = useCallback(() => {
    setShowImportModal(false);
    setImportedExpense(null);
  }, []);

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

            {/* OCR Preload Status */}
            {!ocrReady && (
              <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    Loading OCR engine for offline use...
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {Math.round(ocrPreloadProgress * 100)}%
                  </span>
                </div>
                <Progress value={ocrPreloadProgress * 100} className="h-1" />
              </div>
            )}

            {ocrReady && status === 'idle' && !saveStatus && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <WifiOff className="w-3.5 h-3.5 text-green-500" />
                <span>Ready for offline use</span>
              </div>
            )}

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
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
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
                    className="h-11 w-full"
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

      {/* Import Shared Expense Modal */}
      {showImportModal && importedExpense && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={handleCancelImport}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Import Shared Expense
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Someone shared this expense with you
              </p>
            </div>
            <div className="p-6">
              <ExpenseCard expense={importedExpense} />
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <Button variant="outline" onClick={handleCancelImport} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleImportExpense} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Add to My Expenses
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
