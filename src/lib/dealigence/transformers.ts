/**
 * Transform Dealigence data to CRM format
 */

import type { DealigenceCompanyData, DealigenceStakeholder } from './types';

/**
 * Funding status to CRM LifeStageID mapping
 */
const FUNDING_STATUS_MAP: Record<string, string> = {
  'Need Funding': '0', // Seed
  Fundraising: '0', // Seed
  Funded: 'PS', // Post-seed
  Bootstrapped: 'O', // Other
  Seed: '0',
  'Pre-Seed': '0',
  'Series A': 'A',
  'Series B': 'B',
  'Series C': 'C',
  'Series D': 'D',
};

/**
 * Category to CRM IndustryID mapping
 */
const CATEGORY_MAP: Record<string, string> = {
  Healthcare: 'Health',
  Health: 'Health',
  'Medical Devices': 'Assi',
  Medical: 'Assi',
  MedTech: 'Assi',
  SaaS: 'IT',
  Software: 'IT',
  AI: 'IT',
  'Artificial Intelligence': 'IT',
  'Machine Learning': 'IT',
  Fintech: 'Fintech',
  FinTech: 'Fintech',
  Financial: 'Fintech',
  Manufacturing: 'IND4',
  Industrial: 'IND4',
  'Industry 4.0': 'IND4',
  'Connected Device': 'IOT',
  IoT: 'IOT',
  Hardware: 'IOT',
  Cybersecurity: 'Cyber',
  Security: 'Cyber',
  AgTech: 'AgFo',
  FoodTech: 'AgFo',
  Agriculture: 'AgFo',
  CleanTech: 'Clean',
  Climate: 'Clean',
  Sustainability: 'Clean',
};

/**
 * Parse funding amount to number
 * "$1.5M" → 1.5, "$10M raised" → 10
 */
export function parseFundingAmount(funding: string | undefined): number | undefined {
  if (!funding) return undefined;

  const match = funding.match(/\$?([\d.,]+)\s*(M|B|K)?/i);
  if (!match) return undefined;

  let value = parseFloat(match[1].replace(/,/g, ''));

  const unit = match[2]?.toUpperCase();
  if (unit === 'B') value *= 1000;
  else if (unit === 'K') value /= 1000;
  // M stays as-is (we want millions)

  return value;
}

/**
 * Map funding status to CRM LifeStageID
 */
export function mapFundingStatus(status: string | undefined): string | undefined {
  if (!status) return undefined;
  return FUNDING_STATUS_MAP[status] || undefined;
}

/**
 * Map category to CRM IndustryID
 */
export function mapCategory(categories: string[]): string | undefined {
  for (const cat of categories) {
    // Try exact match first
    if (CATEGORY_MAP[cat]) return CATEGORY_MAP[cat];
    // Try partial match
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (cat.toLowerCase().includes(key.toLowerCase())) return value;
    }
  }
  return undefined;
}

/**
 * Build source/notes text from all metadata
 */
function buildSourceText(data: DealigenceCompanyData): string {
  const parts: string[] = [];

  parts.push(`Source: Dealigence`);
  parts.push(`URL: ${data.sourceUrl}`);

  if (data.totalFunding) {
    parts.push(`Total Funding: ${data.totalFunding}`);
  }
  if (data.fundingStatus) {
    parts.push(`Stage: ${data.fundingStatus}`);
  }
  if (data.headquarters) {
    parts.push(`Location: ${data.headquarters}`);
  }
  if (data.founded) {
    parts.push(`Founded: ${data.founded}`);
  }
  if (data.categories.length > 0) {
    parts.push(`Categories: ${data.categories.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Transform Dealigence company data to CRM deal fields
 */
export function mapToCrmDeal(data: DealigenceCompanyData): Record<string, string> {
  const crmData: Record<string, string> = {
    CompanyName: data.companyName,
  };

  // Description (truncate to 5000 chars)
  if (data.description) {
    crmData.DescriptionShort =
      data.description.length > 5000 ? data.description.slice(0, 4997) + '...' : data.description;
  }

  // Website
  if (data.website) {
    crmData.URL = data.website;
  }

  // Funding amount to Num01 field
  const fundingAmount = parseFundingAmount(data.totalFunding);
  if (fundingAmount !== undefined) {
    crmData.Num01 = fundingAmount.toString();
  }

  // Funding status → LifeStageID
  const lifeStage = mapFundingStatus(data.fundingStatus);
  if (lifeStage) {
    crmData.LifeStageID = lifeStage;
  }

  // Category → IndustryID
  const industry = mapCategory(data.categories);
  if (industry) {
    crmData.IndustryID = industry;
  }

  // Source notes with all metadata
  crmData.Source = buildSourceText(data);

  return crmData;
}

/**
 * Transform founder to CRM contact fields
 */
export function mapToCrmContact(
  founder: DealigenceStakeholder,
  companyId?: string
): Record<string, string> {
  const contact: Record<string, string> = {
    Name: founder.name,
    ContactTypeID: 'MGT', // Management
  };

  if (founder.title) {
    contact.Title = founder.title;
  }

  if (founder.linkedinUrl) {
    contact.Notes = `LinkedIn: ${founder.linkedinUrl}`;
  }

  if (companyId) {
    contact.CompanyID = companyId;
  }

  return contact;
}
