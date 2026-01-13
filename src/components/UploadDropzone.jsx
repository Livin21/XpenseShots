import { useState, useCallback, useRef } from 'react';

/**
 * Upload dropzone component
 * @param {{ onFileSelect: (file: File) => void, disabled?: boolean }} props
 */
export function UploadDropzone({ onFileSelect, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect, disabled]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [onFileSelect]);

  return (
    <div
      className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div className="upload-icon">📸</div>
      <div className="upload-text">
        {isDragging ? 'Drop screenshot here' : 'Tap or drop screenshot'}
      </div>
      <div className="upload-hint">
        Supports GPay, Swiggy, Zomato, Instamart
      </div>
    </div>
  );
}
