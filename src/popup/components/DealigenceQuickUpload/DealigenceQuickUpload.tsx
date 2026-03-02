/**
 * Main container for Dealigence Quick Upload feature
 * Handles extraction, preview, and upload flow (no editing)
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useDealigenceExtraction } from '../../hooks/useDealigenceExtraction';
import { useDealigenceUpload } from '../../hooks/useDealigenceUpload';
import { useDealigenceDuplicateCheck } from '../../hooks/useDealigenceDuplicateCheck';
import { ExtractionProgress } from './ExtractionProgress';
import { ExtractionError } from './ExtractionError';
import { DealigencePreview } from './DealigencePreview';
import { DealigenceDuplicateMatch } from './DealigenceDuplicateMatch';
import { UploadSuccess } from './UploadSuccess';
import type { DealigenceStakeholder } from '../../../lib/dealigence/types';

interface DealigenceQuickUploadProps {
  connected: boolean;
}

export function DealigenceQuickUpload({ connected }: DealigenceQuickUploadProps) {
  const { state, isExtracting, hasError, hasData, data, error, retry, isDealigencePage } =
    useDealigenceExtraction();

  const {
    uploadStep,
    isUploading,
    uploadError,
    createdDealId,
    successAction,
    upload,
    uploadContactsToExisting,
    addCommentToExisting,
    reset: resetUpload,
  } = useDealigenceUpload();

  const { duplicateCheck } = useDealigenceDuplicateCheck(data);

  // Track which company key the user chose "Create as new" for.
  // Auto-resets when the company changes (key no longer matches).
  const [createNewForKey, setCreateNewForKey] = useState<string | null>(null);
  const currentCompanyKey = data ? `${data.companyName}|${data.website ?? ''}` : null;
  const createNewChosen = createNewForKey !== null && createNewForKey === currentCompanyKey;

  // Derive success subtitle from what action was taken
  const successSubtitle = useMemo(() => {
    if (!successAction || successAction === 'created-new') return undefined;
    const name = data?.companyName ?? '';
    if (successAction === 'added-contacts') return `Contacts added to ${name} in CRM.`;
    if (successAction === 'added-comment')
      return `Dealigence data added as comment to ${name} in CRM.`;
  }, [successAction, data?.companyName]);

  // Reset upload state when extraction resets (company navigation)
  useEffect(() => {
    if (state.step === 'idle' && uploadStep !== 'idle') {
      resetUpload();
    }
  }, [state.step, uploadStep, resetUpload]);

  // Upload is allowed when not actively checking and either clear/error or user chose to create new
  const canUpload =
    duplicateCheck.step !== 'checking' && (duplicateCheck.step !== 'found' || createNewChosen);

  const handleUploadClick = useCallback(async () => {
    if (!data) return;
    await upload(data);
  }, [data, upload]);

  const handleAddContactsToExisting = useCallback(
    async (dealId: string, newFounders: DealigenceStakeholder[]) => {
      await uploadContactsToExisting(dealId, newFounders);
    },
    [uploadContactsToExisting]
  );

  const handleAddCommentToExisting = useCallback(
    async (dealId: string) => {
      if (!data) return;
      await addCommentToExisting(dealId, data);
    },
    [addCommentToExisting, data]
  );

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
        subtitle={successSubtitle}
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

  // Duplicate found → show match screen (unless user chose to create new)
  if (hasData && data && duplicateCheck.step === 'found' && !createNewChosen) {
    return (
      <DealigenceDuplicateMatch
        data={data}
        matches={duplicateCheck.matches}
        onAddContacts={handleAddContactsToExisting}
        onAddComment={handleAddCommentToExisting}
        onCreateNew={() => setCreateNewForKey(currentCompanyKey)}
        isUploading={isUploading}
      />
    );
  }

  // Preview state (checking, clear, or create-new-chosen)
  if (hasData && data) {
    return (
      <DealigencePreview
        data={data}
        onUpload={handleUploadClick}
        isUploading={isUploading}
        duplicateCheck={duplicateCheck}
        canUpload={canUpload}
        onDuplicateOverride={() => setCreateNewForKey(currentCompanyKey)}
      />
    );
  }

  // Fallback loading state
  return <ExtractionProgress />;
}
