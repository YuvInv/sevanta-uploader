/**
 * URL utilities for IVC company pages
 *
 * Real URL pattern: https://www.ivc-online.com/Company-Card?id=GUID
 */

/**
 * Check if URL is an IVC company page
 */
export function isIvcCompanyPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'www.ivc-online.com' &&
      parsed.pathname.toLowerCase() === '/company-card' &&
      !!parsed.searchParams.get('id')
    );
  } catch {
    return false;
  }
}

/**
 * Extract company ID (GUID) from IVC URL
 * "https://www.ivc-online.com/Company-Card?id=333B991A-9D02-F111-B81C-00505695CD29" -> "333B991A-..."
 */
export function extractIvcId(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('id');
  } catch {
    return null;
  }
}
