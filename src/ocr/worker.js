import { createWorker } from 'tesseract.js';

const DEBUG = import.meta.env.DEV;

function log(...args) {
  if (DEBUG) console.log('[OCR]', ...args);
}

let worker = null;

/**
 * Initialize Tesseract worker
 */
async function initWorker(onProgress) {
  if (worker) {
    log('Reusing existing worker');
    return worker;
  }

  log('Initializing Tesseract worker...');

  worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (DEBUG && m.status) {
        log('Status:', m.status, m.progress ? `(${Math.round(m.progress * 100)}%)` : '');
      }
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    }
  });

  log('Worker initialized');
  return worker;
}

/**
 * Perform OCR on image
 * @param {Blob} imageBlob - Preprocessed image blob
 * @param {Function} onProgress - Progress callback (0-1)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function recognizeText(imageBlob, onProgress) {
  log('Starting OCR, blob size:', imageBlob.size);

  const w = await initWorker(onProgress);

  // Set parameters for better recognition of receipts
  await w.setParameters({
    // PSM 6 = Assume a single uniform block of text (good for receipts)
    tessedit_pageseg_mode: '6',
    // Whitelist characters to reduce misrecognition
    // Includes digits, letters, currency symbols, and common punctuation
    tessedit_char_whitelist: '0123456789₹.,:-@/\\()[]{}abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ',
  });

  const startTime = performance.now();
  const { data } = await w.recognize(imageBlob);
  const duration = performance.now() - startTime;

  log('OCR completed in', Math.round(duration), 'ms');
  log('Confidence:', data.confidence);
  log('Text length:', data.text.length, 'characters');

  if (DEBUG) {
    console.log('[OCR] ========== RAW TEXT START ==========');
    console.log(data.text);
    console.log('[OCR] ========== RAW TEXT END ==========');
  }

  return {
    text: data.text,
    confidence: data.confidence / 100 // Normalize to 0-1
  };
}

/**
 * Terminate worker to free resources
 */
export async function terminateWorker() {
  if (worker) {
    log('Terminating worker');
    await worker.terminate();
    worker = null;
  }
}
