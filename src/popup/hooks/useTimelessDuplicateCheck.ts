/**
 * Hook that auto-triggers duplicate check when Timeless extraction data becomes available.
 * Returns all matches so the user can pick which company to add the comment to.
 */

import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { TimelessMemoData } from '../../lib/timeless/types';

export type TimelessDuplicateStep = 'idle' | 'checking' | 'found' | 'clear' | 'error';

export interface TimelessDuplicateMatch {
  name: string;
  id?: string;
}

export interface TimelessDuplicateResult {
  step: TimelessDuplicateStep;
  matches: TimelessDuplicateMatch[];
}

type Action =
  | { type: 'reset' }
  | { type: 'checking' }
  | { type: 'found'; matches: TimelessDuplicateMatch[] }
  | { type: 'clear' }
  | { type: 'error' };

function reducer(_state: TimelessDuplicateResult, action: Action): TimelessDuplicateResult {
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

function companyKey(data: TimelessMemoData): string {
  return data.companyName;
}

export function useTimelessDuplicateCheck(data: TimelessMemoData | undefined) {
  const [result, dispatch] = useReducer(reducer, { step: 'idle', matches: [] });
  const lastKeyRef = useRef<string | null>(null);

  const runCheck = useCallback(async (company: TimelessMemoData, key: string) => {
    dispatch({ type: 'checking' });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_DUPLICATE',
        companyName: company.companyName,
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
      console.error('[Sevanta] Timeless duplicate check failed:', error);
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
