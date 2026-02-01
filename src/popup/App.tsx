import { useState, useEffect } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { CsvUpload } from './components/CsvUpload';
import { ColumnMapper } from './components/ColumnMapper';
import { CompanyTable } from './components/CompanyTable';
import { CompanyEditor } from './components/CompanyEditor';
import { ValidationPanel } from './components/ValidationPanel';
import { UploadProgress } from './components/UploadProgress';
import { UploadPreview } from './components/UploadPreview';
import { useSevantaApi } from './hooks/useSevantaApi';
import { useValidation } from './hooks/useValidation';
import { useDuplicateCheck } from './hooks/useDuplicateCheck';
import {
  parseCsv,
  autoMapColumns,
  applyMapping,
  autoMapContactColumns,
  applyContactMapping,
  isContactColumn,
} from '../lib/csv';
import { applyDealDefaults, applyContactDefaults } from '../lib/defaults';
import type {
  Company,
  ColumnMapping,
  ContactColumnMapping,
  UploadProgress as UploadProgressType,
} from '../lib/types';
import logo from '../assets/icons/inv-logo.png';

type Step = 'upload' | 'map' | 'review' | 'preview' | 'uploading' | 'complete';

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [csvData, setCsvData] = useState<{
    headers: string[];
    rows: Record<string, string>[];
  } | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType | null>(null);
  const [contactColumnMappings, setContactColumnMappings] = useState<ContactColumnMapping[]>([]);

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

  // Handle CSV upload
  const handleCsvUpload = (content: string) => {
    const parsed = parseCsv(content);
    if (parsed.errors.length > 0) {
      console.error('CSV parsing errors:', parsed.errors);
    }
    setCsvData({ headers: parsed.headers, rows: parsed.rows });

    // Debug: Log all headers
    console.log('CSV headers:', parsed.headers);

    // Separate headers into deal columns vs contact columns
    const contactHeaders = parsed.headers.filter((h) => isContactColumn(h));
    const dealHeaders = parsed.headers.filter((h) => !isContactColumn(h));

    // Debug: Log which headers were detected as contact columns
    console.log('Contact headers detected:', contactHeaders);
    console.log('Deal headers:', dealHeaders);

    // Auto-map deal columns (only non-contact columns)
    if (schema) {
      const mappings = autoMapColumns(dealHeaders, schema.fields);
      // Add contact columns as unmapped (they'll appear in the unified UI)
      const contactColumnsAsDealMappings = contactHeaders.map((h) => ({
        csvColumn: h,
        crmField: null, // These are contact columns, not deal fields
      }));
      setColumnMappings([...mappings, ...contactColumnsAsDealMappings]);
    }

    // Auto-map contact columns
    if (contactSchema) {
      const contactMappings = autoMapContactColumns(contactHeaders, contactSchema.fields);
      console.log('Auto-mapped contact columns:', contactMappings);
      setContactColumnMappings(contactMappings);
    } else {
      console.warn('Contact schema not loaded yet - contact columns will not be auto-mapped');
    }

    setStep('map');
  };

  // Handle column mapping confirmation
  const handleMappingConfirm = async () => {
    if (!csvData || !schema) return;

    const mappedData = applyMapping(csvData.rows, columnMappings);

    // Apply deal defaults to each row (only fills missing fields)
    const enrichedData = mappedData.map((row) => applyDealDefaults(row, 'csv'));

    // Debug: Log contact column mappings
    console.log('Contact column mappings:', contactColumnMappings);

    // Apply contact mapping if any contact columns are mapped
    const contactData =
      contactColumnMappings.length > 0
        ? applyContactMapping(csvData.rows, contactColumnMappings)
        : csvData.rows.map(() => ({}));

    // Apply contact defaults to each contact (only fills missing fields)
    const enrichedContactData = contactData.map((contact) =>
      Object.keys(contact).length > 0 ? applyContactDefaults(contact) : contact
    );

    // Debug: Log contact data
    console.log('Contact data after mapping:', enrichedContactData);

    // Create company objects with validation
    const newCompanies: Company[] = enrichedData.map((data, index) => {
      const contact = enrichedContactData[index] as Record<string, string>;
      const hasContactName = contact && contact.Name;

      // Debug: Log each contact
      if (Object.keys(contact).length > 0) {
        console.log(`Row ${index} contact:`, contact, 'hasName:', hasContactName);
      }

      return {
        id: `company-${index}-${Date.now()}`,
        data,
        validation: { valid: true, errors: [], warnings: [] },
        uploadStatus: 'pending' as const,
        // Add contact data if there's a Name field
        contactData: hasContactName ? contact : undefined,
      };
    });

    // Validate all companies
    const validated = validateCompanies(newCompanies);
    setCompanies(validated);

    // Check for duplicates
    const withDuplicates = await checkDuplicates(validated);
    setCompanies(withDuplicates);

    setStep('review');
  };

  // Handle company edit
  const handleCompanyEdit = (id: string, field: string, value: string) => {
    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id !== id) return company;

        const updatedData = { ...company.data, [field]: value };
        return {
          ...company,
          data: updatedData,
        };
      })
    );
  };

  // Re-validate after edit
  // Re-validate after edit
  const companiesHash = companies.map((c) => JSON.stringify(c.data)).join(',');
  useEffect(() => {
    if (schema && companies.length > 0 && step === 'review') {
      const revalidated = validateCompanies(companies);
      if (JSON.stringify(revalidated) !== JSON.stringify(companies)) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setCompanies(revalidated);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companiesHash, schema]);

  // Handle upload preview (shows dry-run before actual upload)
  const handleShowPreview = () => {
    setStep('preview');
  };

  // Handle toggling skip/discard status
  const handleToggleSkip = (id: string) => {
    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id !== id) return company;
        return { ...company, skipped: !company.skipped };
      })
    );
  };

  // Handle confirmed upload (after preview)
  const handleConfirmedUpload = async () => {
    const toUpload = companies.filter(
      (c) =>
        c.validation.valid &&
        c.uploadStatus === 'pending' &&
        !c.duplicate?.isDuplicate &&
        !c.skipped
    );

    if (toUpload.length === 0) return;

    setStep('uploading');
    setUploadProgress({
      total: toUpload.length,
      completed: 0,
      successful: 0,
      failed: 0,
    });

    for (const company of toUpload) {
      // Double check skipped status just in case
      if (company.skipped) continue;

      setUploadProgress((prev) => (prev ? { ...prev, current: company.data.CompanyName } : null));

      // Update status to uploading
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, uploadStatus: 'uploading' as const } : c))
      );

      // Log to console for debugging
      console.log('Uploading company:', company.data);
      console.log('Company contact data:', company.contactData);

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'CREATE_DEAL',
          data: company.data,
        });

        console.log('Create deal response:', response);

        if (response.success) {
          const dealId = response.data?.dealId;

          // Create contact if we have contact data and a deal ID
          let createdContactId: string | undefined;
          console.log('Checking contact creation:', {
            dealId,
            hasContactData: !!company.contactData,
            contactData: company.contactData,
            hasName: company.contactData?.Name,
          });

          if (dealId && company.contactData && company.contactData.Name) {
            console.log('Creating contact for deal:', dealId, company.contactData);
            try {
              const contactResponse = await chrome.runtime.sendMessage({
                type: 'CREATE_CONTACT',
                data: company.contactData,
                companyId: dealId,
              });
              console.log('Contact response:', contactResponse);
              if (contactResponse.success) {
                createdContactId = contactResponse.data?.contactId;
              } else {
                console.warn('Failed to create contact:', contactResponse.error);
              }
            } catch (contactError) {
              console.error('Contact creation error:', contactError);
            }
          }

          setCompanies((prev) =>
            prev.map((c) =>
              c.id === company.id
                ? {
                  ...c,
                  uploadStatus: 'success' as const,
                  createdDealId: dealId,
                  createdContactId,
                }
                : c
            )
          );
          setUploadProgress((prev) =>
            prev
              ? { ...prev, completed: prev.completed + 1, successful: prev.successful + 1 }
              : null
          );
        } else {
          setCompanies((prev) =>
            prev.map((c) =>
              c.id === company.id
                ? { ...c, uploadStatus: 'error' as const, uploadError: response.error }
                : c
            )
          );
          setUploadProgress((prev) =>
            prev ? { ...prev, completed: prev.completed + 1, failed: prev.failed + 1 } : null
          );
        }
      } catch (error) {
        console.error('Upload error:', error);
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === company.id
              ? { ...c, uploadStatus: 'error' as const, uploadError: 'Network error' }
              : c
          )
        );
        setUploadProgress((prev) =>
          prev ? { ...prev, completed: prev.completed + 1, failed: prev.failed + 1 } : null
        );
      }
    }

    setUploadProgress((prev) => (prev ? { ...prev, current: undefined } : null));
    setStep('complete');
  };

  // Reset to start
  const handleReset = () => {
    setCsvData(null);
    setColumnMappings([]);
    setContactColumnMappings([]);
    setCompanies([]);
    setSelectedCompanyId(null);
    setUploadProgress(null);
    setStep('upload');
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  // Update counts to exclude skipped rows where appropriate
  const validCount = companies.filter(
    (c) => c.validation.valid && !c.duplicate?.isDuplicate && !c.skipped
  ).length;
  const invalidCount = companies.filter((c) => !c.validation.valid && !c.skipped).length;
  const duplicateCount = companies.filter((c) => c.duplicate?.isDuplicate && !c.skipped).length;
  const skippedCount = companies.filter((c) => c.skipped).length;

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
                    onClick={handleShowPreview}
                    disabled={validCount === 0}
                    className="px-4 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Preview Upload ({validCount})
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <CompanyTable
                  companies={companies}
                  schema={schema}
                  selectedId={selectedCompanyId}
                  onSelect={setSelectedCompanyId}
                  onToggleSkip={handleToggleSkip}
                />
              </div>

              {selectedCompany && schema && (
                <div className="w-64 flex-shrink-0">
                  <CompanyEditor
                    company={selectedCompany}
                    schema={schema}
                    onEdit={(field, value) => handleCompanyEdit(selectedCompany.id, field, value)}
                    onClose={() => setSelectedCompanyId(null)}
                  />
                  <ValidationPanel company={selectedCompany} />
                </div>
              )}
            </div>
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
