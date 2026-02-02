/**
 * DOM selectors for Dealigence company pages
 * These selectors target the company profile page structure
 *
 * IMPORTANT: Dealigence uses h2 for company names, NOT h1
 * Categories must be scoped to main company container to avoid
 * picking up tags from "People Also Viewed" section
 */

export const SELECTORS = {
  // Company name - Dealigence uses h2, NOT h1
  companyName: 'h2',

  // Description - usually in a paragraph or description section
  description: '[class*="description"], [class*="about"] p, main p:first-of-type',

  // Website link
  website: 'a[href*="http"]:not([href*="dealigence"]):not([href*="linkedin"])',

  // Main company container - scope tags to this to avoid "People Also Viewed"
  companyContainer: 'main > div > div',

  // Categories/tags - these are scoped selectors used within companyContainer
  tagsContainer: '[class*="tags"]',
  tag: '[class*="tag"][class*="noBg"]',

  // Funding information
  totalFunding: '[class*="funding"], [class*="raised"]',
  fundingStatus: '[class*="stage"], [class*="status"]',

  // Company details
  headquarters: '[class*="location"], [class*="headquarters"]',
  founded: '[class*="founded"], [class*="year"]',

  // Team/Founders section
  foundersSection: '[class*="team"], [class*="founder"], [class*="people"]',
  founderCard: '[class*="person"], [class*="member"], [class*="founder"]',
  founderName: '[class*="name"], h3, h4',
  founderTitle: '[class*="title"], [class*="role"], small',
  founderLinkedin: 'a[href*="linkedin"]',
} as const;
