/**
 * Hook for managing Dealigence upload flow
 * Handles duplicate checking, CRM data transformation, and upload
 */

import { useState, useCallback } from 'react';
import type { DealigenceCompanyData } from '../../lib/dealigence/types';
import { mapToCrmDeal, mapToCrmContact } from '../../lib/dealigence/transformers';

export type UploadStep = 'idle' | 'checking' | 'ready' | 'uploading' | 'success' | 'error';

export function useDealigenceUpload() {
  // Upload flow state
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [crmData, setCrmData] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | undefined>();
  const [includeFounder, setIncludeFounder] = useState(true);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [createdDealId, setCreatedDealId] = useState<string | undefined>();

  // Check for duplicates in CRM
  const checkDuplicate = useCallback(async (data: DealigenceCompanyData): Promise<boolean> => {
    setUploadStep('checking');
    setDuplicateWarning(undefined);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_DUPLICATE',
        companyName: data.companyName,
        website: data.website,
      });

      if (response?.success && response.data?.isDuplicate) {
        const match = response.data.matches?.[0];
        const warningMsg = match
          ? `Similar company found: "${match.CompanyName}"`
          : 'A similar company may already exist in the CRM.';
        setDuplicateWarning(warningMsg);
        setUploadStep('ready');
        return true;
      }

      setUploadStep('ready');
      return false;
    } catch (error) {
      console.error('[Sevanta] Duplicate check failed:', error);
      // Continue with upload even if duplicate check fails
      setUploadStep('ready');
      return false;
    }
  }, []);

  // Update CRM data
  const updateCrmData = useCallback((data: Record<string, string>) => {
    setCrmData(data);
  }, []);

  // Toggle founder contact creation
  const toggleFounder = useCallback(() => {
    setIncludeFounder((prev) => !prev);
  }, []);

  // Upload to CRM
  const upload = useCallback(
    async (data: DealigenceCompanyData) => {
      setUploadStep('uploading');
      setUploadError(undefined);

      try {
        // Transform to CRM format (or use edited data)
        const dealData = Object.keys(crmData).length > 0 ? crmData : mapToCrmDeal(data);

        // Create deal
        const dealResponse = await chrome.runtime.sendMessage({
          type: 'CREATE_DEAL',
          data: dealData,
        });

        if (!dealResponse?.success) {
          throw new Error(dealResponse?.error || 'Failed to create deal');
        }

        const dealId = dealResponse.data?.dealId;
        if (!dealId) {
          throw new Error('No deal ID returned');
        }

        // Create founder contact if requested
        if (includeFounder && data.founders.length > 0) {
          const founderData = mapToCrmContact(data.founders[0], dealId);
          const contactResponse = await chrome.runtime.sendMessage({
            type: 'CREATE_CONTACT',
            data: founderData,
            companyId: dealId,
          });

          if (!contactResponse?.success) {
            console.warn('[Sevanta] Founder contact creation failed:', contactResponse?.error);
            // Don't fail the whole upload if contact creation fails
          }
        }

        setCreatedDealId(dealId);
        setUploadStep('success');
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
        setUploadStep('error');
      }
    },
    [crmData, includeFounder]
  );

  // Reset state for another upload
  const reset = useCallback(() => {
    setUploadStep('idle');
    setCrmData({});
    setDuplicateWarning(undefined);
    setIncludeFounder(true);
    setUploadError(undefined);
    setCreatedDealId(undefined);
  }, []);

  return {
    // State
    uploadStep,
    crmData,
    duplicateWarning,
    includeFounder,
    uploadError,
    createdDealId,

    // Computed
    isUploading: uploadStep === 'uploading',

    // Actions
    checkDuplicate,
    updateCrmData,
    toggleFounder,
    upload,
    reset,
  };
}
