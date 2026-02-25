/**
 * Hook for managing Timeless upload flow
 * Supports two paths:
 * - uploadNew: Create new deal + memo comment + founder contacts
 * - uploadComment: Add memo comment to an existing deal
 */

import { useState, useCallback } from 'react';
import type { TimelessMemoData } from '../../lib/timeless/types';
import {
  mapToCrmDeal,
  mapToCrmContact,
  buildMemoComment,
} from '../../lib/timeless/transformers';

export type TimelessUploadStep = 'idle' | 'uploading' | 'success' | 'error';

export function useTimelessUpload() {
  const [uploadStep, setUploadStep] = useState<TimelessUploadStep>('idle');
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [createdDealId, setCreatedDealId] = useState<string | undefined>();
  const [commentedDealId, setCommentedDealId] = useState<string | undefined>();

  /**
   * Upload as a new company: create deal + memo comment + founder contacts
   */
  const uploadNew = useCallback(async (data: TimelessMemoData, overrides?: { industryId?: string }) => {
    setUploadStep('uploading');
    setUploadError(undefined);

    try {
      const dealData = mapToCrmDeal(data, overrides);

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

      // Add full memo as comment
      const memoComment = buildMemoComment(data);
      const commentResponse = await chrome.runtime.sendMessage({
        type: 'ADD_DEAL_COMMENT',
        dealId,
        comment: memoComment,
      });

      if (!commentResponse?.success) {
        console.warn('[Sevanta] Failed to add memo comment:', commentResponse?.error);
      }

      // Create founder contacts
      if (data.founders.length > 0) {
        for (const founder of data.founders) {
          const contactData = mapToCrmContact(founder, dealId);
          const contactResponse = await chrome.runtime.sendMessage({
            type: 'CREATE_CONTACT',
            data: contactData,
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
  }, []);

  /**
   * Upload memo as comment to an existing company
   */
  const uploadComment = useCallback(async (dealId: string, data: TimelessMemoData) => {
    setUploadStep('uploading');
    setUploadError(undefined);

    try {
      const memoComment = buildMemoComment(data);
      const commentResponse = await chrome.runtime.sendMessage({
        type: 'ADD_DEAL_COMMENT',
        dealId,
        comment: memoComment,
      });

      if (!commentResponse?.success) {
        throw new Error(commentResponse?.error || 'Failed to add comment');
      }

      setCommentedDealId(dealId);
      setUploadStep('success');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to add comment');
      setUploadStep('error');
    }
  }, []);

  const reset = useCallback(() => {
    setUploadStep('idle');
    setUploadError(undefined);
    setCreatedDealId(undefined);
    setCommentedDealId(undefined);
  }, []);

  return {
    uploadStep,
    uploadError,
    createdDealId,
    commentedDealId,
    isUploading: uploadStep === 'uploading',
    uploadNew,
    uploadComment,
    reset,
  };
}
