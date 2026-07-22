export function LoadingState({ label = 'Loading data...' }) {
  return <p className="runtime-state text-sm">{label}</p>;
}

export function EmptyState({ message = 'No data is available yet.' }) {
  return <p className="runtime-state text-sm">{message}</p>;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="runtime-state runtime-state--error text-sm">
      <p>{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="runtime-retry">
          Try again
        </button>
      )}
    </div>
  );
}
