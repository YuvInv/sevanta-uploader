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

        // Process batch in parallel, reporting progress as each company completes
        const batchPromises = batch.map(async (company, batchIndex) => {
          // Report that we're starting this company
          if (onProgress) {
            onProgress({
              current: completedCount,
              total: companies.length,
              currentCompany: company.data.CompanyName || 'Unknown',
            });
          }

          const result = await checkSingleCompany(company);

          // Store result at correct index and update progress
          results[batchStartIndex + batchIndex] = result;
          completedCount++;

          // Report progress after this company completes
          if (onProgress) {
            // Show the next company being processed, or stay on current if last
            const nextInBatch = batch[batchIndex + 1];
            const nextAfterBatch = companies[i + DUPLICATE_CHECK_BATCH_SIZE];
            const nextCompany = nextInBatch || nextAfterBatch;
            onProgress({
              current: completedCount,
              total: companies.length,
              currentCompany: nextCompany?.data.CompanyName || '',
            });
          }

          return result;
        });

        await Promise.all(batchPromises);
      }

      return results;
    },
    []
  );

  return { checkDuplicates };
}
