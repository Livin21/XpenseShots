import { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="border-yellow-500/50 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-base">Review Required</CardTitle>
          </div>
          <Badge variant="warning" className="text-xs">
            {Math.round(expense.confidence * 100)}% confident
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₹
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="0"
              step="0.01"
              className="pl-8 text-lg font-semibold"
            />
          </div>
        </div>

        {/* Merchant input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Merchant
          </label>
          <Input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
        </div>

        {/* Read-only info */}
        <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Category</span>
            <span className="font-medium">{expense.category}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Source</span>
            <span className="font-medium">{expense.source}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            className="flex-[2]"
            onClick={handleConfirm}
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm & Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
