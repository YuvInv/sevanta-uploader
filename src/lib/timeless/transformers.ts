/**
 * Transform Timeless memo data to CRM format
 */

import type { TimelessMemoData, TimelessFounder } from './types';
import { applyDealDefaults } from '../defaults';
import { parseFundingAmount } from '../dealigence/transformers';

/**
 * Market description to CRM IndustryID mapping
 */
const MARKET_INDUSTRY_MAP: Record<string, string> = {
  healthcare: 'Health',
  health: 'Health',
  'digital health': 'Health',
  'chronic disease': 'Health',
  cardiology: 'Health',
  neuroscience: 'Health',
  medical: 'Assi',
  medtech: 'Assi',
  'medical device': 'Assi',
  diagnostics: 'HCD',
  saas: 'IT',
  software: 'IT',
  ai: 'IT',
  'artificial intelligence': 'IT',
  'machine learning': 'IT',
  fintech: 'Fintech',
  financial: 'Fintech',
  manufacturing: 'IND4',
  industrial: 'IND4',
  iot: 'IOT',
  hardware: 'IOT',
  cybersecurity: 'Cyber',
  security: 'Cyber',
  agtech: 'AgFo',
  foodtech: 'AgFo',
  agriculture: 'AgFo',
  cleantech: 'Clean',
  climate: 'Clean',
  sustainability: 'Clean',
};

/**
 * Map market description to CRM IndustryID
 */
export function mapMarketToIndustry(market: string | undefined): string | undefined {
  if (!market) return undefined;
  const lower = market.toLowerCase();
  for (const [key, value] of Object.entries(MARKET_INDUSTRY_MAP)) {
    if (lower.includes(key)) return value;
  }
  return undefined;
}

/**
 * Parse "Raised $1.5M" from funding history text.
 * Reuses parseFundingAmount from dealigence for the actual number parsing.
 */
export function parseFundingFromMemo(fundingHistory: string | undefined): string | undefined {
  if (!fundingHistory) return undefined;
  const match = fundingHistory.match(/[Rr]aised\s+(\$[\d.,]+\s*[MBKmbk]?)/);
  return match ? match[1] : undefined;
}

/**
 * Parse "Raising $1.5M" (current fundraise) from funding history text.
 */
export function parseFundraisingFromMemo(fundingHistory: string | undefined): string | undefined {
  if (!fundingHistory) return undefined;
  const match = fundingHistory.match(/[Rr]aising\s+(\$[\d.,]+\s*[MBKmbk]?)/);
  return match ? match[1] : undefined;
}

/**
 * Detect fundraising round (LifeStageID) from free text.
 * Returns the CRM value or undefined if not found.
 */
export function parseFundraisingStageFromText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();
  if (lower.includes('pre-seed') || lower.includes('preseed')) return 'PS';
  if (lower.includes('series d')) return 'D';
  if (lower.includes('series c')) return 'C';
  if (lower.includes('series b')) return 'B';
  if (lower.includes('series a') || lower.includes('series-a')) return 'A';
  if (lower.includes('seed')) return '0';
  return undefined;
}

/**
 * Build source attribution text
 */
function buildSourceText(data: TimelessMemoData): string {
  return `Uploaded through Sevanta uploader extension (Timeless) ${data.sourceUrl}`;
}

/**
 * Build the full memo as a formatted CRM comment
 */
export function buildMemoComment(data: TimelessMemoData): string {
  const parts: string[] = [];
  parts.push('== Timeless Meeting Memo ==');
  parts.push(`Source URL: ${data.sourceUrl}`);
  parts.push('');
  parts.push(data.fullMemoText);
  return parts.join('\n');
}

export interface TimelessUploadOverrides {
  industryId?: string;
  /** CRM dbname for the recommendation/grade field (looked up from schema) */
  recommendationField?: string;
  recommendationId?: string;
  /** CRM dbname for the fundraising amount field (looked up from schema by label) */
  fundraisingField?: string;
  /** Fundraising amount in $M as a string number */
  fundraisingAmount?: string;
  /** First call date in YYYY-MM-DD format (maps to Date01) */
  firstCallDate?: string;
  /** Long description (maps to Description field) */
  description?: string;
}

/**
 * Transform Timeless memo data to CRM deal fields.
 * Accepts optional overrides for fields the user edited in the preview.
 */
export function mapToCrmDeal(
  data: TimelessMemoData,
  overrides?: TimelessUploadOverrides
): Record<string, string> {
  const crmData: Record<string, string> = {
    CompanyName: data.companyName,
  };

  // Short description from solution text
  if (data.solution) {
    crmData.DescriptionShort =
      data.solution.length > 5000 ? data.solution.slice(0, 4997) + '...' : data.solution;
  }

  // Long description override
  if (overrides?.description) {
    crmData.Description =
      overrides.description.length > 10000
        ? overrides.description.slice(0, 9997) + '...'
        : overrides.description;
  }

  // Funding amount to Num01 field (Past Investment in $M)
  const rawAmount = parseFundingFromMemo(data.fundingHistory);
  const fundingAmount = parseFundingAmount(rawAmount);
  if (fundingAmount !== undefined) {
    crmData.Num01 = fundingAmount.toString();
  }

  // Industry: use override if provided, otherwise auto-detect from market
  const industry = overrides?.industryId || mapMarketToIndustry(data.market);
  if (industry) {
    crmData.IndustryID = industry;
  }

  // Fundraising amount (dynamic field looked up from schema by label)
  if (overrides?.fundraisingField && overrides?.fundraisingAmount) {
    const amount = parseFundingAmount(overrides.fundraisingAmount);
    if (amount !== undefined) {
      crmData[overrides.fundraisingField] = amount.toString();
    }
  }

  // Recommendation/grade field (field name is dynamic from schema)
  if (overrides?.recommendationField && overrides?.recommendationId) {
    crmData[overrides.recommendationField] = overrides.recommendationId;
  }

  // First call date (Date01)
  if (overrides?.firstCallDate) {
    crmData.Date01 = overrides.firstCallDate;
  }

  // Source
  crmData.Source = buildSourceText(data);

  return applyDealDefaults(crmData, 'timeless');
}

/**
 * Transform founder to CRM contact fields
 */
export function mapToCrmContact(
  founder: TimelessFounder,
  companyId?: string
): Record<string, string> {
  const contact: Record<string, string> = {
    Name: founder.name,
    ContactTypeID: 'MGT',
  };

  if (founder.title) {
    contact.Title = founder.title;
  }

  if (companyId) {
    contact.CompanyID = companyId;
  }

  return contact;
}
