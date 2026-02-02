/**
 * Parsing utilities for Dealigence data
 */

/**
 * Parse funding amount string to number
 * Examples: "$1m" → 1000000, "$500k" → 500000, "$1.5M" → 1500000
 */
export function parseFundingAmount(amount: string | undefined): number | null {
  if (!amount) return null;

  // Remove currency symbols and whitespace
  const cleaned = amount.replace(/[$€£\s,]/g, '').toLowerCase();

  // Match number with optional multiplier
  const match = cleaned.match(/^([\d.]+)(k|m|b)?$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  if (isNaN(value)) return null;

  const multiplier = match[2]?.toLowerCase();
  switch (multiplier) {
    case 'k':
      return value * 1000;
    case 'm':
      return value * 1000000;
    case 'b':
      return value * 1000000000;
    default:
      return value;
  }
}

/**
 * Format funding amount for CRM (in millions)
 * Returns string like "1.5" for $1.5M
 */
export function formatFundingForCrm(amount: string | undefined): string | undefined {
  const parsed = parseFundingAmount(amount);
  if (parsed === null) return undefined;

  // Convert to millions
  const millions = parsed / 1000000;

  // Format with up to 2 decimal places, removing trailing zeros
  return millions.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Parse established date string to ISO date format
 * Examples: "March 2022" → "2022-03-01", "2015-01-01" → "2015-01-01"
 */
export function parseEstablishedDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;

  // If already in ISO format (YYYY-MM-DD), return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try to parse "Month Year" format
  const monthNames: Record<string, string> = {
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12',
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };

  const monthYearMatch = dateStr.toLowerCase().match(/^([a-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const month = monthNames[monthYearMatch[1]];
    const year = monthYearMatch[2];
    if (month && year) {
      return `${year}-${month}-01`;
    }
  }

  // Try to parse just year
  const yearMatch = dateStr.match(/^(\d{4})$/);
  if (yearMatch) {
    return `${yearMatch[1]}-01-01`;
  }

  // Try native Date parsing as fallback
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Parsing failed
  }

  return null;
}

/**
 * Extract year from established date
 */
export function extractYear(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;

  const isoDate = parseEstablishedDate(dateStr);
  if (isoDate) {
    return isoDate.substring(0, 4);
  }

  // Try to find a 4-digit year
  const yearMatch = dateStr.match(/(\d{4})/);
  return yearMatch?.[1];
}

/**
 * Clean and normalize website URL
 * - Adds https:// if missing
 * - Removes trailing slashes
 * - Removes common tracking parameters
 */
export function cleanWebsiteUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  let cleaned = url.trim();

  // Add protocol if missing
  if (!cleaned.match(/^https?:\/\//i)) {
    cleaned = 'https://' + cleaned;
  }

  // Parse and clean
  try {
    const parsed = new URL(cleaned);

    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source'];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Reconstruct URL
    cleaned = parsed.origin + parsed.pathname;

    // Remove trailing slash (but keep root slash)
    if (cleaned.endsWith('/') && cleaned.split('/').length > 4) {
      cleaned = cleaned.slice(0, -1);
    }

    return cleaned;
  } catch {
    // URL parsing failed, return original
    return url;
  }
}

/**
 * Clean LinkedIn URL
 * Ensures proper formatting for company or personal LinkedIn URLs
 */
export function cleanLinkedInUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  let cleaned = url.trim();

  // Add protocol if missing
  if (!cleaned.match(/^https?:\/\//i)) {
    cleaned = 'https://' + cleaned;
  }

  // Ensure it's a LinkedIn URL
  if (!cleaned.includes('linkedin.com')) {
    return undefined;
  }

  // Parse and clean
  try {
    const parsed = new URL(cleaned);

    // Remove tracking parameters
    parsed.search = '';

    // Remove trailing slash
    let path = parsed.pathname;
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    return parsed.origin + path;
  } catch {
    return url;
  }
}
