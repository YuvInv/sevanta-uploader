/**
 * URL utilities for Timeless meeting memo pages
 */

const TIMELESS_MEMO_REGEX = /^https:\/\/my\.timeless\.day\/m\/.+/;

/**
 * Check if a URL is a Timeless meeting memo page
 */
export function isTimelessMemoPage(url: string): boolean {
  return TIMELESS_MEMO_REGEX.test(url);
}
