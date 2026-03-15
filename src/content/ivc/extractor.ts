/**
 * IVC company data extractor
 * Reads DOM elements using stable ID suffix selectors
 */

import type { IvcCompanyData, IvcStakeholder } from '../../lib/ivc/types';
import { stripDisplaySuffixes } from '../../lib/nameMatching';
import * as sel from './selectors';

/** Strip honorific prefixes (Mr., Ms., Dr., Prof., etc.) from names */
function stripHonorific(name: string): string {
  return name.replace(/^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Prof\.?)\s+/i, '');
}

/** Get text content from first matching element, trimmed */
function getText(selector: string): string | undefined {
  const el = document.querySelector(selector);
  const text = el?.textContent?.trim();
  return text || undefined;
}

/** Extract website URL from the website row */
function extractWebsite(): string | undefined {
  const row = document.querySelector(sel.WEBSITE_ROW);
  if (!row) return undefined;
  const link = row.querySelector('a');
  return link?.href || undefined;
}

/** Extract LinkedIn URL from the account table */
function extractLinkedin(): string | undefined {
  const table = document.querySelector(sel.LINKEDIN_TABLE);
  if (!table) return undefined;
  const link = table.querySelector('a[href*="linkedin.com"]');
  return (link as HTMLAnchorElement)?.href || undefined;
}

/** Extract management team by iterating numbered elements */
function extractManagement(): IvcStakeholder[] {
  const management: IvcStakeholder[] = [];

  for (let i = 0; i < 50; i++) {
    const nameEl = document.querySelector(`[id$="${sel.MANAGEMENT_NAME_PREFIX}${i}"]`);
    if (!nameEl) break;

    const name = nameEl.textContent?.trim();
    if (!name) continue;

    // Title is in the next <td> sibling of the name's <td>
    const nameTd = nameEl.closest('td');
    const titleTd = nameTd?.nextElementSibling;
    const title = titleTd?.textContent?.trim() || undefined;

    // Check for email link in the same row
    const row = nameEl.closest('tr');
    const emailLink = row?.querySelector(sel.CONTACT_EMAIL) as HTMLAnchorElement | null;
    const email = emailLink?.href?.replace('mailto:', '') || undefined;

    management.push({ name: stripHonorific(name), title, email });
  }

  return management;
}

/** Extract tags from tag links */
function extractTags(): string[] {
  const tagLinks = document.querySelectorAll(sel.TAG_LINKS);
  return Array.from(tagLinks)
    .map((el) => el.textContent?.trim())
    .filter((t): t is string => !!t);
}

/**
 * Extract all company data from the current IVC page
 */
export function extractIvcCompanyData(): IvcCompanyData {
  return {
    companyName: stripDisplaySuffixes(getText(sel.COMPANY_NAME) || 'Unknown Company'),
    description: getText(sel.DESCRIPTION),
    website: extractWebsite(),
    linkedinUrl: extractLinkedin(),
    sector: getText(sel.SECTOR),
    stage: getText(sel.STAGE),
    established: getText(sel.ESTABLISHED),
    employees: getText(sel.EMPLOYEES),
    technology: getText(sel.TECHNOLOGY),
    targetMarkets: getText(sel.TARGET_MARKETS),
    businessModel: getText(sel.BUSINESS_MODEL),
    totalCapital: getText(sel.TOTAL_CAPITAL),
    tags: extractTags(),
    management: extractManagement(),
    sourceUrl: window.location.href,
  };
}
