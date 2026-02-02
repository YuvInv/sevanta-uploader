/**
 * Dealigence Quick Upload - Main component for one-click company upload from Dealigence
 */

import { useEffect, useCallback, useRef } from 'react';
import type { DealigenceCompanyData, Schema, Company, ContactData } from '../../lib/types';
import { useDealigenceUpload } from '../hooks/useDealigenceUpload';
import { DealigencePreview } from './DealigencePreview';
import { CompanyEditorModal } from './CompanyEditorModal';

interface DealigenceQuickUploadProps {
  schema: Schema | null;
  tabId: number | null;
  url?: string | null;
  onReset?: () => void;
}

export function DealigenceQuickUpload({ schema, tabId, url, onReset }: DealigenceQuickUploadProps) {
  const {
    state,
    initializeFromData,
    setLoading,
    setExtractionError,
    updateDealData,
    enterEditMode,
    checkDuplicates,
    executeUpload,
    reset,
    goBackToPreview,
  } = useDealigenceUpload(schema);

  // Extract data function
  const extractData = useCallback(
    async (tid: number) => {
      setLoading();

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'EXTRACT_DEALIGENCE_DATA',
          tabId: tid,
        });

        if (response.success && response.data) {
          initializeFromData(response.data as DealigenceCompanyData);
        } else {
          setExtractionError(response.error || 'Failed to extract company data');
        }
      } catch (error) {
        setExtractionError(
          error instanceof Error ? error.message : 'Failed to communicate with page'
        );
      }
    },
    [setLoading, initializeFromData, setExtractionError]
  );

  // Track the URL we last extracted from
  const extractedUrlRef = useRef<string | null>(null);

  // Detect URL changes - compare both prop URL and extracted sourceUrl
  // This catches SPA navigation even if parent detection is delayed
  useEffect(() => {
    if (!url || !tabId) return;

    // Check if current URL doesn't match what we extracted
    const extractedUrl = state.rawData?.sourceUrl;
    const urlMismatch = extractedUrl && extractedUrl !== url;

    // Check if URL prop changed from what we tracked
    const propUrlChanged = extractedUrlRef.current && extractedUrlRef.current !== url;

    if (urlMismatch || propUrlChanged) {
      // URL changed - reset and let the idle effect handle re-extraction
      extractedUrlRef.current = url;
      reset();
      return;
    }

    // Track current URL
    if (!extractedUrlRef.current) {
      extractedUrlRef.current = url;
    }
  }, [url, tabId, state.rawData?.sourceUrl, reset]);

  // Extract data when component mounts or enters idle state
  useEffect(() => {
    if (tabId && state.step === 'idle') {
      extractData(tabId);
    }
  }, [tabId, state.step, extractData]);

  // Create a mock Company object for the editor modal
  const mockCompany: Company | null =
    state.rawData && state.step === 'edit'
      ? {
          id: 'dealigence-preview',
          data: state.dealData,
          validation: state.validation,
          uploadStatus: 'pending',
          contacts: state.contacts,
        }
      : null;

  function handleEditorSave(
    _companyId: string,
    data: Record<string, string>,
    contacts: ContactData[]
  ) {
    updateDealData(data, contacts);
  }

  function handleReset() {
    reset();
    onReset?.();
  }

  // Loading state
  if (state.step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-accent-200 border-t-accent-500 rounded-full animate-spin mb-4"></div>
        <p className="text-warm-600">Extracting company data...</p>
      </div>
    );
  }

  // Error state
  if (state.step === 'error' || state.step === 'idle') {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-danger-600"
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
        <h3 className="text-lg font-semibold text-danger-800 mb-2">
          {state.step === 'idle' ? 'No Data Available' : 'Extraction Failed'}
        </h3>
        <p className="text-sm text-danger-700 mb-4">
          {state.error || 'Unable to extract company data from this page.'}
        </p>
        {tabId && (
          <button
            onClick={() => extractData(tabId)}
            className="px-4 py-2 text-sm font-medium text-danger-700 bg-white border border-danger-200 rounded-xl hover:bg-danger-50 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Preview state
  if (state.step === 'preview' && state.rawData) {
    return (
      <DealigencePreview
        data={state.rawData}
        dealData={state.dealData}
        validation={state.validation}
        extractionWarnings={state.extractionWarnings}
        onEdit={enterEditMode}
        onProceed={checkDuplicates}
        isValid={state.validation.valid}
      />
    );
  }

  // Edit state
  if (state.step === 'edit' && mockCompany && schema) {
    return (
      <CompanyEditorModal
        company={mockCompany}
        schema={schema}
        onSave={handleEditorSave}
        onClose={goBackToPreview}
      />
    );
  }

  // Checking duplicates state
  if (state.step === 'checking-duplicate') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-accent-200 border-t-accent-500 rounded-full animate-spin mb-4"></div>
        <p className="text-warm-600">Checking for duplicates...</p>
      </div>
    );
  }

  // Duplicate blocked state
  if (state.step === 'duplicate-blocked' && state.duplicateMatch) {
    return (
      <div className="bg-caution-50 border border-caution-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-caution-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-caution-600"
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
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-caution-800 mb-2">Duplicate Found</h3>
            <p className="text-sm text-caution-700 mb-4">
              A company with this name already exists in the CRM. To avoid duplicates, this upload
              has been blocked.
            </p>
            <div className="bg-white rounded-xl p-4 border border-caution-200 mb-4">
              <p className="text-sm font-medium text-warm-800">
                {state.duplicateMatch.CompanyName}
              </p>
              {state.duplicateMatch.Website && (
                <p className="text-xs text-warm-500">{state.duplicateMatch.Website}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={goBackToPreview}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-warm-700 bg-white border border-warm-200 rounded-xl hover:bg-warm-50 transition-colors"
              >
                Go Back
              </button>
              <a
                href={`https://run.mydealflow.com/inv/#/Company.php?CompanyID=${state.duplicateMatch.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 text-sm font-medium text-center text-white bg-accent-500 rounded-xl hover:bg-accent-600 transition-colors"
              >
                View in CRM
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirm state
  if (state.step === 'confirm' && state.rawData) {
    return (
      <div className="space-y-4">
        <div className="bg-success-50 border border-success-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-success-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-success-800 mb-2">Ready to Upload</h3>
              <p className="text-sm text-success-700 mb-4">
                No duplicates found. Ready to create the deal and {state.contacts.length} contact
                {state.contacts.length !== 1 ? 's' : ''}.
              </p>
              <div className="bg-white rounded-xl p-4 border border-success-200 mb-4">
                <p className="text-sm font-medium text-warm-800">{state.rawData.companyName}</p>
                {state.rawData.description && (
                  <p className="text-xs text-warm-500 mt-1 line-clamp-2">
                    {state.rawData.description}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={goBackToPreview}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-warm-700 bg-white border border-warm-200 rounded-xl hover:bg-warm-50 transition-colors"
                >
                  Back to Preview
                </button>
                <button
                  onClick={executeUpload}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-success-500 rounded-xl hover:bg-success-600 transition-colors"
                >
                  Upload to CRM
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Uploading state
  if (state.step === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-success-200 border-t-success-500 rounded-full animate-spin mb-4"></div>
        <p className="text-warm-600">Uploading to CRM...</p>
        <p className="text-sm text-warm-500 mt-1">Creating deal and contacts</p>
      </div>
    );
  }

  // Success state
  if (state.step === 'success') {
    return (
      <div className="bg-success-50 border border-success-200 rounded-2xl p-6 text-center">
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
        <h3 className="text-lg font-semibold text-success-800 mb-2">Upload Successful!</h3>
        <p className="text-sm text-success-700 mb-2">
          Deal created with {state.createdContactIds.length} contact
          {state.createdContactIds.length !== 1 ? 's' : ''}.
        </p>

        {/* Failed contacts warning */}
        {state.failedContacts.length > 0 && (
          <div className="bg-caution-50 border border-caution-200 rounded-xl p-3 mt-4 mb-4 text-left">
            <p className="text-sm font-medium text-caution-800 mb-1">
              Some contacts failed to import:
            </p>
            <ul className="text-xs text-caution-700">
              {state.failedContacts.map((f, i) => (
                <li key={i}>
                  • {f.name}: {f.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-warm-700 bg-white border border-warm-200 rounded-xl hover:bg-warm-50 transition-colors"
          >
            Done
          </button>
          {state.createdDealId && (
            <a
              href={`https://run.mydealflow.com/inv/#/Company.php?CompanyID=${state.createdDealId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-center text-white bg-accent-500 rounded-xl hover:bg-accent-600 transition-colors"
            >
              View in CRM
            </a>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
