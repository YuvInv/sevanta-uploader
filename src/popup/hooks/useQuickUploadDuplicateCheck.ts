/**
 * Generic duplicate check hook for Quick Upload (works with any site data).
 * Takes company name and optional website, runs CHECK_DUPLICATE against CRM.
 * Returns all matches so the user can pick which company to update.
 */

import { useReducer, useEffect, useRef, useCallback } from 'react';

export type DuplicateCheckStep = 'idle' | 'checking' | 'found' | 'clear' | 'error';

export interface DuplicateCheckMatch {
  name: string;
  id?: string;
}

export interface DuplicateCheckResult {
  step: DuplicateCheckStep;
  matches: DuplicateCheckMatch[];
}

interface CompanyIdentifier {
  companyName: string;
  website?: string;
}

type Action =
  | { type: 'reset' }
  | { type: 'checking' }
  | { type: 'found'; matches: DuplicateCheckMatch[] }
  | { type: 'clear' }
  | { type: 'error' };

function reducer(_state: DuplicateCheckResult, action: Action): DuplicateCheckResult {
  switch (action.type) {
    case 'reset':
      return { step: 'idle', matches: [] };
    case 'checking':
      return { step: 'checking', matches: [] };
    case 'found':
      return { step: 'found', matches: action.matches };
    case 'clear':
      return { step: 'clear', matches: [] };
    case 'error':
      return { step: 'error', matches: [] };
  }
}

function companyKey(data: CompanyIdentifier): string {
  return `${data.companyName}|${data.website ?? ''}`;
}

export function useQuickUploadDuplicateCheck(data: CompanyIdentifier | undefined) {
  const [result, dispatch] = useReducer(reducer, { step: 'idle', matches: [] });
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
        const allMatches = (response.data.matches || []).map(
          (m: { CompanyName: string; id?: string }) => ({
            name: m.CompanyName,
            id: m.id,
          })
        );
        dispatch({ type: 'found', matches: allMatches });
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
