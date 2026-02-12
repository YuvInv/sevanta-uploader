/**
 * URL utilities for Dealigence company pages
 * Used to validate extracted data against URL slug (ground truth)
 */

import { normalizeCompanyName, stripCommonSuffixes } from '../nameMatching';

const COMPANY_PATH_REGEX = /\/company\/([^/?#]+)/;

/**
 * Check if URL is a Dealigence company page
 */
export function isDealigenceCompanyPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'dealigence.vc' && COMPANY_PATH_REGEX.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Extract company slug from Dealigence URL
 * "https://dealigence.vc/company/leafix-medical" → "leafix-medical"
 */
export function extractSlugFromUrl(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(COMPANY_PATH_REGEX);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Normalize company name to slug format for comparison
 * @deprecated Use normalizeCompanyName from nameMatching.ts instead
 * Kept for backward compatibility
 */
export function normalizeToSlug(name: string): string {
  return normalizeCompanyName(name);
}

/**
 * Check if company name matches URL slug (fuzzy match)
 * Uses shared fuzzy matching logic with slug-specific handling
 */
export function doesCompanyMatchSlug(companyName: string, urlSlug: string): boolean {
  const normalized = normalizeCompanyName(companyName);
  const slug = urlSlug.toLowerCase();

  // Three-level matching (same strategy as general duplicate check)
  // Level 1: Exact match
  if (normalized === slug) return true;

  // Level 2: One contains the other (handles partial names)
  if (normalized.includes(slug) || slug.includes(normalized)) return true;

  // Level 3: Suffix-stripped match
  const normalizedStripped = stripCommonSuffixes(normalized);
  const slugStripped = stripCommonSuffixes(slug);

  return normalizedStripped === slugStripped && normalizedStripped.length > 0;
}
