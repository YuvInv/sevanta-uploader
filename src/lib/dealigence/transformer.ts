/**
 * Transform Dealigence extracted data to Sevanta CRM format
 */

import type {
  DealigenceCompanyData,
  DealigenceFounder,
  DealigenceStakeholder,
} from '../../content/dealigence/types';
import type { ContactData, Schema } from '../types';
import { mapFundingStatusToRound, mapCategoriesToIndustry } from './fieldMappings';
import { formatFundingForCrm, cleanWebsiteUrl, cleanLinkedInUrl, extractYear } from './parsers';

/**
 * Transform Dealigence company data to CRM deal format
 */
export function transformToCrmDeal(
  data: DealigenceCompanyData,
  _schema?: Schema
): Record<string, string> {
  const deal: Record<string, string> = {};

  // Required field
  deal.CompanyName = data.companyName;

  // Description
  if (data.description) {
    deal.DescriptionShort = data.description;
  }

  // Website
  if (data.website) {
    const cleanedUrl = cleanWebsiteUrl(data.website);
    if (cleanedUrl) {
      deal.URL = cleanedUrl;
    }
  }

  // LinkedIn URL (stored in Comments or a custom field if available)
  if (data.linkedinUrl) {
    const cleanedLinkedIn = cleanLinkedInUrl(data.linkedinUrl);
    if (cleanedLinkedIn) {
      // Store in a field - CrunchbaseURL might work as a general external link field
      // or we can add it to SourceNotes
    }
  }

  // Map funding status to Round (LifeStageID)
  if (data.fundingStatus) {
    const round = mapFundingStatusToRound(data.fundingStatus);
    if (round) {
      deal.LifeStageID = round;
    }
  }

  // Map categories to Industry
  if (data.categories.length > 0) {
    const industry = mapCategoriesToIndustry(data.categories);
    if (industry) {
      deal.IndustryID = industry;
    }
  }

  // Total funding (as Past Investment in $M)
  if (data.totalFunding) {
    const fundingMil = formatFundingForCrm(data.totalFunding);
    if (fundingMil) {
      deal.Num01 = fundingMil; // Past Investment ($M)
    }
  }

  // Build comprehensive SourceNotes with all Dealigence data
  deal.Source = buildSourceNotes(data);

  return deal;
}

/**
 * Build detailed source notes with all Dealigence data for reference
 */
function buildSourceNotes(data: DealigenceCompanyData): string {
  const lines: string[] = [];

  lines.push('=== IMPORTED FROM DEALIGENCE ===');
  lines.push(`Source: ${data.sourceUrl}`);
  lines.push(`Import Date: ${new Date().toISOString()}`);
  lines.push('');

  // Key metrics
  if (data.fundingStatus) {
    lines.push(`Funding Status: ${data.fundingStatus}`);
  }
  if (data.totalFunding) {
    lines.push(`Total Funding: ${data.totalFunding}`);
  }
  if (data.established) {
    const year = extractYear(data.established);
    lines.push(`Established: ${year || data.established}`);
  }
  if (data.employees) {
    lines.push(`Employees: ${data.employees}`);
  }
  if (data.arr) {
    lines.push(`ARR: ${data.arr}`);
  }

  // Categories
  if (data.categories.length > 0) {
    lines.push(`Categories: ${data.categories.join(', ')}`);
  }

  // LinkedIn
  if (data.linkedinUrl) {
    lines.push(`LinkedIn: ${cleanLinkedInUrl(data.linkedinUrl)}`);
  }

  // Founders
  if (data.founders.length > 0) {
    lines.push('');
    lines.push('Founders:');
    for (const founder of data.founders) {
      let founderLine = `- ${founder.name}`;
      if (founder.linkedinUrl) {
        founderLine += ` (${cleanLinkedInUrl(founder.linkedinUrl)})`;
      }
      lines.push(founderLine);
    }
  }

  // Stakeholders
  if (data.stakeholders.length > 0) {
    lines.push('');
    lines.push('Stakeholders & Advisors:');
    for (const stakeholder of data.stakeholders) {
      lines.push(`- ${stakeholder.name} (${stakeholder.role})`);
    }
  }

  return lines.join('\n');
}

/**
 * Transform Dealigence founders to CRM contact format
 * ContactTypeID: FDR (Founder) - if available, otherwise MGT (Management)
 */
export function transformFounders(
  founders: DealigenceFounder[],
  stakeholders: DealigenceStakeholder[] = []
): ContactData[] {
  const contacts: ContactData[] = [];

  // Transform founders
  for (const founder of founders) {
    if (!founder.name) continue;

    const contactData: Record<string, string> = {
      Name: founder.name,
    };

    // Add LinkedIn if available (stored in Notes or a URL field)
    if (founder.linkedinUrl) {
      contactData.Notes = `LinkedIn: ${cleanLinkedInUrl(founder.linkedinUrl)}`;
    }

    // Use Founder contact type if available
    contactData.ContactTypeID = 'FDR';

    contacts.push({
      data: contactData,
      validation: { valid: true, errors: [], warnings: [] },
    });
  }

  // Optionally transform stakeholders as well
  for (const stakeholder of stakeholders) {
    if (!stakeholder.name) continue;

    // Skip if this person is already in founders
    if (founders.some((f) => f.name === stakeholder.name)) continue;

    const contactData: Record<string, string> = {
      Name: stakeholder.name,
      Title: stakeholder.role,
    };

    // Determine contact type based on role
    if (stakeholder.role.toLowerCase().includes('advisor')) {
      contactData.ContactTypeID = 'ADV';
    } else if (stakeholder.role.toLowerCase().includes('investor')) {
      contactData.ContactTypeID = 'INV';
    } else if (stakeholder.role.toLowerCase().includes('board')) {
      contactData.ContactTypeID = 'BOD';
    } else {
      contactData.ContactTypeID = 'OTH';
    }

    contacts.push({
      data: contactData,
      validation: { valid: true, errors: [], warnings: [] },
    });
  }

  return contacts;
}

/**
 * Validate that we have minimum required data for upload
 */
export function validateDealigenceData(data: DealigenceCompanyData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: Company name
  if (!data.companyName || data.companyName.trim() === '') {
    errors.push('Company name is required');
  }

  // Warnings for missing but useful data
  if (!data.description) {
    warnings.push('No description found');
  }
  if (!data.website) {
    warnings.push('No website URL found');
  }
  if (data.founders.length === 0) {
    warnings.push('No founders found');
  }
  if (data.categories.length === 0) {
    warnings.push('No categories/tags found');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
