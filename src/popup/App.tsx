import { useState, useEffect } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { CsvUpload } from './components/CsvUpload';
import { ColumnMapper } from './components/ColumnMapper';
import { CompanyTable } from './components/CompanyTable';
import { CompanyEditorModal } from './components/CompanyEditorModal';
import { UploadProgress } from './components/UploadProgress';
import { UploadPreview } from './components/UploadPreview';
import { DuplicateCheckProgress } from './components/DuplicateCheckProgress';
import { TabNav, type AppMode } from './components/TabNav';
import { ContactLookup } from './components/ContactLookup';
import { DealigenceQuickUpload } from './components/DealigenceQuickUpload';
import { useSevantaApi } from './hooks/useSevantaApi';
import { useValidation } from './hooks/useValidation';
import { useDuplicateCheck } from './hooks/useDuplicateCheck';
import { useUploadWorkflow } from './hooks/useUploadWorkflow';
import { isDealigenceCompanyPage } from '../lib/dealigence/urlUtils';
import logo from '../assets/icons/inv-logo.png';

export default function App() {
  const [mode, setMode] = useState<AppMode>('upload');

  // Initial check for Dealigence page on mount - auto-switch to Quick Upload
  useEffect(() => {
    let mounted = true;

    const checkInitialPage = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB_INFO' });
        if (mounted && response?.success && response.data?.isDealigenceCompanyPage) {
          setMode('dealigence');
        }
      } catch {
        // Ignore - stay on default tab
      }
    };

    checkInitialPage();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for SPA navigation on Dealigence - auto-switch when navigating TO a company page
  useEffect(() => {
    const handleMessage = (message: { type: string; url?: string }) => {
      if (message.type === 'DEALIGENCE_URL_CHANGED' && message.url) {
        if (isDealigenceCompanyPage(message.url)) {
          setMode('dealigence');
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const {
    connected,
    loading: connectionLoading,
    schema,
    contactSchema,
    error: connectionError,
    refreshConnection,
  } = useSevantaApi();

  const { validateCompanies } = useValidation(schema);
  const { checkDuplicates } = useDuplicateCheck();

  const {
    step,
    setStep,
    csvData,
    columnMappings,
    setColumnMappings,
    contactColumnMappings,
    setContactColumnMappings,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    uploadProgress,
    duplicateCheckProgress,
    autoDiscardedCount,
    handleCsvUpload,
    handleMappingConfirm,
    handleCompanySave,
    handleToggleSkip,
    handleConfirmedUpload,
    handleReset,
    clearAutoDiscardedNotification,
    selectedCompany,
    validCount,
    invalidCount,
    duplicateCount,
    skippedCount,
  } = useUploadWorkflow({
    schema,
    contactSchema,
    validateCompanies,
    checkDuplicates,
  });

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-white to-warm-50 border-b border-warm-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
              <h1 className="text-lg font-semibold text-warm-800">Sevanta Uploader</h1>
            </div>
          </div>
          <div className="mt-2">
            <ConnectionStatus
              connected={connected}
              loading={connectionLoading}
              error={connectionError}
              onRetry={refreshConnection}
            />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="px-4 py-3">
        <TabNav mode={mode} onModeChange={setMode} />
      </div>

      {/* Duplicate Check Progress Modal */}
      {mode === 'upload' && step === 'checking-duplicates' && duplicateCheckProgress && (
        <DuplicateCheckProgress progress={duplicateCheckProgress} />
      )}

      {/* Main Content */}
      <main className="p-4">
        {/* Dealigence Quick Upload Mode */}
        {mode === 'dealigence' && <DealigenceQuickUpload connected={connected} />}

        {/* Contact Lookup Mode */}
        {mode === 'lookup' && <ContactLookup connected={connected} />}

        {/* Company Upload Mode */}
        {mode === 'upload' && (
          <>
            {!connected && !connectionLoading && (
              <div className="bg-gradient-to-r from-caution-50 to-warm-100 border border-caution-200 rounded-xl p-5 mb-4">
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
                      first, then click retry.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Step */}
            {connected && step === 'upload' && (
              <CsvUpload
                onUpload={handleCsvUpload}
                schemaFields={schema?.fields}
                contactSchemaFields={contactSchema?.fields}
              />
            )}

            {/* Column Mapping Step */}
            {connected && step === 'map' && csvData && schema && (
              <ColumnMapper
                csvHeaders={csvData.headers}
                schemaFields={schema.fields}
                mappings={columnMappings}
                onMappingChange={setColumnMappings}
                onConfirm={handleMappingConfirm}
                onBack={() => setStep('upload')}
                contactSchemaFields={contactSchema?.fields}
                contactMappings={contactColumnMappings}
                onContactMappingChange={setContactColumnMappings}
              />
            )}

            {/* Review Step */}
            {connected && (step === 'review' || step === 'complete') && (
              <>
                {/* Auto-discarded notification */}
                {autoDiscardedCount > 0 && (
                  <div className="mb-4 bg-caution-50 border border-caution-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-caution-500"
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
                      <span className="text-sm text-caution-700">
                        <strong>{autoDiscardedCount}</strong> duplicate
                        {autoDiscardedCount === 1 ? '' : 's'} auto-discarded (already in CRM)
                      </span>
                    </div>
                    <button
                      onClick={clearAutoDiscardedNotification}
                      className="text-caution-400 hover:text-caution-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <span className="text-success-600 font-medium">{validCount} valid</span>
                    {invalidCount > 0 && (
                      <span className="text-danger-600 font-medium">{invalidCount} invalid</span>
                    )}
                    {duplicateCount > 0 && (
                      <span className="text-caution-600 font-medium">
                        {duplicateCount} duplicates
                      </span>
                    )}
                    {skippedCount > 0 && (
                      <span className="text-warm-500 font-medium">{skippedCount} discarded</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-sm text-warm-600 hover:text-warm-800 font-medium"
                    >
                      Start Over
                    </button>
                    {step === 'review' && (
                      <button
                        onClick={() => setStep('preview')}
                        disabled={validCount === 0}
                        className="px-5 py-2 text-sm bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Preview Upload ({validCount})
                      </button>
                    )}
                  </div>
                </div>

                <CompanyTable
                  companies={companies}
                  schema={schema}
                  selectedId={selectedCompanyId}
                  onSelect={setSelectedCompanyId}
                  onToggleSkip={handleToggleSkip}
                />

                {/* Editor Modal */}
                {selectedCompany && schema && (
                  <CompanyEditorModal
                    company={selectedCompany}
                    schema={schema}
                    onSave={handleCompanySave}
                    onClose={() => setSelectedCompanyId(null)}
                  />
                )}
              </>
            )}

            {/* Preview/Dry-Run Step */}
            {connected && step === 'preview' && (
              <UploadPreview
                companies={companies}
                onConfirm={handleConfirmedUpload}
                onCancel={() => setStep('review')}
              />
            )}

            {/* Uploading Step */}
            {connected && step === 'uploading' && uploadProgress && (
              <UploadProgress progress={uploadProgress} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
