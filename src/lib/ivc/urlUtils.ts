/**
 * URL utilities for IVC company pages
 *
 * URL formats:
 * - Query param: https://www.ivc-online.com/Company-Card?id=GUID  (id/Id both seen)
 * - Path-based:  https://www.ivc-online.com/Company-Card/Id/GUID
 */

const IVC_PATH_REGEX = /^\/company-card\/id\/([0-9a-f-]+)$/i;

/** Case-insensitive search for 'id' query param (IVC uses both ?id= and ?Id=) */
function getIdParam(params: URLSearchParams): string | null {
  for (const [key, value] of params) {
    if (key.toLowerCase() === 'id') return value;
  }
  return null;
}

/**
 * Check if URL is an IVC company page
 */
export function isIvcCompanyPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'www.ivc-online.com') return false;
    const path = parsed.pathname.toLowerCase();
    return (
      (path === '/company-card' && !!getIdParam(parsed.searchParams)) ||
      IVC_PATH_REGEX.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Extract company ID (GUID) from IVC URL
 * Handles both ?id=GUID and /Id/GUID formats
 */
export function extractIvcId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const queryId = getIdParam(parsed.searchParams);
    if (queryId) return queryId;
    const match = parsed.pathname.match(IVC_PATH_REGEX);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
