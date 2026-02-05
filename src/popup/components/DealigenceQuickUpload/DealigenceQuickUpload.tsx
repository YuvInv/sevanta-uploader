/**
 * Main container for Dealigence Quick Upload feature
 * Handles extraction, preview, and upload flow (no editing)
 */

import { useCallback } from 'react';
import { useDealigenceExtraction } from '../../hooks/useDealigenceExtraction';
import { useDealigenceUpload } from '../../hooks/useDealigenceUpload';
import { ExtractionProgress } from './ExtractionProgress';
import { ExtractionError } from './ExtractionError';
import { DealigencePreview } from './DealigencePreview';
import { UploadSuccess } from './UploadSuccess';
import { DuplicateWarningModal } from './DuplicateWarningModal';

interface DealigenceQuickUploadProps {
  connected: boolean;
}

export function DealigenceQuickUpload({ connected }: DealigenceQuickUploadProps) {
  const { state, isExtracting, hasError, hasData, data, error, retry, isDealigencePage } =
    useDealigenceExtraction();

  const {
    uploadStep,
    duplicateWarning,
    isUploading,
    uploadError,
    createdDealId,
    showDuplicateModal,
    duplicateMatch,
    pendingUploadData,
    checkDuplicateAndUpload,
    confirmUpload,
    cancelUpload,
    reset: resetUpload,
  } = useDealigenceUpload();

  // Handle upload click - check for duplicates and upload
  const handleUploadClick = useCallback(async () => {
    if (!data) return;
    await checkDuplicateAndUpload(data);
  }, [data, checkDuplicateAndUpload]);

  const handleUploadAnother = useCallback(() => {
    resetUpload();
    retry();
  }, [resetUpload, retry]);

  // Not connected state
  if (!connected) {
    return (
      <div className="bg-gradient-to-r from-caution-50 to-warm-100 border border-caution-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
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
          <div>
            <h3 className="font-medium text-caution-800 mb-1">Not Connected</h3>
            <p className="text-caution-700 text-sm">
              Please log into{' '}
              <a
                href="https://run.mydealflow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-caution-900"
              >
                Sevanta Dealflow
              </a>{' '}
              first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not on a Dealigence company page
  if (!isDealigencePage) {
    return (
      <div className="bg-warm-100 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-warm-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-warm-700 mb-2">Navigate to a Company Page</h3>
        <p className="text-warm-500 text-sm">
          Visit a company profile on{' '}
          <a
            href="https://dealigence.vc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-600 hover:underline"
          >
            dealigence.vc
          </a>{' '}
          to extract and upload data.
        </p>
      </div>
    );
  }

  // Upload success state
  if (uploadStep === 'success' && createdDealId) {
    return (
      <UploadSuccess
        dealId={createdDealId}
        companyName={data?.companyName}
        onUploadAnother={handleUploadAnother}
      />
    );
  }

  // Upload error state
  if (uploadStep === 'error' && uploadError) {
    return <ExtractionError error={uploadError} onRetry={handleUploadAnother} />;
  }

  // Extracting state (with retry info)
  if (isExtracting) {
    return <ExtractionProgress retryCount={state.retryCount} />;
  }

  // Extraction error state
  if (hasError && error) {
    return <ExtractionError error={error} onRetry={retry} />;
  }

  // Preview state - direct to upload (no editing)
  if (hasData && data) {
    return (
      <>
        <DealigencePreview
          data={data}
          onUpload={handleUploadClick}
          isUploading={isUploading}
          duplicateWarning={duplicateWarning}
        />
        {showDuplicateModal && pendingUploadData && (
          <DuplicateWarningModal
            companyName={pendingUploadData.companyName}
            matchedCompanyName={duplicateMatch?.name || 'Unknown'}
            matchedCompanyId={duplicateMatch?.id}
            onCancel={cancelUpload}
            onProceed={confirmUpload}
          />
        )}
      </>
    );
  }

  // Fallback loading state
  return <ExtractionProgress />;
}
