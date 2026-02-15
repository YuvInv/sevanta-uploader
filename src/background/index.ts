import { sevantaApi, type SearchedContact } from '../lib/api';
import type { MessageType, MessageResponse, Schema, ContactSchema, Deal } from '../lib/types';
import { SCHEMA_CACHE_TTL_MS } from '../lib/constants';
import type { DealigenceCompanyData, TabInfo } from '../lib/dealigence/types';
import {
  extractSlugFromUrl,
  doesCompanyMatchSlug,
  isDealigenceCompanyPage,
} from '../lib/dealigence/urlUtils';
import type { IvcCompanyData } from '../lib/ivc/types';
import { isIvcCompanyPage } from '../lib/ivc/urlUtils';
import {
  EXTRACTION_MAX_RETRIES,
  EXTRACTION_INITIAL_DELAY_MS,
  EXTRACTION_DELAY_MULTIPLIER,
  EXTRACTION_MAX_DELAY_MS,
} from '../lib/dealigence/constants';

// Cache schemas in memory
let cachedSchema: Schema | null = null;
let cachedContactSchema: ContactSchema | null = null;

// Handle messages from popup
chrome.runtime.onMessage.addListener(
  (
    message: MessageType,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

    // Return true to indicate we'll send response asynchronously
    return true;
  }
);

async function handleMessage(message: MessageType): Promise<MessageResponse> {
  switch (message.type) {
    case 'CHECK_CONNECTION':
      return handleCheckConnection();

    case 'GET_SCHEMA':
      return handleGetSchema();

    case 'GET_CONTACT_SCHEMA':
      return handleGetContactSchema();

    case 'SEARCH_DEALS':
      return handleSearchDeals(message.filter);

    case 'CREATE_DEAL':
      return handleCreateDeal(message.data);

    case 'CREATE_CONTACT':
      return handleCreateContact(message.data, message.companyId);

    case 'CHECK_DUPLICATE':
      return handleCheckDuplicate(message.companyName, message.website);

    case 'SEARCH_CONTACTS':
      return handleSearchContacts(message.name, message.email);

    case 'CLEAR_CACHE':
      return handleClearCache();

    case 'ADD_DEAL_COMMENT':
      return handleAddDealComment(message.dealId, message.comment);

    case 'EXTRACT_DEALIGENCE_DATA':
      return handleExtractDealigenceData(message.tabId);

    case 'EXTRACT_IVC_DATA':
      return handleExtractIvcData(message.tabId);

    case 'GET_ACTIVE_TAB_INFO':
      return handleGetActiveTabInfo();

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

async function handleCheckConnection(): Promise<MessageResponse<boolean>> {
  try {
    const connected = await sevantaApi.checkConnection();
    return { success: true, data: connected };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function handleGetSchema(): Promise<MessageResponse<Schema>> {
  try {
    // Return cached schema if not expired
    if (cachedSchema && Date.now() - cachedSchema.fetchedAt < SCHEMA_CACHE_TTL_MS) {
      return { success: true, data: cachedSchema };
    }

    // Try to get from chrome.storage first
    const stored = await chrome.storage.local.get('schema');
    if (stored.schema && Date.now() - stored.schema.fetchedAt < SCHEMA_CACHE_TTL_MS) {
      cachedSchema = stored.schema;
      return { success: true, data: cachedSchema! };
    }

    // Fetch fresh schema
    const schema = await sevantaApi.getSchema();
    cachedSchema = schema;

    // Cache in storage
    await chrome.storage.local.set({ schema });

    return { success: true, data: schema };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch schema',
    };
  }
}

async function handleGetContactSchema(): Promise<MessageResponse<ContactSchema>> {
  try {
    // Return cached contact schema if not expired
    if (cachedContactSchema && Date.now() - cachedContactSchema.fetchedAt < SCHEMA_CACHE_TTL_MS) {
      return { success: true, data: cachedContactSchema };
    }

    // Try to get from chrome.storage first
    const stored = await chrome.storage.local.get('contactSchema');
    if (stored.contactSchema && Date.now() - stored.contactSchema.fetchedAt < SCHEMA_CACHE_TTL_MS) {
      cachedContactSchema = stored.contactSchema;
      return { success: true, data: cachedContactSchema! };
    }

    // Fetch fresh contact schema
    const contactSchema = await sevantaApi.getContactSchema();
    cachedContactSchema = contactSchema;

    // Cache in storage
    await chrome.storage.local.set({ contactSchema });

    return { success: true, data: contactSchema };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contact schema',
    };
  }
}

async function handleSearchDeals(filter: string): Promise<MessageResponse<Deal[]>> {
  try {
    const deals = await sevantaApi.searchDeals(filter);
    return { success: true, data: deals };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

async function handleCreateDeal(
  data: Record<string, string>
): Promise<MessageResponse<{ dealId?: string }>> {
  try {
    const result = await sevantaApi.createDeal(data);
    if (result.success) {
      return { success: true, data: { dealId: result.dealId } };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Create deal failed',
    };
  }
}

async function handleCreateContact(
  data: Record<string, string>,
  companyId: string
): Promise<MessageResponse<{ contactId?: string }>> {
  try {
    const result = await sevantaApi.createContact(data, companyId);
    if (result.success) {
      return { success: true, data: { contactId: result.contactId } };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Create contact failed',
    };
  }
}

async function handleCheckDuplicate(
  companyName: string,
  website?: string
): Promise<MessageResponse<{ isDuplicate: boolean; matches: Deal[] }>> {
  try {
    const result = await sevantaApi.checkDuplicate(companyName, website);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Duplicate check failed',
    };
  }
}

async function handleSearchContacts(
  name?: string,
  email?: string
): Promise<MessageResponse<SearchedContact[]>> {
  try {
    const contacts = await sevantaApi.searchContacts(name, email);
    return { success: true, data: contacts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Contact search failed',
    };
  }
}

/**
 * Extract founders from React fiber tree by executing in the page's MAIN world.
 * Content scripts can't access React fiber props (isolated world), so we use
 * chrome.scripting.executeScript with world: 'MAIN' to read them directly.
 */
async function extractFoundersFromPage(
  tabId: number
): Promise<Array<{ name: string; title?: string; linkedinUrl?: string }>> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        // Find the "Founders" dataPointValue element
        const labels = document.querySelectorAll('[class*="dataPointLabel"]');
        let foundersValue: Element | null = null;
        for (const label of labels) {
          if (label.textContent?.trim() === 'Founders') {
            foundersValue = label.nextElementSibling;
            break;
          }
        }
        if (!foundersValue) return [];

        const btn = foundersValue.querySelector('button');
        if (!btn) return [];

        // Find React fiber key (only accessible in MAIN world)
        const fiberKey = Object.keys(btn).find((k) => k.startsWith('__reactFiber'));
        if (!fiberKey) return [];

        // Walk up the fiber tree to find the component with the data array
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current = (btn as any)[fiberKey];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any[] | null = null;
        for (let i = 0; i < 20 && current; i++) {
          const mp = current.memoizedProps;
          if (mp && Array.isArray(mp.data) && mp.data[0]?.tooltip) {
            data = mp.data;
            break;
          }
          current = current.return;
        }
        if (!data) return [];

        // Extract founder props from tooltip components
        return data
          .map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any) => {
              const props = item.tooltip?.props?.children?.props;
              if (!props?.name) return null;
              return {
                name: props.name as string,
                title: (props.title as string) || undefined,
                linkedinUrl: props.linkedinUrl
                  ? `https://linkedin.com${props.linkedinUrl}`
                  : undefined,
              };
            }
          )
          .filter(Boolean) as Array<{ name: string; title?: string; linkedinUrl?: string }>;
      },
    });

    const founders = results?.[0]?.result;
    if (Array.isArray(founders) && founders.length > 0) {
      console.log(`[Sevanta] Extracted ${founders.length} founders from React fiber`);
      return founders;
    }
    return [];
  } catch (error) {
    console.log('[Sevanta] Founders fiber extraction failed:', error);
    return [];
  }
}

/**
 * Extract Dealigence company data directly from the page DOM using chrome.scripting.
 * This works even when the content script isn't loaded (e.g. after extension reload).
 * Replicates the content script's extraction logic with all selectors inline.
 */
async function extractDealigenceDataFromPage(tabId: number): Promise<DealigenceCompanyData | null> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        function getText(el: Element | null): string | undefined {
          const text = el?.textContent?.trim();
          return text || undefined;
        }

        function extractLabelValue(...labelNames: string[]): string | undefined {
          const labels = document.querySelectorAll('[class*="dataPointLabel"]');
          for (const label of labels) {
            const text = label.textContent?.trim().toLowerCase();
            if (text && labelNames.some((n) => n.toLowerCase() === text)) {
              // Try next sibling first, then parent's dataPointValue
              const sibling = label.nextElementSibling;
              if (sibling && sibling.matches('[class*="dataPointValue"]')) {
                const val = sibling.textContent?.trim();
                if (val && !val.toLowerCase().includes('loading')) return val;
              }
              const parent = label.parentElement;
              if (parent) {
                const value = parent.querySelector('[class*="dataPointValue"]');
                if (value) {
                  const val = value.textContent?.trim();
                  if (val && !val.toLowerCase().includes('loading')) return val;
                }
              }
            }
          }
          return undefined;
        }

        // Check if page is still loading
        function isPageLoading(): boolean {
          const main = document.querySelector('main');
          if (main && main.textContent && main.textContent.trim().length < 100) return true;
          const values = document.querySelectorAll('[class*="dataPointValue"]');
          for (const v of values) {
            if (v.textContent?.toLowerCase().includes('loading')) return true;
          }
          return false;
        }

        // Company name from h2
        const companyName = getText(document.querySelector('h2')) || 'Unknown Company';

        // Description
        const descEl =
          document.querySelector('[class*="description"]') ||
          document.querySelector('main p:first-of-type');
        const description = getText(descEl);

        // Label-value fields
        const totalFunding = extractLabelValue('Total Funding');
        const fundingStatus = extractLabelValue('Funding Status');
        const headquarters = extractLabelValue('Headquarters', 'Location');
        const founded = extractLabelValue('Established', 'Founded');
        const employees = extractLabelValue('Employees');

        // Founders from label-value (text only, fiber extraction done separately)
        const foundersText = extractLabelValue('Founders');
        const founders: Array<{ name: string; title?: string; linkedinUrl?: string }> = [];
        if (foundersText) {
          foundersText.split(',').forEach((name) => {
            const trimmed = name.trim();
            if (trimmed) founders.push({ name: trimmed });
          });
        }

        // Stakeholders from person cards (filter for founder/CEO/CTO titles)
        let stakeholderHeading: Element | null = null;
        const h4s = document.querySelectorAll('h4');
        for (const h4 of h4s) {
          if (h4.textContent?.trim().toLowerCase().includes('stakeholder')) {
            stakeholderHeading = h4;
            break;
          }
        }
        if (stakeholderHeading) {
          const container =
            stakeholderHeading.closest('section') || stakeholderHeading.parentElement;
          if (container) {
            const cards = container.querySelectorAll('[class*="personContainer"]');
            const founderTitles = /founder|ceo|cto|co-founder|cofounder/i;
            const existingNames = new Set(founders.map((f) => f.name.toLowerCase()));
            cards.forEach((card) => {
              const details = card.querySelector('[class*="personDetails"]');
              if (!details) return;
              const divs = details.querySelectorAll('div');
              const name = divs[0]?.textContent?.trim();
              const title = divs[1]?.textContent?.trim();
              if (!name) return;
              if (title && founderTitles.test(title) && !existingNames.has(name.toLowerCase())) {
                const linkedinEl = card.querySelector(
                  'a[href*="linkedin"]'
                ) as HTMLAnchorElement | null;
                founders.push({
                  name,
                  title,
                  linkedinUrl: linkedinEl?.href || undefined,
                });
                existingNames.add(name.toLowerCase());
              }
            });
          }
        }

        // Website (first external link, skip social/dealigence)
        let website: string | undefined;
        const links = document.querySelectorAll('a[href^="http"]');
        const skipDomains = [
          'dealigence.vc',
          'linkedin.com',
          'twitter.com',
          'facebook.com',
          'crunchbase.com',
        ];
        for (const link of links) {
          const href = (link as HTMLAnchorElement).href;
          if (!skipDomains.some((d) => href.includes(d))) {
            website = href;
            break;
          }
        }

        // Categories/tags
        const categories: string[] = [];
        const mainContainer = document.querySelector('main > div > div');
        if (mainContainer) {
          const tagsContainer = mainContainer.querySelector('[class*="tags"]');
          if (tagsContainer) {
            const tags = tagsContainer.querySelectorAll('[class*="tag"][class*="noBg"]');
            const seen = new Set<string>();
            tags.forEach((tag) => {
              const text = tag.textContent?.trim();
              if (
                text &&
                !text.toLowerCase().includes('loading') &&
                text.length <= 50 &&
                !seen.has(text)
              ) {
                categories.push(text);
                seen.add(text);
              }
            });
          }
        }

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
          isLoading: isPageLoading(),
        };
      },
    });

    const data = results?.[0]?.result;
    if (data) {
      console.log('[Sevanta] Dealigence direct extraction succeeded');
      return data as DealigenceCompanyData;
    }
    return null;
  } catch (error) {
    console.log('[Sevanta] Dealigence scripting extraction failed:', error);
    return null;
  }
}

async function handleExtractDealigenceData(
  tabId: number
): Promise<MessageResponse<DealigenceCompanyData>> {
  // Get URL from tab - this is the ground truth
  let expectedUrl: string | null = null;
  let urlSlug: string | null = null;
  try {
    const tab = await chrome.tabs.get(tabId);
    expectedUrl = tab.url || null;
    urlSlug = tab.url ? extractSlugFromUrl(tab.url) : null;
  } catch {
    return { success: false, error: 'Tab not found' };
  }

  if (!urlSlug || !expectedUrl) {
    return { success: false, error: 'Not a Dealigence company page' };
  }

  const tryExtract = async (): Promise<{
    data?: DealigenceCompanyData;
    error?: string;
    isStale?: boolean;
    staleReason?: string;
  }> => {
    let data: DealigenceCompanyData | null = null;

    // Try content script first, fall back to direct scripting extraction
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'EXTRACT_COMPANY_DATA',
      });

      if (response?.success && response.data) {
        data = response.data as DealigenceCompanyData;
      } else {
        return { error: response?.error || 'Extraction failed' };
      }
    } catch {
      // Content script not loaded (orphaned after extension reload) - use direct extraction
      console.log('[Sevanta] Content script not available, using direct Dealigence extraction');
      data = await extractDealigenceDataFromPage(tabId);
      if (!data) {
        return { error: 'Extraction failed - content script unavailable' };
      }
    }

    // VALIDATION 1: Check if page is still loading
    if (data.isLoading) {
      console.log('[Sevanta] Stale: page still loading');
      return { isStale: true, staleReason: 'loading' };
    }

    // VALIDATION 2: Validate sourceUrl exactly matches tab URL (ground truth)
    if (data.sourceUrl !== expectedUrl) {
      console.log(
        `[Sevanta] Stale: sourceUrl mismatch. Got "${data.sourceUrl}", expected "${expectedUrl}"`
      );
      return { isStale: true, staleReason: 'url-mismatch' };
    }

    // VALIDATION 3: Company name must match URL slug
    if (data.companyName && urlSlug) {
      if (!doesCompanyMatchSlug(data.companyName, urlSlug)) {
        console.log(`[Sevanta] Stale: got "${data.companyName}" but URL is "${urlSlug}"`);
        return { isStale: true, staleReason: 'name-mismatch' };
      }
    }

    // VALIDATION 4: Require minimum content (prevents skeleton data)
    const hasDescription = !!data.description && data.description.length > 20;
    const hasFunding = !!data.totalFunding || !!data.fundingStatus;
    if (!hasDescription && !hasFunding) {
      console.log('[Sevanta] Stale: missing description and funding (likely skeleton)');
      return { isStale: true, staleReason: 'skeleton' };
    }

    return { data };
  };

  // Initial attempt
  let result = await tryExtract();

  // Return immediately if successful
  if (result.data) {
    // Supplement founders from page context if content script found none
    if (result.data.founders.length === 0) {
      const pageFounders = await extractFoundersFromPage(tabId);
      if (pageFounders.length > 0) {
        result.data.founders = pageFounders;
      }
    }
    return { success: true, data: result.data };
  }

  // Retry with exponential backoff if stale
  let attempt = 1;
  let delay = EXTRACTION_INITIAL_DELAY_MS;

  while (result.isStale && attempt <= EXTRACTION_MAX_RETRIES) {
    console.log(
      `[Sevanta] Extraction attempt ${attempt}/${EXTRACTION_MAX_RETRIES}, waiting ${delay}ms... (reason: ${result.staleReason})`
    );
    await new Promise((r) => setTimeout(r, delay));
    result = await tryExtract();

    if (result.data) {
      console.log(`[Sevanta] Extraction succeeded on attempt ${attempt}`);
      // Supplement founders from page context if content script found none
      if (result.data.founders.length === 0) {
        const pageFounders = await extractFoundersFromPage(tabId);
        if (pageFounders.length > 0) {
          result.data.founders = pageFounders;
        }
      }
      // Include retry count in the data for UI feedback
      return { success: true, data: { ...result.data, _retryCount: attempt } };
    }

    delay = Math.min(delay * EXTRACTION_DELAY_MULTIPLIER, EXTRACTION_MAX_DELAY_MS);
    attempt++;
  }

  // CRITICAL: Never return stale data - return error instead
  if (result.isStale) {
    return { success: false, error: 'Page still loading. Please try again.' };
  }

  return { success: false, error: result.error || 'Extraction failed' };
}

/**
 * Extract IVC company data directly from the page DOM using chrome.scripting.
 * This works even when the content script isn't loaded (e.g. after extension reload).
 * IVC pages are server-rendered with stable DOM IDs, so this is reliable.
 */
async function extractIvcDataFromPage(tabId: number): Promise<IvcCompanyData | null> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        function getText(selector: string): string | undefined {
          const el = document.querySelector(selector);
          const text = el?.textContent?.trim();
          return text || undefined;
        }

        function stripHonorific(name: string): string {
          return name.replace(/^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Prof\.?)\s+/i, '');
        }

        // Website from link in the website row
        const websiteRow = document.querySelector('[id$="HeaderCard1_trWebSite"]');
        const websiteLink = websiteRow?.querySelector('a') as HTMLAnchorElement | null;
        const website = websiteLink?.href || undefined;

        // LinkedIn from account table
        const linkedinTable = document.querySelector('[id$="HeaderCard1_TblAccount"]');
        const linkedinLink = linkedinTable?.querySelector(
          'a[href*="linkedin.com"]'
        ) as HTMLAnchorElement | null;
        const linkedinUrl = linkedinLink?.href || undefined;

        // Management team
        const management: Array<{ name: string; title?: string; email?: string }> = [];
        for (let i = 0; i < 50; i++) {
          const nameEl = document.querySelector(`[id$="ManagementBoard1_RptMang_link_${i}"]`);
          if (!nameEl) break;
          const name = nameEl.textContent?.trim();
          if (!name) continue;
          const nameTd = nameEl.closest('td');
          const titleTd = nameTd?.nextElementSibling;
          const title = titleTd?.textContent?.trim() || undefined;
          const row = nameEl.closest('tr');
          const emailLink = row?.querySelector(
            'a[id*="htContactEmail"]'
          ) as HTMLAnchorElement | null;
          const email = emailLink?.href?.replace('mailto:', '') || undefined;
          management.push({ name: stripHonorific(name), title, email });
        }

        // Tags
        const tagLinks = document.querySelectorAll('a[href*="Advanced-Search?Tag="]');
        const tags = Array.from(tagLinks)
          .map((el) => el.textContent?.trim())
          .filter((t): t is string => !!t);

        return {
          companyName: getText('[id$="HeaderCard1_lFullName"]') || 'Unknown Company',
          description: getText('[id$="GeneralData1_lDisc"]'),
          website,
          linkedinUrl,
          sector: getText('[id$="GeneralData1_lSector"]'),
          stage: getText('[id$="GeneralData1_lStage"]'),
          established: getText('[id$="GeneralData1_lEstYear"]'),
          employees: getText('[id$="GeneralData1_lEmployees"]'),
          technology: getText('[id$="GeneralData1_lTech"]'),
          targetMarkets: getText('[id$="GeneralData1_lTarCos"]'),
          businessModel: getText('[id$="GeneralData1_lBusMod"]'),
          totalCapital: getText('[id$="Deals1_lblTotal"]'),
          tags,
          management,
          sourceUrl: window.location.href,
        };
      },
    });

    const data = results?.[0]?.result;
    return data as IvcCompanyData | null;
  } catch (error) {
    console.log('[Sevanta] IVC scripting extraction failed:', error);
    return null;
  }
}

async function handleExtractIvcData(tabId: number): Promise<MessageResponse<IvcCompanyData>> {
  // Verify it's an IVC page
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || !isIvcCompanyPage(tab.url)) {
      return { success: false, error: 'Not an IVC company page' };
    }
  } catch {
    return { success: false, error: 'Tab not found' };
  }

  // Try content script first, fall back to direct scripting extraction
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'EXTRACT_IVC_COMPANY_DATA',
    });

    if (response?.success && response.data) {
      return { success: true, data: response.data as IvcCompanyData };
    }
  } catch {
    // Content script not loaded - fall through to direct extraction
    console.log('[Sevanta] IVC content script not available, using direct extraction');
  }

  // Direct extraction via chrome.scripting (works without content script)
  const data = await extractIvcDataFromPage(tabId);
  if (data) {
    return { success: true, data };
  }

  return { success: false, error: 'IVC extraction failed' };
}

async function handleGetActiveTabInfo(): Promise<MessageResponse<TabInfo>> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab.url) {
      return { success: false, error: 'No active tab' };
    }

    return {
      success: true,
      data: {
        tabId: tab.id,
        url: tab.url,
        isDealigenceCompanyPage: isDealigenceCompanyPage(tab.url),
        isIvcCompanyPage: isIvcCompanyPage(tab.url),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tab info',
    };
  }
}

async function handleClearCache(): Promise<MessageResponse<boolean>> {
  try {
    cachedSchema = null;
    cachedContactSchema = null;
    await chrome.storage.local.remove(['schema', 'contactSchema']);
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache',
    };
  }
}

async function handleAddDealComment(
  dealId: string,
  comment: string
): Promise<MessageResponse<{ success: boolean }>> {
  try {
    const result = await sevantaApi.addDealComment(dealId, comment);
    if (result.success) {
      return { success: true, data: { success: true } };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Add comment failed',
    };
  }
}

// Clear stale cache on startup to ensure fresh schema after rebuilds
chrome.storage.local.remove(['schema', 'contactSchema']);

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Broadcast tab activation changes so sidepanel can detect site switches
// This is needed for non-SPA sites like IVC where there's no URL change event
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      chrome.runtime
        .sendMessage({
          type: 'TAB_ACTIVATED',
          url: tab.url,
          tabId: activeInfo.tabId,
          isDealigenceCompanyPage: isDealigenceCompanyPage(tab.url),
          isIvcCompanyPage: isIvcCompanyPage(tab.url),
        })
        .catch(() => {
          // Ignore if no listeners
        });
    }
  } catch {
    // Ignore
  }
});

// Also broadcast when a tab finishes loading (covers page navigation within same tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.active) {
    chrome.runtime
      .sendMessage({
        type: 'TAB_ACTIVATED',
        url: tab.url,
        tabId,
        isDealigenceCompanyPage: isDealigenceCompanyPage(tab.url),
        isIvcCompanyPage: isIvcCompanyPage(tab.url),
      })
      .catch(() => {
        // Ignore if no listeners
      });
  }
});

// Listen for SPA navigation (History API) on Dealigence
// This catches navigation that doesn't trigger full page loads
// Broadcasts ALL URL changes on dealigence.vc (not just company pages)
// so the sidepanel can update state when navigating away from company pages
chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    if (details.frameId === 0) {
      // Broadcast URL change to any listening sidepanels
      chrome.runtime
        .sendMessage({
          type: 'DEALIGENCE_URL_CHANGED',
          url: details.url,
          tabId: details.tabId,
        })
        .catch(() => {
          // Ignore errors if no listeners (sidepanel closed)
        });
    }
  },
  { url: [{ hostEquals: 'dealigence.vc' }] }
);

// Listen for SPA navigation (History API) on IVC
// Safety net in case IVC adds client-side routing in the future.
// IVC currently uses full page loads (ASP.NET WebForms), so TAB_ACTIVATED
// handles most navigation — but this covers pushState/replaceState if it ever occurs.
chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    if (details.frameId === 0) {
      chrome.runtime
        .sendMessage({
          type: 'IVC_URL_CHANGED',
          url: details.url,
          tabId: details.tabId,
        })
        .catch(() => {
          // Ignore errors if no listeners (sidepanel closed)
        });
    }
  },
  { url: [{ hostEquals: 'www.ivc-online.com' }] }
);
