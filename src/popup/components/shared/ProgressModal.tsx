// SVG Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

/**
 * Unified progress modal for all async operations
 * Replaces:
 * - ContactLookupProgress (Contact Lookup search)
 * - DuplicateCheckProgress (Bulk Upload duplicate check)
 * - Can optionally replace UploadProgress for consistency
 */

interface ProgressStat {
  label: string;
  value: number;
  color?: string; // Tailwind text color class (e.g., 'text-success-600')
}

interface ProgressModalProps {
  title: string;
  description?: string;
  progress: number; // 0-100
  currentItem?: string; // "Checking: Company Name" or "Uploading: Deal 5 of 20"
  stats?: ProgressStat[]; // Optional running totals
  icon?: 'search' | 'upload' | 'check' | 'loading'; // Different icon animations
}

const iconComponents = {
  search: SearchIcon,
  upload: UploadIcon,
  check: CheckCircleIcon,
  loading: LoaderIcon,
};

export function ProgressModal({
  title,
  description,
  progress,
  currentItem,
  stats,
  icon = 'loading',
}: ProgressModalProps) {
  const Icon = iconComponents[icon];

  return (
    <div className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full space-y-6">
        {/* Header with Icon */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200">
            <Icon className="w-6 h-6 text-accent-600 animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-semibold text-warm-800">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-warm-600 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-warm-500">
            <span>{Math.round(progress)}%</span>
            {stats && (
              <span>
                {stats.reduce((sum, stat) => sum + stat.value, 0)} items processed
              </span>
            )}
          </div>
        </div>

        {/* Current Item Card */}
        {currentItem && (
          <div className="bg-warm-50 border border-warm-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-1">
              Current Item
            </p>
            <p className="text-sm text-warm-800 font-medium truncate">
              {currentItem}
            </p>
          </div>
        )}

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div
                  className={`text-3xl font-display font-bold ${
                    stat.color || 'text-warm-800'
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-warm-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
