interface ConnectionStatusProps {
  connected: boolean;
  loading: boolean;
  error?: string;
  onRetry: () => void;
}

export function ConnectionStatus({ connected, loading, error, onRetry }: ConnectionStatusProps) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-warm-100 text-warm-600 rounded-full text-sm font-medium">
        <span className="inline-block w-2 h-2 bg-warm-400 rounded-full animate-pulse" />
        Connecting...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-danger-50 text-danger-700 rounded-full text-sm font-medium">
          <span className="inline-block w-2 h-2 bg-danger-500 rounded-full" />
          Error
        </div>
        <button
          onClick={onRetry}
          className="text-sm text-accent-600 hover:text-accent-700 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success-100 text-success-700 rounded-full text-sm font-medium">
        <span className="inline-block w-2 h-2 bg-success-500 rounded-full animate-pulse" />
        Connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-caution-100 text-caution-700 rounded-full text-sm font-medium">
        <span className="inline-block w-2 h-2 bg-caution-500 rounded-full" />
        Not connected
      </div>
      <button
        onClick={onRetry}
        className="text-sm text-accent-600 hover:text-accent-700 font-medium"
      >
        Retry
      </button>
    </div>
  );
}
