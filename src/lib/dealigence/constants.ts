/**
 * Constants for Dealigence extraction
 */

// Retry configuration for stale data validation
// Increased values to handle slow networks and SPA navigation delays
// Total max wait: ~8.5s (handles slow Dealigence renders)
export const EXTRACTION_MAX_RETRIES = 6;
export const EXTRACTION_INITIAL_DELAY_MS = 300;
export const EXTRACTION_DELAY_MULTIPLIER = 1.8;
export const EXTRACTION_MAX_DELAY_MS = 3000;

// Dealigence URLs
export const DEALIGENCE_BASE_URL = 'https://dealigence.vc';
