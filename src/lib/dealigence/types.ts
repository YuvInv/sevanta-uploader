/**
 * Types for Dealigence Quick Upload feature
 */

// Stakeholder data (founders, advisors)
export interface DealigenceStakeholder {
  name: string;
  title?: string;
  linkedinUrl?: string;
}

// Complete extracted company data from Dealigence
export interface DealigenceCompanyData {
  companyName: string;
  description?: string;
  website?: string;
  linkedinUrl?: string;
  totalFunding?: string;
  fundingStatus?: string;
  categories: string[];
  headquarters?: string;
  founded?: string;
  employees?: string;
  founders: DealigenceStakeholder[];
  sourceUrl: string;
  // Extraction metadata for validation
  isLoading?: boolean; // True if page data is still loading
  // Response metadata (added by background script, not content script)
  _retryCount?: number; // Number of retries needed for extraction
}

// Extraction state machine steps
export type ExtractionStep =
  | 'idle'
  | 'extracting'
  | 'validating'
  | 'retrying'
  | 'success'
  | 'error';

// Current extraction state
export interface ExtractionState {
  step: ExtractionStep;
  data?: DealigenceCompanyData;
  error?: string;
  retryCount?: number;
  staleReason?: string; // Why data was considered stale (for debugging)
}

// Tab info for active tab detection
export interface TabInfo {
  tabId: number;
  url: string;
  isDealigenceCompanyPage: boolean;
  isIvcCompanyPage?: boolean;
}
