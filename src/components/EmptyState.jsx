import { Receipt, Shield, Wifi, Cloud } from 'lucide-react';

/**
 * Empty state component
 * @param {{ message?: string, showPrivacy?: boolean }} props
 */
export function EmptyState({
  message = 'Upload your first screenshot',
  showPrivacy = true
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
        <div className="relative w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
          <Receipt className="w-7 h-7 text-muted-foreground" />
        </div>
      </div>

      {/* Message */}
      <p className="text-lg text-muted-foreground mb-6 max-w-xs">
        {message}
      </p>

      {/* Privacy notices */}
      {showPrivacy && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>All data stays on your device</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wifi className="w-4 h-4 text-primary" />
            <span>Works completely offline</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="w-4 h-4 text-primary line-through opacity-50" />
            <span>No cloud servers involved</span>
          </div>
        </div>
      )}
    </div>
  );
}
