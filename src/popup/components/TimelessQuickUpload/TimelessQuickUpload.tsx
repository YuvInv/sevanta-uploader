/**
 * Main container for Timeless Quick Upload feature.
 * Orchestrates extraction, duplicate check, and upload with two paths:
 * - New company: create deal + memo comment + contacts
 * - Existing company: add memo comment only
 */

import { useCallback, useState } from 'react';
import type { TimelessMemoData } from '../../../lib/timeless/types';
import type { TimelessUploadOverrides } from '../../../lib/timeless/transformers';
import type { Schema } from '../../../lib/types';
import { useTimelessExtraction } from '../../hooks/useTimelessExtraction';
import { useTimelessUpload } from '../../hooks/useTimelessUpload';
import { useTimelessDuplicateCheck } from '../../hooks/useTimelessDuplicateCheck';
import { ExtractionProgress } from '../DealigenceQuickUpload/ExtractionProgress';
import { ExtractionError } from '../DealigenceQuickUpload/ExtractionError';
import { UploadSuccess } from '../DealigenceQuickUpload/UploadSuccess';
import { TimelessPreview } from './TimelessPreview';
import { TimelessDuplicateMatch } from './TimelessDuplicateMatch';

interface TimelessQuickUploadProps {
  connected: boolean;
  schema?: Schema | null;
}

export function TimelessQuickUpload({ connected, schema }: TimelessQuickUploadProps) {
  const { isExtracting, hasError, hasData, data, error, retry, isTimelessPage } =
    useTimelessExtraction();

  const {
    uploadStep,
    isUploading,
    uploadError,
    createdDealId,
    commentedDealId,
    uploadNew,
    uploadComment,
    reset: resetUpload,
  } = useTimelessUpload();

  const { duplicateCheck } = useTimelessDuplicateCheck(data);

  // Track if user chose to override duplicate and create new
  const [forceNew, setForceNew] = useState(false);

  const handleUploadNew = useCallback(
    async (editedData: TimelessMemoData, overrides?: TimelessUploadOverrides) => {
      await uploadNew(editedData, overrides);
    },
    [uploadNew]
  );

  const handleAddComment = useCallback(
    async (dealId: string) => {
      if (!data) return;
      await uploadComment(dealId, data);
    },
    [data, uploadComment]
  );

  const handleCreateNewInstead = useCallback(() => {
    setForceNew(true);
  }, []);

  const handleUploadAnother = useCallback(() => {
    resetUpload();
    setForceNew(false);
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

  // Not on a Timeless memo page
  if (!isTimelessPage) {
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
        <h3 className="font-semibold text-warm-700 mb-2">Navigate to a Meeting Memo</h3>
        <p className="text-warm-500 text-sm">
          Visit a meeting memo on{' '}
          <a
            href="https://my.timeless.day"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-600 hover:underline"
          >
            my.timeless.day
          </a>{' '}
          to extract and upload data.
        </p>
      </div>
    );
  }

  // Upload success - new company created
  if (uploadStep === 'success' && createdDealId) {
    return (
      <UploadSuccess
        dealId={createdDealId}
        companyName={data?.companyName}
        onUploadAnother={handleUploadAnother}
      />
    );
  }

  // Upload success - comment added to existing company
  if (uploadStep === 'success' && commentedDealId) {
    const crmUrl = `https://run.mydealflow.com/inv/#/Company.php?CompanyID=${commentedDealId}`;
    return (
      <div className="text-center py-8">
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
        <h2 className="text-xl font-semibold text-warm-800 mb-2">Comment Added!</h2>
        <p className="text-warm-600 mb-6">
          Meeting memo has been added as a comment to {data?.companyName || 'the company'}.
        </p>
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
        <div>
          <button
            onClick={handleUploadAnother}
            className="text-accent-600 hover:text-accent-700 font-medium text-base"
          >
            Upload Another Memo
          </button>
        </div>
      </div>
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

  // Data ready - show appropriate view based on duplicate check
  if (hasData && data) {
    // Still checking duplicates
    if (duplicateCheck.step === 'checking') {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 border-4 border-warm-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-accent-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-warm-700 font-medium">Checking if company exists in CRM...</p>
        </div>
      );
    }

    // Duplicate found and user hasn't chosen to create new
    if (duplicateCheck.step === 'found' && duplicateCheck.matches.length > 0 && !forceNew) {
      return (
        <TimelessDuplicateMatch
          data={data}
          matches={duplicateCheck.matches}
          onAddComment={handleAddComment}
          onCreateNew={handleCreateNewInstead}
          isUploading={isUploading}
        />
      );
    }

    // No duplicate found, or user chose to create new
    return (
      <TimelessPreview data={data} onUpload={handleUploadNew} isUploading={isUploading} schema={schema} />
    );
  }

  // Fallback
  return <ExtractionProgress />;
}
