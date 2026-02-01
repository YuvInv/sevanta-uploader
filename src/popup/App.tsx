import { ConnectionStatus } from './components/ConnectionStatus';
import { CsvUpload } from './components/CsvUpload';
import { ColumnMapper } from './components/ColumnMapper';
import { CompanyTable } from './components/CompanyTable';
import { CompanyEditorModal } from './components/CompanyEditorModal';
import { UploadProgress } from './components/UploadProgress';
import { UploadPreview } from './components/UploadPreview';
import { DuplicateCheckProgress } from './components/DuplicateCheckProgress';
import { useSevantaApi } from './hooks/useSevantaApi';
import { useValidation } from './hooks/useValidation';
import { useDuplicateCheck } from './hooks/useDuplicateCheck';
import { useUploadWorkflow } from './hooks/useUploadWorkflow';
import logo from '../assets/icons/inv-logo.png';

export default function App() {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
              <h1 className="text-lg font-semibold text-gray-800">Sevanta Uploader</h1>
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

      {/* Duplicate Check Progress Modal */}
      {step === 'checking-duplicates' && duplicateCheckProgress && (
        <DuplicateCheckProgress progress={duplicateCheckProgress} />
      )}

      {/* Main Content */}
      <main className="p-4">
        {!connected && !connectionLoading && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-yellow-600"
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
                <h3 className="font-medium text-yellow-800 mb-1">Not Connected</h3>
                <p className="text-yellow-700 text-sm">
                  Please log into{' '}
                  <a
                    href="https://run.mydealflow.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline hover:text-yellow-900"
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
              <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-orange-500"
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
                  <span className="text-sm text-orange-700">
                    <strong>{autoDiscardedCount}</strong> duplicate
                    {autoDiscardedCount === 1 ? '' : 's'} auto-discarded (already in CRM)
                  </span>
                </div>
                <button
                  onClick={clearAutoDiscardedNotification}
                  className="text-orange-400 hover:text-orange-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="text-green-600">{validCount} valid</span>
                {invalidCount > 0 && <span className="text-red-600">{invalidCount} invalid</span>}
                {duplicateCount > 0 && (
                  <span className="text-orange-600">{duplicateCount} duplicates</span>
                )}
                {skippedCount > 0 && (
                  <span className="text-gray-500">{skippedCount} discarded</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Start Over
                </button>
                {step === 'review' && (
                  <button
                    onClick={() => setStep('preview')}
                    disabled={validCount === 0}
                    className="px-4 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </main>
    </div>
  );
}
