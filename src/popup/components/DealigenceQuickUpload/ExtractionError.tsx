/**
 * Error state with retry button
 */

interface ExtractionErrorProps {
  error: string;
  onRetry: () => void;
}

export function ExtractionError({ error, onRetry }: ExtractionErrorProps) {
  return (
    <div className="bg-gradient-to-r from-danger-50 to-warm-100 border border-danger-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        {/* Error icon */}
        <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-6 h-6 text-danger-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-danger-800 mb-1">Extraction Failed</h3>
          <p className="text-danger-700 text-sm mb-4">{error}</p>

          {/* Retry button */}
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
