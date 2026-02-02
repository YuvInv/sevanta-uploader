/**
 * Hook for managing Dealigence quick upload workflow
 */

import { useState, useCallback } from 'react';
import type {
  DealigenceCompanyData,
  Schema,
  ContactData,
  Deal,
  ValidationResult,
} from '../../lib/types';
import {
  transformToCrmDeal,
  transformFounders,
  validateDealigenceData,
} from '../../lib/dealigence/transformer';
import { applyDealDefaults } from '../../lib/defaults';
import { validateCompany } from '../../lib/validation';

export type DealigenceUploadStep =
  | 'idle'
  | 'loading'
  | 'preview'
  | 'edit'
  | 'checking-duplicate'
  | 'duplicate-blocked'
  | 'confirm'
  | 'uploading'
  | 'success'
  | 'error';

export interface DealigenceUploadState {
  step: DealigenceUploadStep;
  rawData: DealigenceCompanyData | null;
  dealData: Record<string, string>;
  contacts: ContactData[];
  validation: ValidationResult;
  extractionWarnings: string[];
  duplicateMatch: Deal | null;
  createdDealId: string | null;
  createdContactIds: string[];
  failedContacts: { name: string; error: string }[];
  error: string | null;
}

const initialState: DealigenceUploadState = {
  step: 'idle',
  rawData: null,
  dealData: {},
  contacts: [],
  validation: { valid: true, errors: [], warnings: [] },
  extractionWarnings: [],
  duplicateMatch: null,
  createdDealId: null,
  createdContactIds: [],
  failedContacts: [],
  error: null,
};

export function useDealigenceUpload(schema: Schema | null) {
  const [state, setState] = useState<DealigenceUploadState>(initialState);

  /**
   * Initialize from extracted Dealigence data
   */
  const initializeFromData = useCallback(
    (data: DealigenceCompanyData) => {
      // Validate extraction
      const extractionValidation = validateDealigenceData(data);

      // Transform to CRM format
      const dealData = applyDealDefaults(
        transformToCrmDeal(data, schema || undefined),
        'dealigence'
      );

      // Validate against schema
      const schemaValidation = schema
        ? validateCompany(dealData, schema)
        : { valid: true, errors: [], warnings: [] };

      // Transform founders to contacts
      const contacts = transformFounders(data.founders, data.stakeholders);

      setState({
        ...initialState,
        step: 'preview',
        rawData: data,
        dealData,
        contacts,
        validation: schemaValidation,
        extractionWarnings: extractionValidation.warnings,
        error: extractionValidation.valid ? null : extractionValidation.errors.join(', '),
      });
    },
    [schema]
  );

  /**
   * Set loading state while extracting
   */
  const setLoading = useCallback(() => {
    setState((prev) => ({ ...prev, step: 'loading', error: null }));
  }, []);

  /**
   * Set extraction error
   */
  const setExtractionError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, step: 'error', error }));
  }, []);

  /**
   * Update deal data from editor
   */
  const updateDealData = useCallback(
    (newData: Record<string, string>, newContacts?: ContactData[]) => {
      setState((prev) => {
        // Re-validate against schema
        const schemaValidation = schema
          ? validateCompany(newData, schema)
          : { valid: true, errors: [], warnings: [] };

        return {
          ...prev,
          dealData: newData,
          contacts: newContacts || prev.contacts,
          validation: schemaValidation,
          step: 'preview',
        };
      });
    },
    [schema]
  );

  /**
   * Enter edit mode
   */
  const enterEditMode = useCallback(() => {
    setState((prev) => ({ ...prev, step: 'edit' }));
  }, []);

  /**
   * Check for duplicates before upload
   */
  const checkDuplicates = useCallback(async () => {
    setState((prev) => ({ ...prev, step: 'checking-duplicate' }));

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_DUPLICATE',
        companyName: state.dealData.CompanyName || '',
        website: state.dealData.URL,
      });

      if (response.success && response.data?.isDuplicate && response.data.matches.length > 0) {
        // Duplicate found - block upload
        setState((prev) => ({
          ...prev,
          step: 'duplicate-blocked',
          duplicateMatch: response.data.matches[0],
        }));
      } else {
        // No duplicate - proceed to confirm
        setState((prev) => ({ ...prev, step: 'confirm' }));
      }
    } catch (error) {
      // On error, allow proceeding with warning
      console.error('Duplicate check failed:', error);
      setState((prev) => ({ ...prev, step: 'confirm' }));
    }
  }, [state.dealData]);

  /**
   * Execute the upload
   */
  const executeUpload = useCallback(async () => {
    setState((prev) => ({ ...prev, step: 'uploading' }));

    try {
      // Create the deal first
      const dealResponse = await chrome.runtime.sendMessage({
        type: 'CREATE_DEAL',
        data: state.dealData,
      });

      if (!dealResponse.success) {
        throw new Error(dealResponse.error || 'Failed to create deal');
      }

      const dealId = dealResponse.data?.dealId;
      if (!dealId) {
        throw new Error('No deal ID returned');
      }

      // Create contacts linked to the deal
      const createdContactIds: string[] = [];
      const failedContacts: { name: string; error: string }[] = [];

      for (const contact of state.contacts) {
        try {
          const contactResponse = await chrome.runtime.sendMessage({
            type: 'CREATE_CONTACT',
            data: contact.data,
            companyId: dealId,
          });

          if (contactResponse.success && contactResponse.data?.contactId) {
            createdContactIds.push(contactResponse.data.contactId);
          } else {
            failedContacts.push({
              name: contact.data.Name || 'Unknown',
              error: contactResponse.error || 'Unknown error',
            });
          }
        } catch (error) {
          failedContacts.push({
            name: contact.data.Name || 'Unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      setState((prev) => ({
        ...prev,
        step: 'success',
        createdDealId: dealId,
        createdContactIds,
        failedContacts,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  }, [state.dealData, state.contacts]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Go back to preview from duplicate blocked state
   */
  const goBackToPreview = useCallback(() => {
    setState((prev) => ({ ...prev, step: 'preview', duplicateMatch: null }));
  }, []);

  return {
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
  };
}
