const MAX_WIDTH = 1200;
const DEBUG = import.meta.env.DEV;

function log(...args) {
  if (DEBUG) console.log('[Preprocess]', ...args);
}

/**
 * Check if image is predominantly dark (dark mode screenshot)
 * @param {Uint8ClampedArray} data - Image data
 * @returns {boolean}
 */
function isDarkImage(data) {
  let totalBrightness = 0;
  const pixelCount = data.length / 4;

  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalBrightness += (r + g + b) / 3;
  }

  const avgBrightness = totalBrightness / (pixelCount / 10);
  log('Average brightness:', avgBrightness.toFixed(2));
  return avgBrightness < 128; // Dark if average brightness < 128
}

/**
 * Preprocess image for OCR
 * - Resize to max width
 * - Detect dark mode and invert if needed
 * - Convert to grayscale
 * - Apply adaptive thresholding for better OCR
 * @param {File | Blob} imageFile - Image file to process
 * @returns {Promise<Blob>} Processed image blob
 */
export async function preprocessImage(imageFile) {
  log('Starting preprocessing, file size:', imageFile.size);

  const bitmap = await createImageBitmap(imageFile);
  log('Original dimensions:', bitmap.width, 'x', bitmap.height);

  // Calculate new dimensions
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > MAX_WIDTH) {
    height = Math.round((height * MAX_WIDTH) / width);
    width = MAX_WIDTH;
    log('Resized to:', width, 'x', height);
  }

  // Create canvas and draw
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Get image data for processing
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Check if dark mode screenshot
  const isDark = isDarkImage(data);
  log('Dark mode detected:', isDark);

  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let final;
    if (isDark) {
      // For dark mode: MINIMAL processing - just invert
      // Use max channel to capture colored text (green amounts, etc.)
      const max = Math.max(r, g, b);
      // Simple inversion - no contrast, no thresholding
      // This preserves the original text shapes better for OCR
      final = 255 - max;
    } else {
      // For light mode: standard grayscale with contrast and thresholding
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Apply contrast enhancement
      const contrast = 1.8;
      let adjusted = ((gray - 128) * contrast) + 128;
      adjusted = Math.max(0, Math.min(255, adjusted));

      // Apply thresholding
      final = adjusted > 180 ? 255 : (adjusted < 75 ? 0 : adjusted);
    }

    data[i] = final;     // R
    data[i + 1] = final; // G
    data[i + 2] = final; // B
    // Alpha stays the same
  }

  ctx.putImageData(imageData, 0, 0);
  log('Preprocessing complete');

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

/**
 * Generate SHA-256 hash of image for deduplication
 * @param {File | Blob} imageFile - Image file to hash
 * @returns {Promise<string>} Hex hash string
 */
export async function hashImage(imageFile) {
  const buffer = await imageFile.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  log('Image hash:', hash.substring(0, 16) + '...');
  return hash;
}
