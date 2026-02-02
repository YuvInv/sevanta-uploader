/**
 * Extraction progress spinner with optional retry count
 */

interface ExtractionProgressProps {
  retryCount?: number;
}

export function ExtractionProgress({ retryCount }: ExtractionProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-warm-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-accent-500 rounded-full border-t-transparent animate-spin" />
      </div>

      {/* Text */}
      <p className="text-lg font-medium text-warm-700">
        {retryCount && retryCount > 0
          ? 'Waiting for page to load...'
          : 'Extracting company data...'}
      </p>

      {/* Retry indicator */}
      {retryCount !== undefined && retryCount > 0 && (
        <p className="mt-2 text-sm text-warm-500">Attempt {retryCount + 1} of 5</p>
      )}

      {/* Help text */}
      <p className="mt-4 text-sm text-warm-400 text-center max-w-xs">
        Reading company information from the page. This may take a moment on slower connections.
      </p>
    </div>
  );
}
