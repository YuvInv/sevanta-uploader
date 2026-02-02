/**
 * Success state after uploading to CRM
 */

interface UploadSuccessProps {
  dealId: string;
  companyName?: string;
  onUploadAnother: () => void;
}

export function UploadSuccess({ dealId, companyName, onUploadAnother }: UploadSuccessProps) {
  const crmUrl = `https://run.mydealflow.com/inv/#/Company.php?CompanyID=${dealId}`;

  return (
    <div className="text-center py-8">
      {/* Success icon */}
      <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-success-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-warm-800 mb-2">Upload Successful!</h2>
      {companyName && (
        <p className="text-warm-600 mb-6">{companyName} has been added to your CRM.</p>
      )}

      {/* CRM link */}
      <a
        href={crmUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors text-base mb-4"
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

      {/* Upload another */}
      <div>
        <button
          onClick={onUploadAnother}
          className="text-accent-600 hover:text-accent-700 font-medium text-base"
        >
          Upload Another Company
        </button>
      </div>
    </div>
  );
}
