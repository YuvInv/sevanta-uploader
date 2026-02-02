/**
 * DOM extraction for Dealigence company pages
 * Extracts all available data from page DOM
 * NO validation here - that happens in background script
 */

import type { DealigenceCompanyData, DealigenceStakeholder } from '../../lib/dealigence/types';
import { SELECTORS } from './selectors';

/**
 * Helper to get text content, trimmed and cleaned
 */
function getText(el: Element | null): string {
  return el?.textContent?.trim().replace(/\s+/g, ' ') || '';
}

/**
 * Helper to get attribute value
 */
function getAttr(el: Element | null, attr: string): string {
  return el?.getAttribute(attr)?.trim() || '';
}

/**
 * Try multiple selectors and return first match
 */
function queryFirst(selectors: string): Element | null {
  for (const selector of selectors.split(', ')) {
    const el = document.querySelector(selector.trim());
    if (el) return el;
  }
  return null;
}

/**
 * Extract website URL from the page
 * Look for external links that aren't social media
 */
function extractWebsite(): string | undefined {
  const links = document.querySelectorAll('a[href^="http"]');
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    // Skip internal links and social media
    if (
      href.includes('dealigence.vc') ||
      href.includes('linkedin.com') ||
      href.includes('twitter.com') ||
      href.includes('facebook.com') ||
      href.includes('crunchbase.com')
    ) {
      continue;
    }
    // Found an external link, likely the company website
    return href;
  }
  return undefined;
}

/**
 * Extract funding information
 */
function extractFunding(): { totalFunding?: string; fundingStatus?: string } {
  const result: { totalFunding?: string; fundingStatus?: string } = {};

  // Look for funding amount patterns like "$1.5M", "$10M raised"
  const allText = document.body.innerText;
  const fundingMatch = allText.match(/\$[\d.,]+[MBK]?\s*(raised|funding)?/i);
  if (fundingMatch) {
    result.totalFunding = fundingMatch[0].trim();
  }

  // Look for funding status/stage
  const stagePatterns = [
    'Seed',
    'Series A',
    'Series B',
    'Series C',
    'Pre-Seed',
    'Fundraising',
    'Funded',
    'Bootstrapped',
    'Need Funding',
  ];
  for (const pattern of stagePatterns) {
    if (allText.includes(pattern)) {
      result.fundingStatus = pattern;
      break;
    }
  }

  return result;
}

/**
 * Extract categories/tags
 * IMPORTANT: Must scope to main company container to avoid picking up
 * tags from "People Also Viewed" section
 */
function extractCategories(): string[] {
  const categories: string[] = [];

  // Scope to the main company container (first div in main)
  const companyContainer = document.querySelector(SELECTORS.companyContainer);
  if (!companyContainer) return categories;

  // Find tags container within company section only
  const tagsContainer = companyContainer.querySelector(SELECTORS.tagsContainer);
  if (tagsContainer) {
    // Get individual tag elements with noBg class (actual tags, not containers)
    const tags = tagsContainer.querySelectorAll(SELECTORS.tag);
    for (const tag of tags) {
      const text = tag.textContent?.trim();
      // Filter out loading placeholders and unreasonably long text
      if (text && text.length < 50 && !text.includes('Load')) {
        categories.push(text);
      }
    }
  }

  // Also check for data attributes or structured data
  const metaTags = document.querySelectorAll('meta[property*="category"], meta[name*="category"]');
  for (const meta of metaTags) {
    const content = meta.getAttribute('content');
    if (content) categories.push(content);
  }

  return [...new Set(categories)]; // Deduplicate
}

/**
 * Extract founder/team information
 */
function extractFounders(): DealigenceStakeholder[] {
  const founders: DealigenceStakeholder[] = [];

  // Try to find a team/founders section
  const founderCards = document.querySelectorAll(SELECTORS.founderCard);

  for (const card of founderCards) {
    const name = getText(card.querySelector(SELECTORS.founderName));
    if (!name) continue;

    const title = getText(card.querySelector(SELECTORS.founderTitle));
    const linkedinEl = card.querySelector(SELECTORS.founderLinkedin);
    const linkedinUrl = linkedinEl ? getAttr(linkedinEl, 'href') : undefined;

    // Only include if it looks like a founder/executive
    const isFounder =
      !title ||
      title.toLowerCase().includes('founder') ||
      title.toLowerCase().includes('ceo') ||
      title.toLowerCase().includes('cto') ||
      title.toLowerCase().includes('chief');

    if (isFounder) {
      founders.push({
        name,
        title: title || undefined,
        linkedinUrl: linkedinUrl || undefined,
      });
    }
  }

  // Limit to reasonable number
  return founders.slice(0, 5);
}

/**
 * Extract company location/headquarters
 */
function extractHeadquarters(): string | undefined {
  // Common location patterns
  const locationPatterns = [
    /(?:based in|located in|headquarters?:?)\s*([^.]+)/i,
    /([A-Za-z\s]+,\s*(?:Israel|USA|UK|Germany|France|India))/i,
  ];

  const allText = document.body.innerText;
  for (const pattern of locationPatterns) {
    const match = allText.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extract founding year/date
 * Dealigence format: "Established" followed by "October 2025" on next line
 */
function extractFounded(): string | undefined {
  const allText = document.body.innerText;

  // Dealigence format: "Established" + newline + "Month Year"
  const dealigenceMatch = allText.match(/Established[\s\n]+([A-Za-z]+\s+\d{4})/);
  if (dealigenceMatch) {
    return dealigenceMatch[1];
  }

  // Fallback patterns for other formats
  const foundedPatterns = [/founded:?\s*(\d{4})/i, /established:?\s*(\d{4})/i, /since\s*(\d{4})/i];
  for (const pattern of foundedPatterns) {
    const match = allText.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Extract employee count
 * Dealigence format: "Employees" followed by number on next line
 */
function extractEmployees(): string | undefined {
  const allText = document.body.innerText;
  const match = allText.match(/Employees[\s\n]+(\d+)/);
  return match?.[1];
}

/**
 * Extract company name from URL slug as fallback
 * e.g., /company/axia-security -> Axia Security
 */
function getCompanyNameFromUrl(): string {
  const match = window.location.pathname.match(/\/company\/([^/]+)/);
  if (match) {
    // Convert slug to title case: "axia-security" -> "Axia Security"
    return match[1]
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return '';
}

/**
 * Main extraction function
 * Returns raw extracted data - validation happens in background script
 */
export function extractCompanyData(): DealigenceCompanyData {
  // Company name from h2 (Dealigence uses h2, not h1)
  let companyName = getText(document.querySelector(SELECTORS.companyName));

  // Fallback: extract from URL slug if h2 not found
  if (!companyName) {
    companyName = getCompanyNameFromUrl();
  }

  // Description - try multiple approaches
  let description: string | undefined;
  const descEl = queryFirst(SELECTORS.description);
  if (descEl) {
    description = getText(descEl);
  }
  // If description is too short, try getting more content
  if (!description || description.length < 50) {
    const paragraphs = document.querySelectorAll('main p, article p');
    const texts = Array.from(paragraphs)
      .map((p) => getText(p))
      .filter((t) => t.length > 50);
    if (texts.length) {
      description = texts[0];
    }
  }

  // Extract other fields
  const website = extractWebsite();
  const { totalFunding, fundingStatus } = extractFunding();
  const categories = extractCategories();
  const headquarters = extractHeadquarters();
  const founded = extractFounded();
  const employees = extractEmployees();
  const founders = extractFounders();

  return {
    companyName,
    description,
    website,
    totalFunding,
    fundingStatus,
    categories,
    headquarters,
    founded,
    employees,
    founders,
    sourceUrl: window.location.href,
  };
}
