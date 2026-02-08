/**
 * Transform IVC data to CRM format
 */

import type { IvcCompanyData, IvcStakeholder } from './types';
import { applyDealDefaults } from '../defaults';

/**
 * IVC Stage to CRM StageID mapping
 * IVC stages don't map to CRM stages well, so we keep the default (0 = Screening)
 */
export const IVC_STAGE_MAP: Record<string, string> = {
  // IVC uses descriptive stages like "Growth", "Seed", etc.
  // These map to CRM LifeStageID (Round), not StageID
};

/**
 * IVC Sector to CRM IndustryID mapping
 */
export const IVC_SECTOR_MAP: Record<string, string> = {
  // Healthcare
  Healthcare: 'Health',
  'Health Care': 'Health',
  'Life Sciences': 'Health',
  'Medical Devices': 'Assi',
  Pharma: 'Health',
  Biotech: 'Health',
  'Digital Health': 'Health',
  // IT/Software
  Software: 'IT',
  'Enterprise Software': 'IT',
  SaaS: 'IT',
  'Artificial Intelligence': 'IT',
  AI: 'IT',
  'Machine Learning': 'IT',
  // Fintech
  Fintech: 'Fintech',
  FinTech: 'Fintech',
  // Industrial
  Industrial: 'IND4',
  Manufacturing: 'IND4',
  // IoT/Hardware
  Hardware: 'IOT',
  IoT: 'IOT',
  Semiconductors: 'IOT',
  // Security
  Cybersecurity: 'Cyber',
  'Cyber Security': 'Cyber',
  // Agriculture/Food
  AgriTech: 'AgFo',
  'Agri-Tech': 'AgFo',
  FoodTech: 'AgFo',
  'Food Tech': 'AgFo',
  // Clean/Climate
  Cleantech: 'Clean',
  'Clean Tech': 'Clean',
  'Climate Tech': 'Clean',
};

/**
 * IVC stage name to CRM LifeStageID mapping
 */
const IVC_LIFE_STAGE_MAP: Record<string, string> = {
  Seed: '0',
  'Pre-Seed': '0',
  'Series A': 'A',
  'Series B': 'B',
  'Series C': 'C',
  'Series D': 'D',
  Growth: 'PS',
  'Post-Seed': 'PS',
};

/**
 * Parse total capital string to number in $M
 * "US$ 15.5 M" -> 15.5, "$3.2M" -> 3.2
 */
export function parseTotalCapital(capital: string | undefined): number | undefined {
  if (!capital) return undefined;

  const match = capital.match(/\$?\s*([\d.,]+)\s*(M|B|K)?/i);
  if (!match) return undefined;

  let value = parseFloat(match[1].replace(/,/g, ''));

  const unit = match[2]?.toUpperCase();
  if (unit === 'B') value *= 1000;
  else if (unit === 'K') value /= 1000;
  // M stays as-is

  return value;
}

/**
 * Map IVC sector to CRM IndustryID
 */
export function mapSector(sector: string | undefined): string | undefined {
  if (!sector) return undefined;

  // Try exact match first
  if (IVC_SECTOR_MAP[sector]) return IVC_SECTOR_MAP[sector];

  // Try partial match
  for (const [key, value] of Object.entries(IVC_SECTOR_MAP)) {
    if (sector.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return undefined;
}

/**
 * Map IVC stage to CRM LifeStageID
 */
export function mapStage(stage: string | undefined): string | undefined {
  if (!stage) return undefined;
  return IVC_LIFE_STAGE_MAP[stage] || undefined;
}

/**
 * Build source attribution text
 */
function buildSourceText(data: IvcCompanyData): string {
  return `Uploaded through Sevanta uploader extension ${data.sourceUrl}`;
}

/**
 * Build full metadata comment for CRM comments section
 */
export function buildMetadataComment(data: IvcCompanyData): string {
  const parts: string[] = [];

  parts.push(`== IVC Company Data ==`);
  parts.push(`Source URL: ${data.sourceUrl}`);

  if (data.sector) parts.push(`Sector: ${data.sector}`);
  if (data.stage) parts.push(`Stage: ${data.stage}`);
  if (data.established) parts.push(`Established: ${data.established}`);
  if (data.employees) parts.push(`Employees: ${data.employees}`);
  if (data.totalCapital) parts.push(`Total Capital: ${data.totalCapital}`);
  if (data.technology) parts.push(`Technology: ${data.technology}`);
  if (data.targetMarkets) parts.push(`Target Markets: ${data.targetMarkets}`);
  if (data.businessModel) parts.push(`Business Model: ${data.businessModel}`);
  if (data.tags.length > 0) parts.push(`Tags: ${data.tags.join(', ')}`);
  if (data.management.length > 0) {
    const mgmtList = data.management
      .map((m) => (m.title ? `${m.name} (${m.title})` : m.name))
      .join(', ');
    parts.push(`Management: ${mgmtList}`);
  }

  return parts.join('\n');
}

/**
 * Transform IVC company data to CRM deal fields
 */
export function mapToCrmDeal(data: IvcCompanyData): Record<string, string> {
  const crmData: Record<string, string> = {
    CompanyName: data.companyName,
  };

  // Description - combine description, technology, target markets, business model
  const descParts: string[] = [];
  if (data.description) descParts.push(data.description);
  if (data.technology) descParts.push(`Technology: ${data.technology}`);
  if (data.targetMarkets) descParts.push(`Target Markets: ${data.targetMarkets}`);
  if (data.businessModel) descParts.push(`Business Model: ${data.businessModel}`);

  if (descParts.length > 0) {
    const desc = descParts.join('\n\n');
    crmData.DescriptionShort = desc.length > 5000 ? desc.slice(0, 4997) + '...' : desc;
  }

  // Website
  if (data.website) {
    crmData.URL = data.website;
  }

  // Total capital -> Num01 (Past Investment in $M)
  const capitalAmount = parseTotalCapital(data.totalCapital);
  if (capitalAmount !== undefined) {
    crmData.Num01 = capitalAmount.toString();
  }

  // Stage -> LifeStageID (Round)
  const lifeStage = mapStage(data.stage);
  if (lifeStage) {
    crmData.LifeStageID = lifeStage;
  }

  // Sector -> IndustryID
  const industry = mapSector(data.sector);
  if (industry) {
    crmData.IndustryID = industry;
  }

  // Source notes
  crmData.Source = buildSourceText(data);

  // Apply auto-defaults
  return applyDealDefaults(crmData, 'ivc');
}

/**
 * Transform management member to CRM contact fields
 */
export function mapToCrmContact(
  person: IvcStakeholder,
  companyId?: string
): Record<string, string> {
  const contact: Record<string, string> = {
    Name: person.name,
    ContactTypeID: 'MGT',
  };

  if (person.title) {
    contact.Title = person.title;
  }

  if (person.email) {
    contact.Email = person.email;
  }

  if (companyId) {
    contact.CompanyID = companyId;
  }

  return contact;
}
