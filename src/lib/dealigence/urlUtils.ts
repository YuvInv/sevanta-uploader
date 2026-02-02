/**
 * URL utilities for Dealigence company pages
 * Used to validate extracted data against URL slug (ground truth)
 */

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
 * "LeaFix Medical" → "leafix-medical"
 */
export function normalizeToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing dashes
}

/**
 * Check if company name matches URL slug (fuzzy match)
 * Handles common suffixes and partial matches
 */
export function doesCompanyMatchSlug(companyName: string, urlSlug: string): boolean {
  const normalized = normalizeToSlug(companyName);
  const slug = urlSlug.toLowerCase();

  // Exact match
  if (normalized === slug) return true;

  // One contains the other (handles partial names)
  if (normalized.includes(slug) || slug.includes(normalized)) return true;

  // Remove common suffixes and compare
  const suffixes = ['ltd', 'inc', 'llc', 'corp', 'co', 'technologies', 'tech', 'medical'];
  const removeSuffixes = (s: string) => {
    let result = s;
    for (const suffix of suffixes) {
      result = result.replace(new RegExp(`-${suffix}$`), '');
    }
    return result;
  };

  const normalizedStripped = removeSuffixes(normalized);
  const slugStripped = removeSuffixes(slug);

  return normalizedStripped === slugStripped;
}
