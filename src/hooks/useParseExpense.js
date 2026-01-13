import { useMemo } from 'react';
import { parseExpenseFromOcr } from '../parser/index.js';

/**
 * Hook to parse expense from OCR text
 * @param {string | null} ocrText - Raw OCR text
 * @param {string | null} imageHash - Image hash for deduplication
 * @returns {{
 *   expense: import('../parser/types.js').ParsedExpense | null,
 *   needsReview: boolean
 * }}
 */
export function useParseExpense(ocrText, imageHash) {
  const result = useMemo(() => {
    if (!ocrText) {
      return { expense: null, needsReview: false };
    }

    const parsed = parseExpenseFromOcr(ocrText);

    if (!parsed) {
      return { expense: null, needsReview: false };
    }

    // Add image hash as id for deduplication
    const expense = {
      ...parsed,
      id: imageHash
    };

    return {
      expense,
      needsReview: parsed.confidence < 0.75
    };
  }, [ocrText, imageHash]);

  return result;
}
