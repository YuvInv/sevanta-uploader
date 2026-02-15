/**
 * Hook that auto-triggers duplicate check when Dealigence extraction data becomes available.
 * Sends CHECK_DUPLICATE message to background and tracks results per company.
 */

import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { DealigenceCompanyData } from '../../lib/dealigence/types';

export type DuplicateCheckStep = 'idle' | 'checking' | 'found' | 'clear' | 'error';

export interface DuplicateCheckMatch {
  name: string;
  id?: string;
}

export interface DuplicateCheckResult {
  step: DuplicateCheckStep;
  match?: DuplicateCheckMatch;
}

type Action =
  | { type: 'reset' }
  | { type: 'checking' }
  | { type: 'found'; match?: DuplicateCheckMatch }
  | { type: 'clear' }
  | { type: 'error' };

function reducer(_state: DuplicateCheckResult, action: Action): DuplicateCheckResult {
  switch (action.type) {
    case 'reset':
      return { step: 'idle' };
    case 'checking':
      return { step: 'checking' };
    case 'found':
      return { step: 'found', match: action.match };
    case 'clear':
      return { step: 'clear' };
    case 'error':
      return { step: 'error' };
  }
}

/** Build a stable key for a company to detect when we're looking at a new one */
function companyKey(data: DealigenceCompanyData): string {
  return `${data.companyName}|${data.website ?? ''}`;
}

export function useDealigenceDuplicateCheck(data: DealigenceCompanyData | undefined) {
  const [result, dispatch] = useReducer(reducer, { step: 'idle' });
  const lastKeyRef = useRef<string | null>(null);

  const runCheck = useCallback(async (company: DealigenceCompanyData, key: string) => {
    dispatch({ type: 'checking' });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_DUPLICATE',
        companyName: company.companyName,
        website: company.website,
      });

      // Discard if company changed while we were checking
      if (lastKeyRef.current !== key) return;

      if (response?.success && response.data?.isDuplicate) {
        const match = response.data.matches?.[0];
        dispatch({
          type: 'found',
          match: match ? { name: match.CompanyName, id: match.id } : undefined,
        });
      } else {
        dispatch({ type: 'clear' });
      }
    } catch (error) {
      // Discard if company changed
      if (lastKeyRef.current !== key) return;

      console.error('[Sevanta] Duplicate check failed:', error);
      // Fail-open: treat API errors as clear so upload is still allowed
      dispatch({ type: 'error' });
    }
  }, []);

  useEffect(() => {
    if (!data) {
      lastKeyRef.current = null;
      dispatch({ type: 'reset' });
      return;
    }

    const key = companyKey(data);
    if (key === lastKeyRef.current) return; // Same company, skip re-check

    lastKeyRef.current = key;
    runCheck(data, key);
  }, [data, runCheck]);

  /** Force re-check of current company */
  const recheck = useCallback(() => {
    if (!data) return;
    const key = companyKey(data);
    lastKeyRef.current = key;
    runCheck(data, key);
  }, [data, runCheck]);

  return { duplicateCheck: result, recheck };
}
