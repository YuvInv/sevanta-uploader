/**
 * Main container for IVC Quick Upload feature
 * Handles extraction, preview, and upload flow
 */

import { useCallback, useEffect, useState } from 'react';
import { useIvcExtraction } from '../../hooks/useIvcExtraction';
import { useIvcUpload } from '../../hooks/useIvcUpload';
import { useQuickUploadDuplicateCheck } from '../../hooks/useQuickUploadDuplicateCheck';
import { ExtractionProgress } from '../DealigenceQuickUpload/ExtractionProgress';
import { ExtractionError } from '../DealigenceQuickUpload/ExtractionError';
import { UploadSuccess } from '../DealigenceQuickUpload/UploadSuccess';
import { IvcPreview } from './IvcPreview';

interface IvcQuickUploadProps {
  connected: boolean;
}

export function IvcQuickUpload({ connected }: IvcQuickUploadProps) {
  const { state, isExtracting, hasError, hasData, data, error, retry, isIvcPage } =
    useIvcExtraction();

  const {
    uploadStep,
    isUploading,
    uploadError,
    createdDealId,
    upload,
    reset: resetUpload,
  } = useIvcUpload();

  const duplicateData = data ? { companyName: data.companyName, website: data.website } : undefined;
  const { duplicateCheck } = useQuickUploadDuplicateCheck(duplicateData);

  // Reset upload state when extraction resets (company navigation)
  useEffect(() => {
    if (state.step === 'idle' && uploadStep !== 'idle') {
      resetUpload();
    }
  }, [state.step, uploadStep, resetUpload]);

  // Track duplicate override per company
  const [overriddenCompanyKey, setOverriddenCompanyKey] = useState<string | null>(null);
  const currentCompanyKey = data ? `${data.companyName}|${data.website ?? ''}` : null;
  const duplicateOverride =
    overriddenCompanyKey !== null && overriddenCompanyKey === currentCompanyKey;

  const canUpload =
    duplicateCheck.step !== 'checking' && (duplicateCheck.step !== 'found' || duplicateOverride);

  const handleUploadClick = useCallback(async () => {
    if (!data) return;
    await upload(data);
  }, [data, upload]);

  const handleUploadAnother = useCallback(() => {
    resetUpload();
    retry();
  }, [resetUpload, retry]);

  // Not connected
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

  // Not on IVC page (shouldn't render, but safety fallback)
  if (!isIvcPage) {
    return null;
  }

  // Upload success
  if (uploadStep === 'success' && createdDealId) {
    return (
      <UploadSuccess
        dealId={createdDealId}
        companyName={data?.companyName}
        onUploadAnother={handleUploadAnother}
      />
    );
  }

  // Upload error
  if (uploadStep === 'error' && uploadError) {
    return <ExtractionError error={uploadError} onRetry={handleUploadAnother} />;
  }

  // Extracting
  if (isExtracting) {
    return <ExtractionProgress />;
  }

  // Extraction error
  if (hasError && error) {
    return <ExtractionError error={error} onRetry={retry} />;
  }

  // Preview
  if (hasData && data) {
    return (
      <IvcPreview
        data={data}
        onUpload={handleUploadClick}
        isUploading={isUploading}
        duplicateCheck={duplicateCheck}
        canUpload={canUpload}
        onDuplicateOverride={() => setOverriddenCompanyKey(currentCompanyKey)}
      />
    );
  }

  // Fallback
  return <ExtractionProgress />;
}
