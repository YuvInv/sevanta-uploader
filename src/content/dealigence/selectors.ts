/**
 * DOM selectors for Dealigence company pages
 *
 * Dealigence uses CSS Modules with class names like:
 * "Person-module-scss-module__eMYvaG__personContainer"
 * We use [class*="..."] selectors to match the stable part of the name.
 *
 * Data architecture (as of 2026-02):
 * - All detailed data loads asynchronously into DOM
 * - Data displayed as label-value pairs (dataPointLabel / dataPointValue)
 * - Founders appear as avatar buttons in dataPointValue (data in React fiber)
 * - Stakeholders appear as person cards (personContainer)
 */

export const SELECTORS = {
  // Company name - Dealigence uses h2, NOT h1
  companyName: 'h2',

  // Label-value pairs for structured data (funding, employees, etc.)
  dataPointLabel: '[class*="dataPointLabel"]',
  dataPointValue: '[class*="dataPointValue"]',

  // Person cards (stakeholders & advisors section)
  personContainer: '[class*="personContainer"]',
  personDetails: '[class*="personDetails"]',

  // Description
  description: '[class*="description"], main p:first-of-type',

  // Main company container - scope tags to this to avoid "People Also Viewed"
  companyContainer: 'main > div > div',

  // Categories/tags
  tagsContainer: '[class*="tags"]',
  tag: '[class*="tag"][class*="noBg"]',

  // Website link
  website: 'a[href^="http"]',

  // Founder LinkedIn (within person cards)
  founderLinkedin: 'a[href*="linkedin"]',
} as const;
