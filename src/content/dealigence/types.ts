/**
 * Types for Dealigence company page data extraction
 */

export interface DealigenceFounder {
  name: string;
  linkedinUrl?: string;
}

export interface DealigenceStakeholder {
  name: string;
  role: string;
}

export interface DealigenceCompanyData {
  companyName: string;
  description: string;
  website?: string;
  linkedinUrl?: string;
  employees?: string;
  fundingStatus?: string;
  established?: string;
  totalFunding?: string;
  arr?: string;
  categories: string[];
  founders: DealigenceFounder[];
  stakeholders: DealigenceStakeholder[];
  sourceUrl: string;
}
