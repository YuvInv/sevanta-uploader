/**
 * Hook for managing Dealigence upload flow
 * Handles CRM data transformation and upload (duplicate checking is now in useDealigenceDuplicateCheck)
 */

import { useState, useCallback } from 'react';
import type { DealigenceCompanyData } from '../../lib/dealigence/types';
import {
  mapToCrmDeal,
  mapToCrmContact,
  buildMetadataComment,
} from '../../lib/dealigence/transformers';

export type UploadStep = 'idle' | 'uploading' | 'success' | 'error';

export function useDealigenceUpload() {
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [crmData, setCrmData] = useState<Record<string, string>>({});
  const [includeFounder, setIncludeFounder] = useState(true);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [createdDealId, setCreatedDealId] = useState<string | undefined>();

  const updateCrmData = useCallback((data: Record<string, string>) => {
    setCrmData(data);
  }, []);

  const toggleFounder = useCallback(() => {
    setIncludeFounder((prev) => !prev);
  }, []);

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

        // Add metadata as comment
        const metadataComment = buildMetadataComment(data);
        const commentResponse = await chrome.runtime.sendMessage({
          type: 'ADD_DEAL_COMMENT',
          dealId: dealId,
          comment: metadataComment,
        });

        if (!commentResponse?.success) {
          console.warn('[Sevanta] Failed to add metadata comment:', commentResponse?.error);
        }

        // Create founder contacts if requested
        if (includeFounder && data.founders.length > 0) {
          for (const founder of data.founders) {
            const founderData = mapToCrmContact(founder, dealId);
            const contactResponse = await chrome.runtime.sendMessage({
              type: 'CREATE_CONTACT',
              data: founderData,
              companyId: dealId,
            });

            if (!contactResponse?.success) {
              console.warn('[Sevanta] Founder contact creation failed:', contactResponse?.error);
            }
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

  const reset = useCallback(() => {
    setUploadStep('idle');
    setCrmData({});
    setIncludeFounder(true);
    setUploadError(undefined);
    setCreatedDealId(undefined);
  }, []);

  return {
    uploadStep,
    crmData,
    includeFounder,
    uploadError,
    createdDealId,
    isUploading: uploadStep === 'uploading',
    upload,
    updateCrmData,
    toggleFounder,
    reset,
  };
}
