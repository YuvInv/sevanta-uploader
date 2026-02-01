interface ConnectionStatusProps {
  connected: boolean;
  loading: boolean;
  error?: string;
  onRetry: () => void;
}

export function ConnectionStatus({ connected, loading, error, onRetry }: ConnectionStatusProps) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        Connecting...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
          Error
        </div>
        <button onClick={onRetry} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Retry
        </button>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
        Connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm">
        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full" />
        Not connected
      </div>
      <button onClick={onRetry} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
        Retry
      </button>
    </div>
  );
}
