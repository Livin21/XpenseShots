import { useState, useCallback, useRef } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Upload dropzone component
 * @param {{ onFileSelect: (file: File) => void, disabled?: boolean }} props
 */
export function UploadDropzone({ onFileSelect, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  }, [disabled, onFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
    // Reset input
    e.target.value = '';
  }, [onFileSelect]);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300',
        'bg-card/50 hover:bg-card',
        isDragging && 'border-primary bg-primary/5 scale-[1.02]',
        !isDragging && 'border-border hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center py-12 px-6">
        {/* Animated icon container */}
        <div className={cn(
          'relative mb-6 transition-transform duration-300',
          isDragging ? 'scale-110' : 'group-hover:scale-105'
        )}>
          {/* Background glow */}
          <div className={cn(
            'absolute inset-0 rounded-full bg-primary/20 blur-xl transition-opacity duration-300',
            isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
          )} />

          {/* Icon circle */}
          <div className={cn(
            'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300',
            'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20',
            isDragging && 'from-primary/30 to-primary/10 border-primary/40'
          )}>
            {disabled ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <ImagePlus className={cn(
                'w-8 h-8 text-primary transition-transform duration-300',
                isDragging && 'scale-110'
              )} />
            )}
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">
            {disabled ? 'Processing...' : 'Upload Receipt Screenshot'}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {disabled
              ? 'Please wait while we extract expense details'
              : 'Drop an image here or tap to select from gallery'
            }
          </p>
        </div>

        {/* Supported sources */}
        {!disabled && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <span className="text-xs text-muted-foreground">Supports:</span>
            <div className="flex flex-wrap justify-center gap-1">
              {['GPay', 'Swiggy', 'Zomato', 'Instamart', 'Bank SMS'].map((source) => (
                <span
                  key={source}
                  className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Corner decorations */}
      <div className={cn(
        'absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg transition-colors duration-300',
        isDragging ? 'border-primary' : 'border-border group-hover:border-primary/50'
      )} />
      <div className={cn(
        'absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg transition-colors duration-300',
        isDragging ? 'border-primary' : 'border-border group-hover:border-primary/50'
      )} />
      <div className={cn(
        'absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg transition-colors duration-300',
        isDragging ? 'border-primary' : 'border-border group-hover:border-primary/50'
      )} />
      <div className={cn(
        'absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 rounded-br-lg transition-colors duration-300',
        isDragging ? 'border-primary' : 'border-border group-hover:border-primary/50'
      )} />
    </div>
  );
}
