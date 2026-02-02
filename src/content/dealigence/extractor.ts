/**
 * DOM and JSON-LD extraction functions for Dealigence company pages
 * Uses a combination of JSON-LD structured data and DOM parsing for robustness
 */

import type { DealigenceCompanyData } from './types';

/**
 * Extract company data from a Dealigence company page
 * Primary strategy: JSON-LD structured data
 * Fallback: DOM parsing
 */
export function extractCompanyData(): DealigenceCompanyData {
  const result: DealigenceCompanyData = {
    companyName: '',
    description: '',
    website: undefined,
    linkedinUrl: undefined,
    employees: undefined,
    fundingStatus: undefined,
    established: undefined,
    totalFunding: undefined,
    arr: undefined,
    categories: [],
    founders: [],
    stakeholders: [],
    sourceUrl: window.location.href,
  };

  // 1. Try JSON-LD extraction first (most reliable)
  extractFromJsonLd(result);

  // 2. Extract data from DOM (for fields not in JSON-LD)
  extractFromDom(result);

  // 3. Apply fallbacks if primary extraction failed
  applyFallbacks(result);

  return result;
}

/**
 * Extract data from JSON-LD structured data in the page
 */
function extractFromJsonLd(result: DealigenceCompanyData): void {
  const scripts = document.querySelectorAll('script');

  for (const script of scripts) {
    const content = script.textContent || '';
    if (!content.includes('"@type":"Corporation"')) continue;

    try {
      // Find the JSON array containing the schema data
      const jsonMatch = content.match(/\[\s*\{[\s\S]*"@context"[\s\S]*\}\s*\]/);
      if (!jsonMatch) continue;

      const data = JSON.parse(jsonMatch[0]) as JsonLdData[];
      const entity = data[0]?.mainEntity;
      if (!entity) continue;

      // Extract basic fields
      result.companyName = entity.name || '';
      result.employees = entity.numberOfEmployees?.toString();
      result.established = entity.foundingDate;

      // Extract sameAs links (website and LinkedIn)
      if (Array.isArray(entity.sameAs)) {
        for (const url of entity.sameAs) {
          if (typeof url !== 'string') continue;
          if (url.includes('linkedin.com')) {
            result.linkedinUrl = url;
          } else if (!url.includes('dealigence')) {
            result.website = url;
          }
        }
      }

      // Extract founders
      if (Array.isArray(entity.founders)) {
        result.founders = entity.founders.map((f: JsonLdPerson) => ({
          name: f.name || '',
          linkedinUrl: typeof f.sameAs === 'string' ? f.sameAs : undefined,
        }));
      }

      break; // Found and parsed JSON-LD, stop searching
    } catch {
      // JSON parse error, continue to try other scripts
    }
  }
}

/**
 * Extract data from DOM elements
 */
function extractFromDom(result: DealigenceCompanyData): void {
  extractDescription(result);
  extractCategories(result);
  extractMetrics(result);
  extractStakeholders(result);
}

/**
 * Extract company description from the page
 */
function extractDescription(result: DealigenceCompanyData): void {
  if (result.description) return; // Already have it from JSON-LD

  const main = document.querySelector('main');
  if (!main) return;

  // Strategy 1: Find first long text line that looks like a description
  const lines = main.innerText.split('\n').filter((l) => l.trim().length > 40);
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip if it starts with metric labels or category keywords
    if (trimmed.match(/^(Healthcare|B2B|B2C|SaaS|Employees|Funding|Established|Total|ARR)/i)) {
      continue;
    }
    // Skip if it's too short or too long
    if (trimmed.length > 50 && trimmed.length < 600) {
      result.description = trimmed;
      return;
    }
  }

  // Strategy 2: Look for text nodes after h1
  const h1 = document.querySelector('h1');
  if (h1) {
    const walker = document.createTreeWalker(
      h1.parentElement || document.body,
      NodeFilter.SHOW_TEXT
    );
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text && text.length > 50 && text.length < 600 && !text.includes(result.companyName)) {
        result.description = text;
        return;
      }
    }
  }
}

/**
 * Extract category tags from the page
 */
function extractCategories(result: DealigenceCompanyData): void {
  const categoryKeywords = [
    'Healthcare',
    'B2B',
    'B2C',
    'B2B2C',
    'SaaS',
    'AI',
    'ML',
    'Fintech',
    'Medical',
    'Medical Devices',
    'Software',
    'Computer Vision',
    'Neuroscience',
    'Biotech',
    'Enterprise',
    'Consumer',
    'Analytics',
    'DeepTech',
    'Cybersecurity',
    'EdTech',
    'PropTech',
    'InsurTech',
    'AgTech',
    'CleanTech',
    'Healthcare Providers',
    'Treatments',
    'Diagnostics',
    'BigData',
    'IoT',
    'Robotics',
    'AR/VR',
    'Blockchain',
    'Cloud',
    'DevOps',
    'Security',
    'Payments',
    'E-commerce',
    'Marketplace',
    'Logistics',
    'Manufacturing',
    'Energy',
    'Sustainability',
    'Food',
    'Travel',
    'Gaming',
    'Media',
    'Entertainment',
    'Social',
    'HR',
    'Legal',
    'Real Estate',
    'Automotive',
    'Aerospace',
    'Defense',
  ];

  const seen = new Set<string>();
  document.querySelectorAll('span, div').forEach((el) => {
    const text = el.textContent?.trim();
    if (!text || text.length > 30) return;

    // Check if this text matches a category keyword
    for (const keyword of categoryKeywords) {
      if (text === keyword || text.toLowerCase() === keyword.toLowerCase()) {
        if (!seen.has(text)) {
          seen.add(text);
          result.categories.push(text);
        }
        break;
      }
    }
  });
}

/**
 * Extract metrics (employees, funding status, established, total funding, ARR)
 */
function extractMetrics(result: DealigenceCompanyData): void {
  const bodyText = document.body.innerText;

  // Funding Status
  if (!result.fundingStatus) {
    const fundingMatch = bodyText.match(/Funding Status\s*\n?\s*([^\n]+)/);
    if (fundingMatch) {
      result.fundingStatus = fundingMatch[1].trim();
    }
  }

  // Total Funding
  if (!result.totalFunding) {
    const totalMatch = bodyText.match(/Total Funding\s*\n?\s*(\$[\d.,]+[kmb]?)/i);
    if (totalMatch) {
      result.totalFunding = totalMatch[1];
    }
  }

  // ARR
  if (!result.arr) {
    const arrMatch = bodyText.match(/ARR\s*\n?\s*(\$[\d.,]+[kmb]?)/i);
    if (arrMatch) {
      result.arr = arrMatch[1];
    }
  }

  // Employees (fallback if not from JSON-LD)
  if (!result.employees) {
    const employeesMatch = bodyText.match(/Employees\s*\n?\s*(\d+)/);
    if (employeesMatch) {
      result.employees = employeesMatch[1];
    }
  }

  // Established (fallback if not from JSON-LD)
  if (!result.established) {
    const establishedMatch = bodyText.match(/Established\s*\n?\s*([A-Za-z]+\s+\d{4}|\d{4})/);
    if (establishedMatch) {
      result.established = establishedMatch[1];
    }
  }
}

/**
 * Extract stakeholders and advisors
 */
function extractStakeholders(result: DealigenceCompanyData): void {
  const bodyText = document.body.innerText;

  // Find Stakeholders & Advisors section
  const stakeholderMatch = bodyText.match(
    /Stakeholders & Advisors\s*([\s\S]*?)(?=People Also Viewed|Workforce|Open Positions|$)/
  );
  if (!stakeholderMatch) return;

  const section = stakeholderMatch[1];
  const lines = section
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 100);

  // Parse name and role pairs
  for (let i = 0; i < lines.length - 1; i++) {
    const name = lines[i];
    const role = lines[i + 1];

    // Validate that this looks like a name/role pair
    if (
      name &&
      role &&
      !name.includes('People') &&
      !name.includes('Workforce') &&
      !name.match(/^\d/) &&
      role.match(/(Advisor|Board|Investor|Member|Partner|Director|Mentor)/i)
    ) {
      result.stakeholders.push({ name, role });
      i++; // Skip the role line in next iteration
    }
  }
}

/**
 * Apply fallback extraction strategies for missing data
 */
function applyFallbacks(result: DealigenceCompanyData): void {
  // Fallback for company name from h1
  if (!result.companyName) {
    const h1 = document.querySelector('h1');
    if (h1) {
      result.companyName = h1.textContent?.trim() || '';
    }
  }

  // Fallback for company name from page title
  if (!result.companyName) {
    const title = document.title;
    const match = title.match(/^([^|]+)/);
    if (match) {
      result.companyName = match[1]
        .trim()
        .replace(/Revenue.*$/, '')
        .trim();
    }
  }
}

// Type definitions for JSON-LD data
interface JsonLdPerson {
  '@type': 'Person';
  name?: string;
  jobTitle?: string;
  sameAs?: string;
  image?: string | null;
}

interface JsonLdEntity {
  '@type': 'Corporation';
  name?: string;
  url?: string;
  foundingDate?: string;
  numberOfEmployees?: number;
  sameAs?: string[];
  founders?: JsonLdPerson[];
  address?: unknown[];
}

interface JsonLdData {
  '@context': string;
  '@type': string;
  mainEntity?: JsonLdEntity;
}
