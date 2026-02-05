/**
 * DOM extraction for Dealigence company pages
 *
 * Extracts all data from the DOM using CSS Module selectors.
 * Dealigence loads data asynchronously, so we wait for DOM content
 * before extracting.
 *
 * NO validation here - that happens in background script.
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
 * Try multiple selectors (comma-separated) and return first match
 */
function queryFirst(selectors: string): Element | null {
  for (const selector of selectors.split(', ')) {
    const el = document.querySelector(selector.trim());
    if (el) return el;
  }
  return null;
}

/**
 * Wait for async DOM data to load.
 * Polls until dataPointValue elements are populated (no "loading..." text).
 */
async function waitForDataLoaded(maxWaitMs = 5000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const values = document.querySelectorAll(SELECTORS.dataPointValue);
    if (values.length > 0) {
      const loadingCount = Array.from(values).filter(
        (v) => v.textContent?.trim().toLowerCase() === 'loading...'
      ).length;
      if (loadingCount === 0) return; // All loaded
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  // Timeout - extract what's available
}

/**
 * Find a dataPointLabel by text and return its sibling dataPointValue content.
 * Dealigence renders data as label-value pairs in the DOM.
 */
function extractLabelValue(labelText: string): string | undefined {
  const labels = document.querySelectorAll(SELECTORS.dataPointLabel);
  for (const label of labels) {
    if (label.textContent?.trim().toLowerCase() === labelText.toLowerCase()) {
      // The value is typically the next sibling element
      const value = label.nextElementSibling;
      if (value) {
        const text = getText(value);
        if (text && text.toLowerCase() !== 'loading...') {
          return text;
        }
      }
      // Also check parent's next sibling pattern
      const parent = label.parentElement;
      if (parent) {
        const valueEl = parent.querySelector(SELECTORS.dataPointValue);
        if (valueEl) {
          const text = getText(valueEl);
          if (text && text.toLowerCase() !== 'loading...') {
            return text;
          }
        }
      }
    }
  }
  return undefined;
}

/**
 * Extract founders from the Founders data point (text fallback only).
 *
 * NOTE: Founders on Dealigence are rendered as avatar buttons with data stored
 * in React fiber (page JS context). Content scripts can't access page JS properties,
 * so the main fiber-based extraction happens in the background script via
 * chrome.scripting.executeScript with world: 'MAIN'. This function only handles
 * the text fallback case.
 */
function extractFounders(): DealigenceStakeholder[] {
  const labels = document.querySelectorAll(SELECTORS.dataPointLabel);
  let foundersValue: Element | null = null;
  for (const label of labels) {
    if (label.textContent?.trim() === 'Founders') {
      foundersValue = label.nextElementSibling;
      break;
    }
  }
  if (!foundersValue) return [];

  // Text fallback - comma-separated names (if not button-based)
  const text = foundersValue.textContent?.trim();
  if (text && text.toLowerCase() !== 'loading...') {
    return text
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .map((name) => ({ name }));
  }

  return [];
}

/**
 * Extract stakeholders from person cards (board members, advisors).
 * These are displayed as cards with personContainer class.
 */
function extractStakeholders(): DealigenceStakeholder[] {
  const stakeholders: DealigenceStakeholder[] = [];

  // Find the Stakeholders section by h4 heading
  const stakeholdersH4 = Array.from(document.querySelectorAll('h4')).find((h) =>
    h.textContent?.includes('Stakeholders')
  );

  let personContainers: NodeListOf<Element> | Element[] = [];

  if (stakeholdersH4) {
    const section = stakeholdersH4.nextElementSibling || stakeholdersH4.parentElement;
    if (section) {
      personContainers = section.querySelectorAll(SELECTORS.personContainer);
    }
  }

  // Fallback: search all person containers
  if (personContainers.length === 0) {
    personContainers = document.querySelectorAll(SELECTORS.personContainer);
  }

  for (const card of personContainers) {
    const detailsDiv = card.querySelector(SELECTORS.personDetails);

    let name: string;
    let title: string | undefined;

    if (detailsDiv) {
      const divs = detailsDiv.querySelectorAll('div');
      name = divs[0]?.textContent?.trim() || '';
      title = divs[1]?.textContent?.trim() || undefined;
    } else {
      name = getText(card.querySelector('h3, h4, [class*="name"]'));
      title = getText(card.querySelector('[class*="title"], [class*="role"], small')) || undefined;
    }

    if (!name) continue;

    const linkedinEl = card.querySelector(SELECTORS.founderLinkedin);
    const linkedinUrl = linkedinEl ? getAttr(linkedinEl, 'href') : undefined;

    stakeholders.push({
      name,
      title: title || undefined,
      linkedinUrl: linkedinUrl || undefined,
    });
  }

  return stakeholders.slice(0, 10);
}

/**
 * Extract description from DOM
 */
function extractDescription(): string | undefined {
  const descEl = queryFirst(SELECTORS.description);
  if (descEl) {
    const text = getText(descEl);
    if (text && text.length >= 20) return text;
  }

  // Fallback: look for longer paragraphs in main
  const paragraphs = document.querySelectorAll('main p, article p');
  const texts = Array.from(paragraphs)
    .map((p) => getText(p))
    .filter((t) => t.length > 50);
  return texts[0] || undefined;
}

/**
 * Extract website URL from the page.
 * Look for external links that aren't social media or Dealigence itself.
 */
function extractWebsite(): string | undefined {
  const links = document.querySelectorAll(SELECTORS.website);
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    if (
      href.includes('dealigence.vc') ||
      href.includes('linkedin.com') ||
      href.includes('twitter.com') ||
      href.includes('facebook.com') ||
      href.includes('crunchbase.com')
    ) {
      continue;
    }
    return href;
  }
  return undefined;
}

/**
 * Extract funding information from label-value pairs
 */
function extractFunding(): { totalFunding?: string; fundingStatus?: string } {
  return {
    totalFunding: extractLabelValue('Total Funding'),
    fundingStatus: extractLabelValue('Funding Status'),
  };
}

/**
 * Extract categories/tags.
 * Scoped to main company container to avoid "People Also Viewed" section.
 */
function extractCategories(): string[] {
  const categories: string[] = [];

  const companyContainer = document.querySelector(SELECTORS.companyContainer);
  if (!companyContainer) return categories;

  const tagsContainer = companyContainer.querySelector(SELECTORS.tagsContainer);
  if (tagsContainer) {
    const tags = tagsContainer.querySelectorAll(SELECTORS.tag);
    for (const tag of tags) {
      const text = tag.textContent?.trim();
      if (text && text.length < 50 && !text.includes('Load')) {
        categories.push(text);
      }
    }
  }

  return [...new Set(categories)];
}

/**
 * Extract headquarters from label-value pair
 */
function extractHeadquarters(): string | undefined {
  return extractLabelValue('Headquarters') || extractLabelValue('Location');
}

/**
 * Extract founding date from label-value pair
 */
function extractFounded(): string | undefined {
  return extractLabelValue('Established') || extractLabelValue('Founded');
}

/**
 * Extract employee count from label-value pair
 */
function extractEmployees(): string | undefined {
  return extractLabelValue('Employees');
}

/**
 * Check if the page is still loading (minimal content in DOM)
 */
function isPageLoading(): boolean {
  const mainContent = document.querySelector('main');
  if (mainContent) {
    const textContent = mainContent.textContent?.trim() || '';
    if (textContent.length < 100) return true;
  }

  // Check if data point values still show "loading..."
  const values = document.querySelectorAll(SELECTORS.dataPointValue);
  if (values.length > 0) {
    const loadingCount = Array.from(values).filter(
      (v) => v.textContent?.trim().toLowerCase() === 'loading...'
    ).length;
    if (loadingCount > 0) return true;
  }

  return false;
}

/**
 * Main extraction function.
 * Waits for async DOM data to load, then extracts all fields.
 * Returns raw extracted data - validation happens in background script.
 */
export async function extractCompanyData(): Promise<DealigenceCompanyData> {
  // 1. Wait for DOM data to load
  await waitForDataLoaded();

  // 2. Extract company name from h2
  const companyName = getText(document.querySelector(SELECTORS.companyName));

  // 3. Extract label-value pairs
  const founders = extractFounders();
  const { totalFunding, fundingStatus } = extractFunding();
  const headquarters = extractHeadquarters();
  const founded = extractFounded();
  const employees = extractEmployees();

  // 4. Extract description from DOM
  const description = extractDescription();

  // 5. Extract stakeholders from person cards
  const stakeholders = extractStakeholders();

  // 6. Combine founders + relevant stakeholders
  // Stakeholders with founder/CEO/CTO titles get added if not already in founders list
  const founderNames = new Set(founders.map((f) => f.name.toLowerCase()));
  for (const s of stakeholders) {
    const titleLower = (s.title || '').toLowerCase();
    const isFounderTitle =
      titleLower.includes('founder') ||
      titleLower.includes('ceo') ||
      titleLower.includes('cto') ||
      titleLower.includes('coo') ||
      titleLower.includes('chief');
    if (isFounderTitle && !founderNames.has(s.name.toLowerCase())) {
      founders.push(s);
      founderNames.add(s.name.toLowerCase());
    }
  }

  // 7. Extract other fields
  const website = extractWebsite();
  const categories = extractCategories();

  // 8. Check if still loading (fallback signal for background validation)
  const loading = isPageLoading();

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
    isLoading: loading,
  };
}
