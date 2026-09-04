export function LoadingState({ label = 'Memuat data...' }) {
  return (
    <p className="runtime-state text-sm" role="status" aria-live="polite">
      {label}
    </p>
  );
}

export function EmptyState({ message = 'Belum ada data yang tersedia.' }) {
  return <p className="runtime-state text-sm" role="status">{message}</p>;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="runtime-state runtime-state--error text-sm" role="alert">
      <p>{error?.message || 'Terjadi kendala saat memuat data.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="runtime-retry">
          Coba lagi
        </button>
      )}
    </div>
  );
}
