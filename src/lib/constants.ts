/**
 * Application constants - centralized configuration values
 */

// API Configuration
export const API_BASE_URL = 'https://run.mydealflow.com/inv/api';

// Rate limiting
export const RATE_LIMIT_DELAY_MS = 600; // 100 requests per minute = ~600ms between requests
export const RATE_LIMIT_MAX_QUEUE_SIZE = 100; // Maximum pending requests before rejecting
export const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout for API requests

// Duplicate detection
export const SEMANTIC_SCORE_THRESHOLD = 0.8; // Minimum semantic match score for duplicates
export const DUPLICATE_CHECK_BATCH_SIZE = 5; // Number of companies to check in parallel

// Cache settings
export const SCHEMA_CACHE_TTL_MS = 3600000; // 1 hour cache for schema data

// File upload limits
export const MAX_CSV_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_CSV_FILE_SIZE_DISPLAY = '10MB';

// Validation
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const URL_PROTOCOL_REGEX = /^https?:\/\//i;
