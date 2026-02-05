/**
 * Modal for duplicate company warning during Dealigence quick upload
 * Replaces browser confirm() with a styled modal matching the design system
 */

interface DuplicateWarningModalProps {
  companyName: string; // Company being uploaded
  matchedCompanyName: string; // Existing company found in CRM
  matchedCompanyId?: string; // CRM ID for link
  onCancel: () => void;
  onProceed: () => void;
}

export function DuplicateWarningModal({
  companyName,
  matchedCompanyName,
  matchedCompanyId,
  onCancel,
  onProceed,
}: DuplicateWarningModalProps) {
  const crmUrl = matchedCompanyId
    ? `https://run.mydealflow.com/inv/#/Company.php?CompanyID=${matchedCompanyId}`
    : undefined;

  return (
    <div className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-caution-50 px-6 py-4 border-b border-caution-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-caution-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-caution-600"
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
            <h2 className="text-lg font-semibold text-caution-800">Possible Duplicate Found</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-warm-700">A similar company may already exist in the CRM:</p>

          {/* Matched company card */}
          <div className="bg-warm-50 border border-warm-200 rounded-xl p-4">
            <p className="font-semibold text-warm-800">&ldquo;{matchedCompanyName}&rdquo;</p>
            {crmUrl && (
              <a
                href={crmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent-600 hover:text-accent-700 mt-2"
              >
                View in CRM
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>

          <p className="text-warm-600">
            Upload &ldquo;<span className="font-medium text-warm-800">{companyName}</span>&rdquo;
            anyway?
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-warm-50 border-t border-warm-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-warm-300 text-warm-700 rounded-xl font-medium hover:bg-warm-100 transition-colors text-base"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="flex-1 px-4 py-2.5 bg-caution-500 text-white rounded-xl font-medium hover:bg-caution-600 transition-colors text-base"
          >
            Upload Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
