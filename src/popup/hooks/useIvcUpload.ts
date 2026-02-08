/**
 * Hook for managing IVC upload flow
 * Handles CRM data transformation and upload
 */

import { useState, useCallback } from 'react';
import type { IvcCompanyData } from '../../lib/ivc/types';
import { mapToCrmDeal, mapToCrmContact, buildMetadataComment } from '../../lib/ivc/transformers';

export type UploadStep = 'idle' | 'uploading' | 'success' | 'error';

export function useIvcUpload() {
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [includeManagement, setIncludeManagement] = useState(true);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [createdDealId, setCreatedDealId] = useState<string | undefined>();

  const toggleManagement = useCallback(() => {
    setIncludeManagement((prev) => !prev);
  }, []);

  const upload = useCallback(
    async (data: IvcCompanyData) => {
      setUploadStep('uploading');
      setUploadError(undefined);

      try {
        // Transform to CRM format
        const dealData = mapToCrmDeal(data);

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
          console.warn('[Sevanta] Failed to add IVC metadata comment:', commentResponse?.error);
        }

        // Create management contacts if requested
        if (includeManagement && data.management.length > 0) {
          for (const person of data.management) {
            const contactData = mapToCrmContact(person, dealId);
            const contactResponse = await chrome.runtime.sendMessage({
              type: 'CREATE_CONTACT',
              data: contactData,
              companyId: dealId,
            });

            if (!contactResponse?.success) {
              console.warn('[Sevanta] Management contact creation failed:', contactResponse?.error);
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
    [includeManagement]
  );

  const reset = useCallback(() => {
    setUploadStep('idle');
    setIncludeManagement(true);
    setUploadError(undefined);
    setCreatedDealId(undefined);
  }, []);

  return {
    uploadStep,
    includeManagement,
    uploadError,
    createdDealId,
    isUploading: uploadStep === 'uploading',
    upload,
    toggleManagement,
    reset,
  };
}
