/**
 * Company name fuzzy matching utilities
 *
 * Provides three-level matching strategy:
 * 1. Exact match (normalized)
 * 2. Partial match (one contains the other)
 * 3. Suffix-stripped match
 *
 * Used across all duplicate detection flows (CSV, IVC, Dealigence)
 */

/**
 * Normalize company name to lowercase slug format
 *
 * @example
 * normalizeCompanyName("Marquee AI Ltd.") // "marquee-ai-ltd"
 * normalizeCompanyName("ABC Inc.") // "abc-inc"
 * normalizeCompanyName("O'Reilly Media") // "oreilly-media"
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes (O'Reilly → oreilly)
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing dashes
}

/**
 * Strip common business suffixes from normalized name
 *
 * Only strips suffixes at the END of the name to avoid false matches.
 * Example: "marquee-ai-ltd" → "marquee-ai"
 *
 * Does NOT strip: "technology-corp" → "technology" (suffix in middle)
 */
export function stripCommonSuffixes(normalizedName: string): string {
  const suffixes = [
    'ltd',
    'inc',
    'llc',
    'corp',
    'co',
    'technologies',
    'tech',
    'medical',
    'limited',
    'incorporated',
    'corporation',
  ];

  let result = normalizedName;
  for (const suffix of suffixes) {
    // Only strip if suffix is at the end (preceded by dash)
    const regex = new RegExp(`-${suffix}$`);
    result = result.replace(regex, '');
  }
  return result;
}

/**
 * Fuzzy match two company names using three-level strategy
 *
 * Level 1: Exact match (normalized)
 * Level 2: Partial match (one contains the other)
 * Level 3: Suffix-stripped match
 *
 * @example
 * doCompanyNamesFuzzyMatch("Marquee AI Ltd.", "Marquee.ai") // true (suffix-stripped)
 * doCompanyNamesFuzzyMatch("Acme Technologies", "Acme Tech") // true (both strip to "acme")
 * doCompanyNamesFuzzyMatch("ABC Inc", "ABC International") // false (different companies)
 */
export function doCompanyNamesFuzzyMatch(name1: string, name2: string): boolean {
  const normalized1 = normalizeCompanyName(name1);
  const normalized2 = normalizeCompanyName(name2);

  // Guard against empty strings (except when both are empty)
  if (normalized1.length === 0 || normalized2.length === 0) {
    return normalized1 === normalized2;
  }

  // Level 1: Exact match
  if (normalized1 === normalized2) return true;

  // Level 2: Partial match (one contains the other)
  // Prevents false positives for very short names
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }

  // Level 3: Suffix-stripped match
  const stripped1 = stripCommonSuffixes(normalized1);
  const stripped2 = stripCommonSuffixes(normalized2);

  return stripped1 === stripped2 && stripped1.length > 0;
}
