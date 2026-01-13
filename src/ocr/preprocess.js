const MAX_WIDTH = 1200;

/**
 * Preprocess image for OCR
 * - Resize to max width
 * - Convert to grayscale
 * - Increase contrast
 * @param {File | Blob} imageFile - Image file to process
 * @returns {Promise<Blob>} Processed image blob
 */
export async function preprocessImage(imageFile) {
  const bitmap = await createImageBitmap(imageFile);

  // Calculate new dimensions
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > MAX_WIDTH) {
    height = Math.round((height * MAX_WIDTH) / width);
    width = MAX_WIDTH;
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

  // Convert to grayscale and increase contrast
  for (let i = 0; i < data.length; i += 4) {
    // Grayscale using luminance formula
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Increase contrast (factor of 1.5)
    const contrast = 1.5;
    const adjusted = ((gray - 128) * contrast) + 128;
    const final = Math.max(0, Math.min(255, adjusted));

    data[i] = final;     // R
    data[i + 1] = final; // G
    data[i + 2] = final; // B
    // Alpha stays the same
  }

  ctx.putImageData(imageData, 0, 0);

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
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
