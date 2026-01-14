import { useState, useEffect } from 'react';
import { X, Trash2, Save, Store, Calendar, Tag, CreditCard, Plus, Share2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '../hooks/useCategories.js';

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
  const { categories } = useCategories();
  const [amount, setAmount] = useState(expense.amount);
  const [merchant, setMerchant] = useState(expense.merchant);
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(formatDateForInput(expense.date));
  const [tags, setTags] = useState(expense.tags || []);
  const [newTag, setNewTag] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Split state
  const [splitEnabled, setSplitEnabled] = useState(expense.split?.enabled || false);
  const [splitPeople, setSplitPeople] = useState(expense.split?.people || []);
  const [newPersonName, setNewPersonName] = useState('');

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
    const updates = {
      amount: Number(amount),
      merchant,
      category,
      date: new Date(date).toISOString(),
      tags: tags.length > 0 ? tags : undefined,
    };

    if (splitEnabled && splitPeople.length > 0) {
      updates.split = {
        enabled: true,
        people: splitPeople,
      };
    } else {
      updates.split = undefined;
    }

    onSave(updates);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddPerson = () => {
    const name = newPersonName.trim();
    if (name && !splitPeople.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      const equalShare = Number(amount) / (splitPeople.length + 1);
      // Recalculate shares equally
      const newPeople = [...splitPeople, { name, share: equalShare, paid: false }];
      const perPerson = Number(amount) / newPeople.length;
      setSplitPeople(newPeople.map(p => ({ ...p, share: Math.round(perPerson * 100) / 100 })));
      setNewPersonName('');
    }
  };

  const handleRemovePerson = (name) => {
    const newPeople = splitPeople.filter(p => p.name !== name);
    if (newPeople.length > 0) {
      const perPerson = Number(amount) / newPeople.length;
      setSplitPeople(newPeople.map(p => ({ ...p, share: Math.round(perPerson * 100) / 100 })));
    } else {
      setSplitPeople([]);
    }
  };

  const handleShareExpense = () => {
    const shareData = {
      a: amount,
      m: merchant,
      c: category,
      d: date,
      t: tags.join(','),
      s: splitPeople.map(p => `${p.name}:${p.share}`).join(','),
    };

    const params = new URLSearchParams();
    Object.entries(shareData).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });

    const url = `${window.location.origin}?import=${encodeURIComponent(params.toString())}`;

    navigator.clipboard.writeText(url).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this share link:', url);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-card">
          <h2 className="text-xl font-bold text-foreground">Edit Expense</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 rounded-full hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
                className="pl-10 text-2xl font-bold h-14"
              />
            </div>
          </div>

          {/* Merchant */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              Merchant
            </label>
            <Input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Merchant name"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(
                'flex h-11 w-full rounded-lg border border-border bg-secondary/50 px-4 py-2',
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
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 px-2 py-1">
                  #{tag}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag (e.g., trip, office)"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1"
              />
              <Button type="button" size="icon" variant="outline" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Split Expense */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Split Expense
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={splitEnabled}
                onClick={() => {
                  const newEnabled = !splitEnabled;
                  setSplitEnabled(newEnabled);
                  // Add "You" as first person when enabling split
                  if (newEnabled && splitPeople.length === 0) {
                    setSplitPeople([{ name: 'You', share: Number(amount), paid: true }]);
                  }
                }}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
                  splitEnabled ? 'bg-primary' : 'bg-secondary'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                    splitEnabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {splitEnabled && (
              <div className="space-y-3">
                {/* Add person */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="Person's name"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPerson())}
                    className="flex-1"
                  />
                  <Button type="button" size="icon" variant="outline" onClick={handleAddPerson}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* People list */}
                {splitPeople.length > 0 && (
                  <div className="space-y-2">
                    {splitPeople.map((person) => (
                      <div key={person.name} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                        <span className="flex-1 text-sm text-foreground">{person.name}</span>
                        <span className="text-sm font-medium text-muted-foreground">
                          ₹{person.share.toFixed(2)}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleRemovePerson(person.name)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Share button */}
                {splitPeople.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleShareExpense}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Share Link
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Source (Read-only) */}
          <div className="rounded-lg bg-secondary/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Source</span>
              <Badge variant="secondary">{expense.source}</Badge>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between p-6 border-t border-border bg-card">
          <Button
            variant={showDeleteConfirm ? 'destructive' : 'ghost'}
            onClick={handleDelete}
            className={cn(
              'transition-all duration-200',
              showDeleteConfirm && 'animate-pulse'
            )}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
