/**
 * Inline banner showing duplicate check status on the preview card.
 * Replaces the old modal-based duplicate warning flow.
 */

import type {
  DuplicateCheckStep,
  DuplicateCheckMatch,
} from '../../hooks/useDealigenceDuplicateCheck';

interface DuplicateCheckBannerProps {
  step: DuplicateCheckStep;
  match?: DuplicateCheckMatch;
  onOverride: () => void;
}

export function DuplicateCheckBanner({ step, match, onOverride }: DuplicateCheckBannerProps) {
  if (step === 'idle' || step === 'error') return null;

  if (step === 'checking') {
    return (
      <div className="bg-warm-50 border border-warm-200 rounded-xl p-4 flex items-center gap-3">
        {/* Spinner */}
        <svg
          className="w-5 h-5 text-warm-400 animate-spin flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm text-warm-600">Searching company in the CRM...</p>
      </div>
    );
  }

  if (step === 'found') {
    const crmUrl = match?.id
      ? `https://run.mydealflow.com/inv/#/Company.php?CompanyID=${match.id}`
      : undefined;

    return (
      <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          {/* Warning icon */}
          <svg
            className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5"
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
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-danger-800">Already in CRM</p>
            {match?.name && (
              <p className="text-sm text-danger-700 mt-0.5">
                Matched: &ldquo;{match.name}&rdquo;
                {crmUrl && (
                  <>
                    {' — '}
                    <a
                      href={crmUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-600 hover:text-accent-700 hover:underline inline-flex items-center gap-1"
                    >
                      View in CRM
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </>
                )}
              </p>
            )}
            <button
              onClick={onOverride}
              className="text-sm text-danger-600 hover:text-danger-800 underline mt-2 transition-colors"
            >
              Upload Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'clear'
  return (
    <div className="bg-success-50 border border-success-200 rounded-xl p-4 flex items-center gap-3">
      {/* Checkmark icon */}
      <svg
        className="w-5 h-5 text-success-500 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <p className="text-sm text-success-700">Not found in CRM</p>
    </div>
  );
}
