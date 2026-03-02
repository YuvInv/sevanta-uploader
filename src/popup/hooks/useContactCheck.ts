/**
 * Hook that checks which extracted people already exist as contacts
 * for a given deal in the CRM. Returns existing contact names for
 * comparison so the UI can show which people need to be created.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseContactCheckResult {
  existingNames: string[];
  isChecking: boolean;
}

/**
 * Normalize a name for fuzzy comparison (lowercase, trim, collapse whitespace).
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if two names match (fuzzy: ignores case, extra whitespace).
 */
export function namesMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

export function useContactCheck(dealId: string | undefined): UseContactCheckResult {
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const lastDealIdRef = useRef<string | undefined>();

  const fetchContacts = useCallback(async (id: string) => {
    setIsChecking(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_DEAL_CONTACTS',
        dealId: id,
      });

      if (lastDealIdRef.current !== id) return;

      if (response?.success && Array.isArray(response.data)) {
        const names = response.data.map((c: { name: string }) => c.name).filter(Boolean);
        setExistingNames(names);
      } else {
        setExistingNames([]);
      }
    } catch (error) {
      console.error('[Sevanta] Failed to fetch deal contacts:', error);
      setExistingNames([]);
    } finally {
      if (lastDealIdRef.current === id) {
        setIsChecking(false);
      }
    }
  }, []);

  useEffect(() => {
    lastDealIdRef.current = dealId;

    if (!dealId) {
      setExistingNames([]);
      setIsChecking(false);
      return;
    }

    fetchContacts(dealId);
  }, [dealId, fetchContacts]);

  return { existingNames, isChecking };
}
