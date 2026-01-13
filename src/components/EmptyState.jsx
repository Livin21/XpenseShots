/**
 * Empty state component
 * @param {{ message?: string, showPrivacy?: boolean }} props
 */
export function EmptyState({
  message = 'Upload your first screenshot',
  showPrivacy = true
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📝</div>
      <div className="empty-message">{message}</div>
      {showPrivacy && (
        <div className="privacy-notice">
          <div className="privacy-item">🔒 All data stays on your device</div>
          <div className="privacy-item">📴 Works offline</div>
          <div className="privacy-item">🚫 No servers involved</div>
        </div>
      )}
    </div>
  );
}
