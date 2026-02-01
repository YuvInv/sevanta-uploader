import type { ContactLookupProgress as ProgressType } from '../../../lib/types';

interface ContactLookupProgressProps {
  progress: ProgressType;
}

export function ContactLookupProgress({ progress }: ContactLookupProgressProps) {
  const percentage =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
        {/* Animated icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent-600 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-display font-semibold text-warm-800 text-center mb-2">
          Looking Up Contacts
        </h2>
        <p className="text-warm-500 text-center mb-6">Searching the CRM for matches...</p>

        {/* Progress bar - thick and clear */}
        <div className="mb-4">
          <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex justify-between text-sm mb-6">
          <span className="text-warm-600 font-medium">
            {progress.completed} of {progress.total}
          </span>
          <span className="text-warm-500">{percentage}%</span>
        </div>

        {/* Current contact card */}
        {progress.current && (
          <div className="bg-warm-50 rounded-xl p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-warm-500 mb-1">Currently checking</p>
            <p className="font-medium text-warm-700 truncate">{progress.current}</p>
          </div>
        )}

        {/* Running totals */}
        <div className="flex justify-center gap-6 mt-6">
          <div className="text-center">
            <span className="text-2xl font-semibold text-success-600">{progress.strongCount}</span>
            <p className="text-xs text-warm-500">Strong</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-semibold text-caution-600">
              {progress.possibleCount}
            </span>
            <p className="text-xs text-warm-500">Possible</p>
          </div>
        </div>
      </div>
    </div>
  );
}
