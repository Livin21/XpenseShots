import { createWorker } from 'tesseract.js';

let worker = null;

/**
 * Initialize Tesseract worker
 */
async function initWorker(onProgress) {
  if (worker) return worker;

  worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    }
  });

  return worker;
}

/**
 * Perform OCR on image
 * @param {Blob} imageBlob - Preprocessed image blob
 * @param {Function} onProgress - Progress callback (0-1)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function recognizeText(imageBlob, onProgress) {
  const w = await initWorker(onProgress);

  const { data } = await w.recognize(imageBlob);

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
    await worker.terminate();
    worker = null;
  }
}
