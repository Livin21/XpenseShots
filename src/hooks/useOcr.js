import { useState, useCallback } from 'react';
import { preprocessImage, hashImage } from '../ocr/preprocess.js';
import { recognizeText } from '../ocr/worker.js';

/**
 * @typedef {'idle' | 'preprocessing' | 'recognizing' | 'done' | 'error'} OcrStatus
 */

/**
 * Hook for OCR processing
 * @returns {{
 *   status: OcrStatus,
 *   progress: number,
 *   text: string | null,
 *   confidence: number | null,
 *   imageHash: string | null,
 *   error: string | null,
 *   processImage: (file: File) => Promise<void>,
 *   reset: () => void
 * }}
 */
export function useOcr() {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [imageHash, setImageHash] = useState(null);
  const [error, setError] = useState(null);

  const processImage = useCallback(async (file) => {
    try {
      setStatus('preprocessing');
      setProgress(0);
      setError(null);

      // Hash original image for deduplication
      const hash = await hashImage(file);
      setImageHash(hash);

      // Preprocess image
      const processedBlob = await preprocessImage(file);

      setStatus('recognizing');

      // Run OCR
      const result = await recognizeText(processedBlob, (p) => {
        setProgress(p);
      });

      setText(result.text);
      setConfidence(result.confidence);
      setStatus('done');
    } catch (err) {
      setError(err.message || 'OCR failed');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setText(null);
    setConfidence(null);
    setImageHash(null);
    setError(null);
  }, []);

  return {
    status,
    progress,
    text,
    confidence,
    imageHash,
    error,
    processImage,
    reset
  };
}
