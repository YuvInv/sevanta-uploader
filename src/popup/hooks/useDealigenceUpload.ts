/**
 * Hook for managing Dealigence upload flow
 * Handles duplicate checking, CRM data transformation, and upload
 */

import { useState, useCallback } from 'react';
import type { DealigenceCompanyData } from '../../lib/dealigence/types';
import {
  mapToCrmDeal,
  mapToCrmContact,
  buildMetadataComment,
} from '../../lib/dealigence/transformers';

export type UploadStep = 'idle' | 'checking' | 'ready' | 'uploading' | 'success' | 'error';

export interface DuplicateMatch {
  name: string;
  id?: string;
}

export function useDealigenceUpload() {
  // Upload flow state
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [crmData, setCrmData] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | undefined>();
  const [includeFounder, setIncludeFounder] = useState(true);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [createdDealId, setCreatedDealId] = useState<string | undefined>();

  // Modal state for duplicate warning
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [pendingUploadData, setPendingUploadData] = useState<DealigenceCompanyData | null>(null);

  // Update CRM data
  const updateCrmData = useCallback((data: Record<string, string>) => {
    setCrmData(data);
  }, []);

  // Toggle founder contact creation
  const toggleFounder = useCallback(() => {
    setIncludeFounder((prev) => !prev);
  }, []);

  // Internal upload function (called after duplicate check passes or user confirms)
  const performUpload = useCallback(
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
          // Non-blocking - deal was created successfully
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
              // Continue with other founders even if one fails
            }
          }
        }

        setCreatedDealId(dealId);
        setUploadStep('success');
        setPendingUploadData(null);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
        setUploadStep('error');
      }
    },
    [crmData, includeFounder]
  );

  // Check for duplicates in CRM and show modal if found
  const checkDuplicateAndUpload = useCallback(
    async (data: DealigenceCompanyData) => {
      setUploadStep('checking');
      setDuplicateWarning(undefined);
      setPendingUploadData(data);

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

          // Set modal state and show modal
          setDuplicateMatch(
            match ? { name: match.CompanyName, id: match.CompanyID?.toString() } : null
          );
          setShowDuplicateModal(true);
          setUploadStep('ready');
          return;
        }

        // No duplicate found, proceed with upload
        setUploadStep('ready');
        await performUpload(data);
      } catch (error) {
        console.error('[Sevanta] Duplicate check failed:', error);
        // Continue with upload even if duplicate check fails
        setUploadStep('ready');
        await performUpload(data);
      }
    },
    [performUpload]
  );

  // Confirm upload after duplicate warning
  const confirmUpload = useCallback(async () => {
    setShowDuplicateModal(false);
    if (pendingUploadData) {
      await performUpload(pendingUploadData);
    }
  }, [pendingUploadData, performUpload]);

  // Cancel upload after duplicate warning
  const cancelUpload = useCallback(() => {
    setShowDuplicateModal(false);
    setPendingUploadData(null);
    setUploadStep('ready');
  }, []);

  // Reset state for another upload
  const reset = useCallback(() => {
    setUploadStep('idle');
    setCrmData({});
    setDuplicateWarning(undefined);
    setIncludeFounder(true);
    setUploadError(undefined);
    setCreatedDealId(undefined);
    setShowDuplicateModal(false);
    setDuplicateMatch(null);
    setPendingUploadData(null);
  }, []);

  return {
    // State
    uploadStep,
    crmData,
    duplicateWarning,
    includeFounder,
    uploadError,
    createdDealId,
    showDuplicateModal,
    duplicateMatch,
    pendingUploadData,

    // Computed
    isUploading: uploadStep === 'uploading',

    // Actions
    checkDuplicateAndUpload,
    confirmUpload,
    cancelUpload,
    updateCrmData,
    toggleFounder,
    reset,
  };
}
