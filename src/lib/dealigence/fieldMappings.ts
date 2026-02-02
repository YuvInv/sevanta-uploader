/**
 * Field mappings for transforming Dealigence data to Sevanta CRM format
 */

/**
 * Map Dealigence funding status to CRM LifeStageID (Round)
 * CRM values: PRE (Pre-seed), 0 (Seed), PS (Post-seed), A (Series A), B, C, Later, O (Other)
 */
export const FUNDING_STATUS_TO_ROUND: Record<string, string> = {
  'pre-seed': 'PRE',
  preseed: 'PRE',
  seed: '0',
  'post-seed': 'PS',
  postseed: 'PS',
  'series a': 'A',
  'series-a': 'A',
  a: 'A',
  'series b': 'B',
  'series-b': 'B',
  b: 'B',
  'series c': 'C',
  'series-c': 'C',
  c: 'C',
  'series d': 'Later',
  'series-d': 'Later',
  d: 'Later',
  later: 'Later',
  bootstrapped: 'O',
  fundraising: '0', // Default to Seed for companies actively fundraising
  'need funding': '0',
};

/**
 * Map Dealigence categories to CRM IndustryID
 * CRM uses specific codes like "Health", "IT", "Fintech", etc.
 */
export const CATEGORY_TO_INDUSTRY: Record<string, string> = {
  // Healthcare & Medical
  healthcare: 'Health',
  'healthcare providers': 'Health',
  'medical devices': 'Assi',
  medical: 'Health',
  biotech: 'Health',
  'digital health': 'Digi',
  'digital therapy': 'Digi',
  diagnostics: 'Remo',
  neuroscience: 'Health',
  treatments: 'HTR',
  pharma: 'HPH',

  // Software & Enterprise
  saas: 'IT',
  software: 'IT',
  enterprise: 'IT',
  'enterprise software': 'IT',
  devtools: 'Devtools',
  'developer tools': 'Devtools',
  cloud: 'Clou',
  infrastructure: 'SWI',

  // AI & Data
  ai: 'IT',
  'ai/ml': 'IT',
  ml: 'IT',
  'machine learning': 'IT',
  'computer vision': 'IT',
  analytics: 'IT',
  bigdata: 'IT',
  'big data': 'IT',

  // Fintech
  fintech: 'Fintech',
  payments: 'Fintech',
  insurtech: 'Insurtech',
  banking: 'Fintech',

  // Cybersecurity
  cybersecurity: 'Cyber',
  security: 'Cyber',
  'cyber security': 'Cyber',

  // Mobility & Transportation
  mobility: 'Mobility',
  automotive: 'Vehi',
  transportation: 'Mobility',
  logistics: 'Mobility',
  'fleet management': 'Flee',
  robotics: 'Robotics',
  drones: 'Robotics',
  'autonomous vehicles': 'ADAS',

  // Energy & Climate
  cleantech: 'Energy',
  'clean tech': 'Energy',
  energy: 'Energy',
  sustainability: 'GHG',
  'climate tech': 'GHG',
  solar: 'EnSol',

  // Food & Agriculture
  foodtech: 'FoodAg',
  'food tech': 'FoodAg',
  agtech: 'Farm',
  'ag tech': 'Farm',
  agriculture: 'Farm',

  // Other verticals
  edtech: 'ED',
  'education tech': 'ED',
  proptech: 'Infr',
  'property tech': 'Infr',
  'real estate': 'Infr',
  legaltech: 'Legal',
  'legal tech': 'Legal',
  hrtech: 'HR',
  'hr tech': 'HR',
  retail: 'Reta',
  'e-commerce': 'Reta',
  ecommerce: 'Reta',
  marketplace: 'Reta',
  gaming: 'Admedia',
  media: 'Admedia',
  entertainment: 'Admedia',
  adtech: 'Admedia',
  'ad tech': 'Admedia',

  // Business models (less specific)
  b2b: 'IT',
  b2c: 'O',
  b2b2c: 'IT',
  consumer: 'O',
};

/**
 * Get CRM LifeStageID from Dealigence funding status
 */
export function mapFundingStatusToRound(fundingStatus: string | undefined): string | undefined {
  if (!fundingStatus) return undefined;

  const normalized = fundingStatus.toLowerCase().trim();
  return FUNDING_STATUS_TO_ROUND[normalized];
}

/**
 * Get CRM IndustryID from Dealigence categories
 * Returns the first matching industry from the categories list
 */
export function mapCategoriesToIndustry(categories: string[]): string | undefined {
  for (const category of categories) {
    const normalized = category.toLowerCase().trim();
    const industry = CATEGORY_TO_INDUSTRY[normalized];
    if (industry) {
      return industry;
    }
  }
  return undefined;
}

/**
 * Get all matching industries from categories (for potential multi-select support)
 */
export function mapCategoriesToIndustries(categories: string[]): string[] {
  const industries = new Set<string>();
  for (const category of categories) {
    const normalized = category.toLowerCase().trim();
    const industry = CATEGORY_TO_INDUSTRY[normalized];
    if (industry) {
      industries.add(industry);
    }
  }
  return Array.from(industries);
}
