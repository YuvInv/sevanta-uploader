import { useState, useEffect, useCallback } from 'react';
import {
  parseCsv,
  autoMapColumns,
  applyMapping,
  autoMapContactColumns,
  applyContactMapping,
  isContactColumn,
} from '../../lib/csv';
import { applyDealDefaults, applyContactDefaults } from '../../lib/defaults';
import type {
  Company,
  ColumnMapping,
  ContactColumnMapping,
  UploadProgress,
  Schema,
  ContactSchema,
} from '../../lib/types';
import type { DuplicateCheckProgress } from './useDuplicateCheck';

export type Step =
  | 'upload'
  | 'map'
  | 'checking-duplicates'
  | 'review'
  | 'preview'
  | 'uploading'
  | 'complete';

interface CsvData {
  headers: string[];
  rows: Record<string, string>[];
}

interface UseUploadWorkflowProps {
  schema: Schema | null;
  contactSchema: ContactSchema | null;
  validateCompanies: (companies: Company[]) => Company[];
  checkDuplicates: (
    companies: Company[],
    onProgress?: (progress: DuplicateCheckProgress) => void
  ) => Promise<Company[]>;
}

export function useUploadWorkflow({
  schema,
  contactSchema,
  validateCompanies,
  checkDuplicates,
}: UseUploadWorkflowProps) {
  const [step, setStep] = useState<Step>('upload');
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [contactColumnMappings, setContactColumnMappings] = useState<ContactColumnMapping[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [duplicateCheckProgress, setDuplicateCheckProgress] =
    useState<DuplicateCheckProgress | null>(null);
  const [autoDiscardedCount, setAutoDiscardedCount] = useState(0);

  // Handle CSV upload
  const handleCsvUpload = useCallback(
    (content: string) => {
      const parsed = parseCsv(content);
      setCsvData({ headers: parsed.headers, rows: parsed.rows });

      const contactHeaders = parsed.headers.filter((h) => isContactColumn(h));
      const dealHeaders = parsed.headers.filter((h) => !isContactColumn(h));

      if (schema) {
        const mappings = autoMapColumns(dealHeaders, schema.fields);
        const contactColumnsAsDealMappings = contactHeaders.map((h) => ({
          csvColumn: h,
          crmField: null,
        }));
        setColumnMappings([...mappings, ...contactColumnsAsDealMappings]);
      }

      if (contactSchema) {
        const contactMappings = autoMapContactColumns(contactHeaders, contactSchema.fields);
        setContactColumnMappings(contactMappings);
      }

      setStep('map');
    },
    [schema, contactSchema]
  );

  // Handle column mapping confirmation
  const handleMappingConfirm = useCallback(async () => {
    if (!csvData || !schema) return;

    const mappedData = applyMapping(csvData.rows, columnMappings);
    const enrichedData = mappedData.map((row) => applyDealDefaults(row, 'csv'));

    const contactData =
      contactColumnMappings.length > 0
        ? applyContactMapping(csvData.rows, contactColumnMappings)
        : csvData.rows.map(() => ({}));

    const enrichedContactData = contactData.map((contact) =>
      Object.keys(contact).length > 0 ? applyContactDefaults(contact) : contact
    );

    const newCompanies: Company[] = enrichedData.map((data, index) => {
      const contact = enrichedContactData[index] as Record<string, string>;
      const hasContactName = contact && contact.Name;

      return {
        id: `company-${index}-${Date.now()}`,
        data,
        validation: { valid: true, errors: [], warnings: [] },
        uploadStatus: 'pending' as const,
        contactData: hasContactName ? contact : undefined,
      };
    });

    const validated = validateCompanies(newCompanies);
    setCompanies(validated);

    // Show duplicate check progress
    setStep('checking-duplicates');
    setDuplicateCheckProgress({
      current: 0,
      total: validated.length,
      currentCompany: validated[0]?.data.CompanyName || '',
    });

    const withDuplicates = await checkDuplicates(validated, (progress) => {
      setDuplicateCheckProgress(progress);
    });

    // Auto-discard duplicates
    let discardedCount = 0;
    const withAutoDiscard = withDuplicates.map((company) => {
      if (company.duplicate?.isDuplicate) {
        discardedCount++;
        return { ...company, skipped: true };
      }
      return company;
    });

    setCompanies(withAutoDiscard);
    setAutoDiscardedCount(discardedCount);
    setDuplicateCheckProgress(null);
    setStep('review');
  }, [csvData, schema, columnMappings, contactColumnMappings, validateCompanies, checkDuplicates]);

  // Handle company edit
  const handleCompanyEdit = useCallback((id: string, field: string, value: string) => {
    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id !== id) return company;
        return {
          ...company,
          data: { ...company.data, [field]: value },
        };
      })
    );
  }, []);

  // Re-validate after edit
  const companiesHash = companies.map((c) => JSON.stringify(c.data)).join(',');
  useEffect(() => {
    if (schema && companies.length > 0 && step === 'review') {
      const revalidated = validateCompanies(companies);
      if (JSON.stringify(revalidated) !== JSON.stringify(companies)) {
        setCompanies(revalidated);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companiesHash, schema]);

  // Handle toggling skip/discard status
  const handleToggleSkip = useCallback((id: string) => {
    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id !== id) return company;
        return { ...company, skipped: !company.skipped };
      })
    );
  }, []);

  // Clear auto-discarded notification
  const clearAutoDiscardedNotification = useCallback(() => {
    setAutoDiscardedCount(0);
  }, []);

  // Handle confirmed upload (after preview)
  const handleConfirmedUpload = useCallback(async () => {
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
      if (company.skipped) continue;

      setUploadProgress((prev) => (prev ? { ...prev, current: company.data.CompanyName } : null));

      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, uploadStatus: 'uploading' as const } : c))
      );

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'CREATE_DEAL',
          data: company.data,
        });

        if (response.success) {
          const dealId = response.data?.dealId;
          let createdContactId: string | undefined;

          if (dealId && company.contactData && company.contactData.Name) {
            try {
              const contactResponse = await chrome.runtime.sendMessage({
                type: 'CREATE_CONTACT',
                data: company.contactData,
                companyId: dealId,
              });
              if (contactResponse.success) {
                createdContactId = contactResponse.data?.contactId;
              }
            } catch {
              // Contact creation failed silently - deal was created successfully
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
      } catch {
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
  }, [companies]);

  // Reset to start
  const handleReset = useCallback(() => {
    setCsvData(null);
    setColumnMappings([]);
    setContactColumnMappings([]);
    setCompanies([]);
    setSelectedCompanyId(null);
    setUploadProgress(null);
    setDuplicateCheckProgress(null);
    setAutoDiscardedCount(0);
    setStep('upload');
  }, []);

  // Computed values
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const validCount = companies.filter(
    (c) => c.validation.valid && !c.duplicate?.isDuplicate && !c.skipped
  ).length;
  const invalidCount = companies.filter((c) => !c.validation.valid && !c.skipped).length;
  const duplicateCount = companies.filter((c) => c.duplicate?.isDuplicate && !c.skipped).length;
  const skippedCount = companies.filter((c) => c.skipped).length;

  return {
    // State
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

    // Handlers
    handleCsvUpload,
    handleMappingConfirm,
    handleCompanyEdit,
    handleToggleSkip,
    handleConfirmedUpload,
    handleReset,
    clearAutoDiscardedNotification,

    // Computed
    selectedCompany,
    validCount,
    invalidCount,
    duplicateCount,
    skippedCount,
  };
}
