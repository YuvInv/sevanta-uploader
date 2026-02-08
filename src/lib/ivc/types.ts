/**
 * Types for IVC Quick Upload feature
 */

// Stakeholder data (management team members)
export interface IvcStakeholder {
  name: string;
  title?: string;
  email?: string;
}

// Complete extracted company data from IVC
export interface IvcCompanyData {
  companyName: string;
  description?: string;
  website?: string;
  linkedinUrl?: string;
  sector?: string;
  stage?: string;
  established?: string;
  employees?: string;
  technology?: string;
  targetMarkets?: string;
  businessModel?: string;
  totalCapital?: string;
  tags: string[];
  management: IvcStakeholder[];
  sourceUrl: string;
}
