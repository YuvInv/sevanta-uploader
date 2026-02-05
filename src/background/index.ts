import { sevantaApi, type SearchedContact } from '../lib/api';
import type { MessageType, MessageResponse, Schema, ContactSchema, Deal } from '../lib/types';
import { SCHEMA_CACHE_TTL_MS } from '../lib/constants';
import type { DealigenceCompanyData, TabInfo } from '../lib/dealigence/types';
import {
  extractSlugFromUrl,
  doesCompanyMatchSlug,
  isDealigenceCompanyPage,
} from '../lib/dealigence/urlUtils';
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
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'EXTRACT_COMPANY_DATA',
      });

      if (!response?.success || !response.data) {
        return { error: response?.error || 'Extraction failed' };
      }

      const data = response.data as DealigenceCompanyData;

      // VALIDATION 1: Check if page is still loading (skeleton/spinner detected)
      if (data.isLoading) {
        console.log('[Sevanta] Stale: page still loading (skeleton/spinner detected)');
        return { isStale: true, staleReason: 'loading' };
      }

      // VALIDATION 2: Reject URL fallback as source (unreliable during SPA navigation)
      // URL fallback always matches the URL, masking stale DOM/JSON-LD data
      if (data.companyNameSource === 'url-fallback') {
        console.log('[Sevanta] Stale: company name from URL fallback (unreliable)');
        return { isStale: true, staleReason: 'url-fallback' };
      }

      // VALIDATION 3: Validate sourceUrl exactly matches tab URL (ground truth)
      if (data.sourceUrl !== expectedUrl) {
        console.log(
          `[Sevanta] Stale: sourceUrl mismatch. Got "${data.sourceUrl}", expected "${expectedUrl}"`
        );
        return { isStale: true, staleReason: 'url-mismatch' };
      }

      // VALIDATION 4: Company name must match URL slug (existing check)
      if (data.companyName && urlSlug) {
        if (!doesCompanyMatchSlug(data.companyName, urlSlug)) {
          console.log(`[Sevanta] Stale: got "${data.companyName}" but URL is "${urlSlug}"`);
          return { isStale: true, staleReason: 'name-mismatch' };
        }
      }

      // VALIDATION 5: Require minimum content (prevents skeleton data)
      // Must have at least description OR some funding info
      const hasDescription = !!data.description && data.description.length > 20;
      const hasFunding = !!data.totalFunding || !!data.fundingStatus;
      if (!hasDescription && !hasFunding) {
        console.log('[Sevanta] Stale: missing description and funding (likely skeleton)');
        return { isStale: true, staleReason: 'skeleton' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed' };
    }
  };

  // Initial attempt
  let result = await tryExtract();

  // Return immediately if successful
  if (result.data) {
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

// Listen for SPA navigation (History API) on Dealigence
// This catches navigation that doesn't trigger full page loads
chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    if (details.frameId === 0 && isDealigenceCompanyPage(details.url)) {
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
