export interface DuplicateCheckProgressState {
  current: number;
  total: number;
  currentCompany: string;
}

interface DuplicateCheckProgressProps {
  progress: DuplicateCheckProgressState;
}

export function DuplicateCheckProgress({ progress }: DuplicateCheckProgressProps) {
  const percentage = Math.round((progress.current / progress.total) * 100);

  return (
    <div className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-3 relative">
            <div className="absolute inset-0 border-4 border-accent-200 rounded-full"></div>
            <div
              className="absolute inset-0 border-4 border-accent-500 rounded-full animate-spin"
              style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }}
            ></div>
          </div>
          <h2 className="text-lg font-semibold text-warm-800">Checking for Duplicates</h2>
          <p className="text-warm-500 text-sm mt-1">Searching the CRM for existing companies...</p>
        </div>

        <div className="space-y-3">
          <div className="bg-warm-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-accent-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-warm-600 font-medium">
              {progress.current} of {progress.total} companies
            </span>
            <span className="text-warm-500">{percentage}%</span>
          </div>

          {progress.currentCompany && (
            <div className="bg-warm-50 rounded-xl p-3 text-center">
              <p className="text-xs text-warm-500 uppercase tracking-wide">Currently checking</p>
              <p className="text-sm font-medium text-warm-700 truncate mt-1">
                {progress.currentCompany}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
