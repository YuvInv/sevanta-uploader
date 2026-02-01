import { useState, useCallback } from 'react';
import type {
  LookupContact,
  ContactLookupResult,
  ContactLookupProgress,
  CRMContact,
  MatchType,
  MessageResponse,
} from '../../lib/types';
import type { SearchedContact } from '../../lib/api';
import { parseContactInput, normalizeEmail, namesMatch } from '../../lib/contactLookup';

type LookupStep = 'input' | 'searching' | 'results';

export function useContactLookup() {
  const [step, setStep] = useState<LookupStep>('input');
  const [inputText, setInputText] = useState('');
  const [parsedContacts, setParsedContacts] = useState<LookupContact[]>([]);
  const [results, setResults] = useState<ContactLookupResult[]>([]);
  const [progress, setProgress] = useState<ContactLookupProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseInput = useCallback((text: string) => {
    setInputText(text);
    const contacts = parseContactInput(text);
    setParsedContacts(contacts);
    return contacts;
  }, []);

  const searchContact = useCallback(async (contact: LookupContact): Promise<CRMContact[]> => {
    const matches: CRMContact[] = [];

    // First, search by email if available (most reliable)
    if (contact.email) {
      const response = (await chrome.runtime.sendMessage({
        type: 'SEARCH_CONTACTS',
        email: contact.email,
      })) as MessageResponse<SearchedContact[]>;

      if (response.success && response.data) {
        for (const c of response.data) {
          matches.push({
            contactId: c.contactId,
            name: c.name,
            email: c.email,
            company: c.company,
            companyId: c.companyId,
          });
        }
      }
    }

    // If no email matches, search by name
    if (matches.length === 0 && contact.name) {
      const response = (await chrome.runtime.sendMessage({
        type: 'SEARCH_CONTACTS',
        name: contact.name,
      })) as MessageResponse<SearchedContact[]>;

      if (response.success && response.data) {
        for (const c of response.data) {
          // Check if this contact is already in matches
          if (!matches.some((m) => m.contactId === c.contactId)) {
            matches.push({
              contactId: c.contactId,
              name: c.name,
              email: c.email,
              company: c.company,
              companyId: c.companyId,
            });
          }
        }
      }
    }

    return matches;
  }, []);

  const determineMatchType = useCallback(
    (
      contact: LookupContact,
      crmMatches: CRMContact[]
    ): { matchType: MatchType; bestMatch?: CRMContact } => {
      if (crmMatches.length === 0) {
        return { matchType: 'none' };
      }

      // Check for strong match (email match)
      if (contact.email) {
        const emailMatch = crmMatches.find(
          (m) => m.email && normalizeEmail(m.email) === normalizeEmail(contact.email!)
        );
        if (emailMatch) {
          return { matchType: 'strong', bestMatch: emailMatch };
        }
      }

      // Check for possible match (name match)
      const nameMatch = crmMatches.find((m) => namesMatch(m.name, contact.name));
      if (nameMatch) {
        return { matchType: 'possible', bestMatch: nameMatch };
      }

      // If we have matches but none are strong or name matches, still return as possible
      // (the API returned them for a reason)
      return { matchType: 'possible', bestMatch: crmMatches[0] };
    },
    []
  );

  const startLookup = useCallback(async () => {
    if (parsedContacts.length === 0) {
      setError('No contacts to look up. Please enter at least one contact.');
      return;
    }

    setStep('searching');
    setError(null);
    setResults([]);
    setProgress({
      total: parsedContacts.length,
      completed: 0,
      strongCount: 0,
      possibleCount: 0,
    });

    const lookupResults: ContactLookupResult[] = [];
    let strongCount = 0;
    let possibleCount = 0;

    for (let i = 0; i < parsedContacts.length; i++) {
      const contact = parsedContacts[i];

      setProgress((prev) => ({
        ...prev!,
        current: contact.name || contact.email || 'Unknown',
        completed: i,
      }));

      try {
        const crmMatches = await searchContact(contact);
        const { matchType, bestMatch } = determineMatchType(contact, crmMatches);

        if (matchType === 'strong') strongCount++;
        else if (matchType === 'possible') possibleCount++;

        lookupResults.push({
          id: contact.id,
          input: contact,
          matchType,
          bestMatch,
          allMatches: crmMatches,
        });

        setProgress((prev) => ({
          ...prev!,
          completed: i + 1,
          strongCount,
          possibleCount,
        }));
      } catch {
        // On error, mark as no match and continue
        lookupResults.push({
          id: contact.id,
          input: contact,
          matchType: 'none',
          allMatches: [],
        });
      }
    }

    setResults(lookupResults);
    setStep('results');
    setProgress(null);
  }, [parsedContacts, searchContact, determineMatchType]);

  const reset = useCallback(() => {
    setStep('input');
    setInputText('');
    setParsedContacts([]);
    setResults([]);
    setProgress(null);
    setError(null);
  }, []);

  // Computed values
  const strongCount = results.filter((r) => r.matchType === 'strong').length;
  const possibleCount = results.filter((r) => r.matchType === 'possible').length;
  const noneCount = results.filter((r) => r.matchType === 'none').length;

  return {
    // State
    step,
    inputText,
    parsedContacts,
    results,
    progress,
    error,

    // Computed
    strongCount,
    possibleCount,
    noneCount,

    // Actions
    parseInput,
    startLookup,
    reset,
  };
}
