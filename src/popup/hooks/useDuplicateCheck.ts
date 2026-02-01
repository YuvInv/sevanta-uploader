import { useCallback } from 'react';
import type { Company, DuplicateInfo } from '../../lib/types';
import { DUPLICATE_CHECK_BATCH_SIZE } from '../../lib/constants';

// Check if Chrome extension APIs are available
function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.sendMessage;
}

export interface DuplicateCheckProgress {
  current: number;
  total: number;
  currentCompany: string;
}

type ProgressCallback = (progress: DuplicateCheckProgress) => void;

async function checkSingleCompany(company: Company): Promise<Company> {
  const companyName = company.data.CompanyName;
  const website = company.data.Website;

  if (!companyName && !website) {
    return company;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_DUPLICATE',
      companyName: companyName || '',
      website: website,
    });

    if (response.success && response.data) {
      const { isDuplicate, matches } = response.data;

      if (isDuplicate && matches.length > 0) {
        const match = matches[0];
        const matchedOn =
          match.CompanyName?.toLowerCase() === companyName?.toLowerCase()
            ? match.Website?.toLowerCase() === website?.toLowerCase()
              ? 'both'
              : 'CompanyName'
            : 'Website';

        const duplicateInfo: DuplicateInfo = {
          isDuplicate: true,
          matchedOn: matchedOn as 'CompanyName' | 'Website' | 'both',
          existingDeal: {
            id: match.id || '',
            CompanyName: match.CompanyName,
            Website: match.Website,
          },
        };

        return {
          ...company,
          duplicate: duplicateInfo,
        };
      } else {
        return {
          ...company,
          duplicate: { isDuplicate: false, matchedOn: 'CompanyName' },
        };
      }
    } else {
      // API error - don't block, just skip duplicate check
      return company;
    }
  } catch {
    // Network error - don't block, just skip duplicate check
    return company;
  }
}

export function useDuplicateCheck() {
  const checkDuplicates = useCallback(
    async (companies: Company[], onProgress?: ProgressCallback): Promise<Company[]> => {
      // Guard: If not running as Chrome extension, skip duplicate check
      if (!isChromeExtension()) {
        return companies.map((company) => ({
          ...company,
          duplicate: { isDuplicate: false, matchedOn: 'CompanyName' as const },
        }));
      }

      const results: Company[] = new Array(companies.length);
      let completedCount = 0;

      // Process in batches for parallel execution
      for (let i = 0; i < companies.length; i += DUPLICATE_CHECK_BATCH_SIZE) {
        const batch = companies.slice(i, i + DUPLICATE_CHECK_BATCH_SIZE);
        const batchStartIndex = i;

        // Report progress for the first company in batch
        if (onProgress && batch.length > 0) {
          onProgress({
            current: completedCount,
            total: companies.length,
            currentCompany: batch[0].data.CompanyName || 'Unknown',
          });
        }

        // Process batch in parallel
        const batchResults = await Promise.all(batch.map((company) => checkSingleCompany(company)));

        // Store results at correct indices
        batchResults.forEach((result, batchIndex) => {
          results[batchStartIndex + batchIndex] = result;
          completedCount++;
        });

        // Report progress after batch completes
        if (onProgress) {
          const nextCompany =
            i + DUPLICATE_CHECK_BATCH_SIZE < companies.length
              ? companies[i + DUPLICATE_CHECK_BATCH_SIZE].data.CompanyName || 'Unknown'
              : '';
          onProgress({
            current: completedCount,
            total: companies.length,
            currentCompany: nextCompany,
          });
        }
      }

      return results;
    },
    []
  );

  return { checkDuplicates };
}
