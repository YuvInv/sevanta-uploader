/**
 * Generic duplicate check hook for Quick Upload (works with any site data).
 * Takes company name and optional website, runs CHECK_DUPLICATE against CRM.
 */

import { useReducer, useEffect, useRef, useCallback } from 'react';

export type DuplicateCheckStep = 'idle' | 'checking' | 'found' | 'clear' | 'error';

export interface DuplicateCheckMatch {
  name: string;
  id?: string;
}

export interface DuplicateCheckResult {
  step: DuplicateCheckStep;
  match?: DuplicateCheckMatch;
}

interface CompanyIdentifier {
  companyName: string;
  website?: string;
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

function companyKey(data: CompanyIdentifier): string {
  return `${data.companyName}|${data.website ?? ''}`;
}

export function useQuickUploadDuplicateCheck(data: CompanyIdentifier | undefined) {
  const [result, dispatch] = useReducer(reducer, { step: 'idle' });
  const lastKeyRef = useRef<string | null>(null);

  const runCheck = useCallback(async (company: CompanyIdentifier, key: string) => {
    dispatch({ type: 'checking' });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_DUPLICATE',
        companyName: company.companyName,
        website: company.website,
      });

      if (lastKeyRef.current !== key) return;

      if (response?.success && response.data?.isDuplicate) {
        const match = response.data.matches?.[0];
        dispatch({
          type: 'found',
          match: match ? { name: match.CompanyName, id: match.CompanyID?.toString() } : undefined,
        });
      } else {
        dispatch({ type: 'clear' });
      }
    } catch (error) {
      if (lastKeyRef.current !== key) return;
      console.error('[Sevanta] Duplicate check failed:', error);
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
    if (key === lastKeyRef.current) return;

    lastKeyRef.current = key;
    runCheck(data, key);
  }, [data, runCheck]);

  const recheck = useCallback(() => {
    if (!data) return;
    const key = companyKey(data);
    lastKeyRef.current = key;
    runCheck(data, key);
  }, [data, runCheck]);

  return { duplicateCheck: result, recheck };
}
