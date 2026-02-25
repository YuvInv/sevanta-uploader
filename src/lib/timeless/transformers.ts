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

/**
 * Transform Timeless memo data to CRM deal fields.
 * Accepts optional overrides for fields the user edited in the preview.
 */
export function mapToCrmDeal(
  data: TimelessMemoData,
  overrides?: { industryId?: string }
): Record<string, string> {
  const crmData: Record<string, string> = {
    CompanyName: data.companyName,
  };

  // Description from solution text
  if (data.solution) {
    crmData.DescriptionShort =
      data.solution.length > 5000 ? data.solution.slice(0, 4997) + '...' : data.solution;
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
