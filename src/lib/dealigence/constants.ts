/**
 * Constants for Dealigence extraction
 */

// Retry configuration for stale data validation
// Content script now waits up to 5s for DOM data, so fewer retries needed here
// These retries handle SPA navigation where DOM hasn't updated yet
export const EXTRACTION_MAX_RETRIES = 3;
export const EXTRACTION_INITIAL_DELAY_MS = 500;
export const EXTRACTION_DELAY_MULTIPLIER = 2;
export const EXTRACTION_MAX_DELAY_MS = 2000;

// Dealigence URLs
export const DEALIGENCE_BASE_URL = 'https://dealigence.vc';
