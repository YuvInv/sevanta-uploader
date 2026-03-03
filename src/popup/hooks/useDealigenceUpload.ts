/**
 * Hook for managing Dealigence upload flow
 * Handles CRM data transformation and upload (duplicate checking is now in useDealigenceDuplicateCheck)
 */

import { useState, useCallback } from 'react';
import type { DealigenceCompanyData, DealigenceStakeholder } from '../../lib/dealigence/types';
import {
  mapToCrmDeal,
  mapToCrmContact,
  buildMetadataComment,
} from '../../lib/dealigence/transformers';

export type UploadStep = 'idle' | 'uploading' | 'success' | 'error';
export type SuccessAction = 'created-new' | 'added-contacts' | 'added-comment';

export function useDealigenceUpload() {
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [crmData, setCrmData] = useState<Record<string, string>>({});
  const [includeFounder, setIncludeFounder] = useState(true);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [createdDealId, setCreatedDealId] = useState<string | undefined>();
  const [successAction, setSuccessAction] = useState<SuccessAction | undefined>();

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
        setSuccessAction('created-new');
        setUploadStep('success');
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
        setUploadStep('error');
      }
    },
    [crmData, includeFounder]
  );

  /** Add extracted founders (already filtered to new-only) to an existing CRM deal */
  const uploadContactsToExisting = useCallback(
    async (dealId: string, founders: DealigenceStakeholder[]) => {
      setUploadStep('uploading');
      setUploadError(undefined);

      try {
        for (const founder of founders) {
          const founderData = mapToCrmContact(founder, dealId);
          const response = await chrome.runtime.sendMessage({
            type: 'CREATE_CONTACT',
            data: founderData,
            companyId: dealId,
          });

          if (!response?.success) {
            console.warn('[Sevanta] Contact creation failed:', response?.error);
          }
        }

        setCreatedDealId(dealId);
        setSuccessAction('added-contacts');
        setUploadStep('success');
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Failed to add contacts');
        setUploadStep('error');
      }
    },
    []
  );

  /** Add extracted data as a metadata comment to an existing CRM deal */
  const addCommentToExisting = useCallback(async (dealId: string, data: DealigenceCompanyData) => {
    setUploadStep('uploading');
    setUploadError(undefined);

    try {
      const comment = buildMetadataComment(data);
      const response = await chrome.runtime.sendMessage({
        type: 'ADD_DEAL_COMMENT',
        dealId,
        comment,
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to add comment');
      }

      setCreatedDealId(dealId);
      setSuccessAction('added-comment');
      setUploadStep('success');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to add comment');
      setUploadStep('error');
    }
  }, []);

  const reset = useCallback(() => {
    setUploadStep('idle');
    setCrmData({});
    setIncludeFounder(true);
    setUploadError(undefined);
    setCreatedDealId(undefined);
    setSuccessAction(undefined);
  }, []);

  return {
    uploadStep,
    crmData,
    includeFounder,
    uploadError,
    createdDealId,
    successAction,
    isUploading: uploadStep === 'uploading',
    upload,
    uploadContactsToExisting,
    addCommentToExisting,
    updateCrmData,
    toggleFounder,
    reset,
  };
}
