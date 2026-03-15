import type { Schema, ContactSchema, Deal, SchemaField } from './types';
import type { CrmTask, CrmUser } from './tasks';
import {
  API_BASE_URL,
  RATE_LIMIT_DELAY_MS,
  RATE_LIMIT_MAX_QUEUE_SIZE,
  REQUEST_TIMEOUT_MS,
  SEMANTIC_SCORE_THRESHOLD,
} from './constants';
import {
  doCompanyNamesFuzzyMatch,
  normalizeCompanyName,
  stripCommonSuffixes,
  stripDisplaySuffixes,
} from './nameMatching';

// Rate limiting state
interface QueuedRequest {
  execute: () => Promise<void>;
  reject: (error: Error) => void;
}
const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request.execute();
      } catch (_error) {
        // Error is already handled in the execute function
      }
      if (requestQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
    }
  }

  isProcessingQueue = false;
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Queue overflow protection
  if (requestQueue.length >= RATE_LIMIT_MAX_QUEUE_SIZE) {
    throw new Error('QUEUE_OVERFLOW: Too many pending requests');
  }

  return new Promise((resolve, reject) => {
    const queuedRequest: QueuedRequest = {
      execute: async () => {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            credentials: 'include',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...options?.headers,
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              reject(new Error('NOT_AUTHENTICATED'));
              return;
            }
            if (response.status === 429) {
              reject(new Error('RATE_LIMITED'));
              return;
            }
            reject(new Error(`API Error: ${response.status}`));
            return;
          }

          const data = await response.json();
          resolve(data as T);
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === 'AbortError') {
            reject(new Error('REQUEST_TIMEOUT'));
          } else {
            reject(error);
          }
        }
      },
      reject,
    };

    requestQueue.push(queuedRequest);
    processQueue();
  });
}

export async function checkConnection(): Promise<boolean> {
  try {
    await apiRequest('/schema/deals');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_AUTHENTICATED') {
      return false;
    }
    throw error;
  }
}

// Sevanta API schema field format
interface RawSchemaField {
  dbname: string;
  label?: string;
  type?: string;
  optiongroup?: string;
  helptext?: string;
  optionlist?: Record<string, string>; // Sevanta uses object {key: label} not array
}

// Sevanta returns { status: "ok", data: { fieldName: {...}, ... } }
interface RawSchemaResponse {
  status?: string;
  data?: Record<string, RawSchemaField>; // Object keyed by field name, not array
  [key: string]: unknown;
}

function mapFieldType(apiType?: string): SchemaField['type'] {
  switch (apiType?.toLowerCase()) {
    case 'select':
    case 'multi-check':
    case 'multi-tag':
    case 'radio':
      return 'dropdown';
    case 'int':
    case 'float':
    case 'number':
    case 'integer':
      return 'number';
    case 'date':
    case 'datetime':
      return 'date';
    case 'url':
      return 'url';
    case 'email':
      return 'email';
    case 'boolean':
    case 'bool':
      return 'boolean';
    case 'text':
    case 'textarea':
    case 'tel':
    default:
      return 'string';
  }
}

// Generic schema fetcher to avoid duplication
async function fetchSchema<T extends Schema | ContactSchema>(
  endpoint: string,
  requiredFieldName: string
): Promise<T> {
  const response = await apiRequest<RawSchemaResponse>(endpoint);

  const dataObj = response.data || {};
  const rawFields = Object.values(dataObj);

  const fields: SchemaField[] = rawFields.map((field: RawSchemaField) => {
    const fieldName = field.dbname || '';

    let options: string[] | undefined;
    if (field.optionlist && typeof field.optionlist === 'object') {
      options = Object.entries(field.optionlist).map(([key]) => key);
    }

    return {
      name: fieldName,
      label: field.label || fieldName,
      type: mapFieldType(field.type),
      required: fieldName === requiredFieldName,
      options,
      optionlistFull: field.optionlist,
    };
  });

  return {
    fields,
    fetchedAt: Date.now(),
    rawResponse: response,
  } as T;
}

export async function getSchema(): Promise<Schema> {
  return fetchSchema<Schema>('/schema/deals', 'CompanyName');
}

export async function getContactSchema(): Promise<ContactSchema> {
  return fetchSchema<ContactSchema>('/schema/contacts', 'Name');
}

interface SearchResponse {
  status?: string;
  data?: Array<{
    CompanyID?: number;
    'Deal Name'?: string;
    Website?: string;
    semantic_score?: number;
    [key: string]: unknown;
  }>;
  count_returned?: number;
  count_total?: number;
  [key: string]: unknown;
}

// Transform raw API response to Deal format
function transformSearchResponse(response: SearchResponse): Deal[] {
  const rawData = response.data || [];
  return rawData.map((item) => ({
    id: item.CompanyID?.toString(),
    CompanyName: item['Deal Name'] || '',
    Website: item.Website || undefined,
    semanticScore: item.semantic_score,
  }));
}

export async function searchDeals(filter: string): Promise<Deal[]> {
  const response = await apiRequest<SearchResponse>(
    `/deal/list?${filter}&_x[]=CompanyName&_x[]=Website`
  );
  return transformSearchResponse(response);
}

// Search deals using text search (_text= parameter)
export async function searchDealsByText(searchText: string): Promise<Deal[]> {
  const encoded = encodeURIComponent(searchText);
  const response = await apiRequest<SearchResponse>(
    `/deal/list?_text=${encoded}&_x[]=CompanyName&_x[]=Website`
  );
  return transformSearchResponse(response);
}

// Semantic search for fuzzy matching (_ss= parameter)
export async function searchDealsSemantically(searchText: string): Promise<Deal[]> {
  const encoded = encodeURIComponent(searchText);
  const response = await apiRequest<SearchResponse>(
    `/deal/list?_ss=${encoded}&_x[]=CompanyName&_x[]=Website`
  );
  return transformSearchResponse(response);
}

export async function checkDuplicate(
  companyName: string,
  website?: string
): Promise<{ isDuplicate: boolean; matches: Deal[] }> {
  const matches: Deal[] = [];

  // Search by company name: try original name first (most likely to match),
  // then suffix-stripped fallback, then semantic search
  if (companyName) {
    const normalized = normalizeCompanyName(companyName);
    const stripped = stripCommonSuffixes(normalized);
    const base = stripped || normalized || companyName;

    // Query variations: original name first, display-stripped (most likely CRM match), then slug fallback
    const displayStripped = stripDisplaySuffixes(companyName);
    const queryVariations = [
      companyName, // "Ionix.IO Ltd." — original name
      displayStripped, // "Ionix.IO" — most likely CRM match
      base.replace(/-/g, ' '), // "ionix io" — normalized slug fallback
    ].filter((q, i, arr) => q.length > 2 && arr.indexOf(q) === i);

    let nameMatches: Deal[] = [];
    for (const query of queryVariations) {
      const results = await searchDealsByText(query);

      if (results.length > 0) {
        const fuzzyMatches = results.filter(
          (deal) => deal.CompanyName && doCompanyNamesFuzzyMatch(deal.CompanyName, companyName)
        );
        if (fuzzyMatches.length > 0) {
          nameMatches = fuzzyMatches;
          break;
        }
      }
    }

    if (nameMatches.length > 0) {
      matches.push(...nameMatches);
    } else {
      // No text search variation found a match — try semantic search as fallback
      const semanticResults = await searchDealsSemantically(companyName);
      const highConfidenceMatches = semanticResults.filter(
        (deal) =>
          deal.semanticScore &&
          deal.semanticScore > SEMANTIC_SCORE_THRESHOLD &&
          deal.CompanyName &&
          doCompanyNamesFuzzyMatch(deal.CompanyName, companyName)
      );
      matches.push(...highConfidenceMatches);
    }
  }

  // Early return if we already found matches - skip website search (optimization)
  if (matches.length > 0) {
    return {
      isDuplicate: true,
      matches,
    };
  }

  // Search by website if provided
  if (website) {
    // Use text search for website
    const websiteResults = await searchDealsByText(website);

    // Filter client-side for exact match
    const normalizedWebsite = normalizeWebsite(website);
    const exactMatches = websiteResults.filter((deal) => {
      const dealWebsite = normalizeWebsite(deal.Website || '');
      return dealWebsite === normalizedWebsite;
    });

    // Add unique matches
    for (const match of exactMatches) {
      if (!matches.some((m) => m.id === match.id)) {
        matches.push(match);
      }
    }
  }

  return {
    isDuplicate: matches.length > 0,
    matches,
  };
}

// Normalize website for comparison (lowercase, remove protocol, trailing slash)
function normalizeWebsite(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

interface CreateDealResponse {
  status?: string;
  error?: string;
  id?: string;
  CompanyID?: number;
  data?: {
    CompanyID?: string | number;
    [key: string]: unknown;
  };
  deal?: { id: string };
  [key: string]: unknown;
}

export async function createDeal(
  data: Record<string, string>
): Promise<{ success: boolean; dealId?: string; error?: string }> {
  try {
    // Use form-urlencoded format as the API might not accept JSON
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    }

    const response = await fetch(`${API_BASE_URL}/deal/add`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as CreateDealResponse;

    // Check for error in response body
    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Check for success indicators
    if (result.status === 'ok' || result.CompanyID || result.data?.CompanyID || result.id) {
      // CompanyID can be at top level or inside data object
      const companyId = result.CompanyID?.toString() || result.data?.CompanyID?.toString();
      return {
        success: true,
        dealId: companyId || result.id || result.deal?.id,
      };
    }

    return {
      success: false,
      error: 'Unknown response format',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

interface CreateContactResponse {
  status?: string;
  error?: string;
  id?: string;
  ContactID?: number;
  [key: string]: unknown;
}

export async function createContact(
  data: Record<string, string>,
  companyId: string
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const formData = new URLSearchParams();

    // Add the company link
    formData.append('CompanyID', companyId);

    // Add contact data
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    }

    const response = await fetch(`${API_BASE_URL}/contact/add`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as CreateContactResponse;

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    if (result.status === 'ok' || result.ContactID || result.id) {
      return {
        success: true,
        contactId: result.ContactID?.toString() || result.id,
      };
    }

    return {
      success: false,
      error: 'Unknown response format',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Contact search types
interface ContactSearchResponse {
  status?: string;
  data?: Array<{
    ContactID?: number;
    'Contact Name'?: string;
    Email?: string;
    Company?: string;
    CompanyID?: number;
    [key: string]: unknown;
  }>;
  count_returned?: number;
  count_total?: number;
  [key: string]: unknown;
}

export interface SearchedContact {
  contactId: string;
  name: string;
  email?: string;
  company?: string;
  companyId?: string;
}

// Search contacts by name or email using text search
export async function searchContacts(name?: string, email?: string): Promise<SearchedContact[]> {
  // Use the search term - prefer email if provided, otherwise use name
  const searchTerm = email || name;
  if (!searchTerm) {
    return [];
  }

  const params = new URLSearchParams();
  // Use _text search which searches across all text fields
  // This is more reliable than filter[Email] which may not work correctly
  params.append('_text', searchTerm);

  // Request the fields we need
  params.append('_x[]', 'Name');
  params.append('_x[]', 'Email');
  params.append('_x[]', 'Company');
  params.append('_x[]', 'CompanyID');

  const response = await apiRequest<ContactSearchResponse>(`/contact/list?${params.toString()}`);

  const rawData = response.data || [];
  return rawData.map((item) => ({
    contactId: item.ContactID?.toString() || '',
    name: item['Contact Name'] || '',
    email: item.Email || undefined,
    company: item.Company || undefined,
    companyId: item.CompanyID?.toString() || undefined,
  }));
}

/**
 * Add a comment to an existing deal
 */
export async function addDealComment(
  dealId: string,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new URLSearchParams();
    formData.append('comment', comment);

    const response = await fetch(`${API_BASE_URL}/deal/${dealId}/addComment`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as { status?: string; error?: string };

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.status === 'ok') {
      return { success: true };
    }

    return { success: false, error: 'Unknown response format' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get contacts linked to a specific deal/company.
 * Uses GET /deal/{id}?_x[]=contacts which returns linked contacts reliably.
 * (The contact/list?filter[CompanyID] approach is unreliable — contacts don't
 * store CompanyID as a filterable field, so the API returns unrelated results.)
 */
export async function getContactsForDeal(dealId: string): Promise<SearchedContact[]> {
  interface DealWithContacts {
    status?: string;
    data?: {
      contacts?: Array<{
        ContactID?: number | string;
        'Contact Name'?: string;
        Email?: string;
        Company?: string;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };
  }

  const response = await apiRequest<DealWithContacts>(`/deal/${dealId}?_x[]=contacts`);
  const contacts = response.data?.contacts || [];

  return contacts.map((item) => ({
    contactId: item.ContactID?.toString() || '',
    name: item['Contact Name'] || '',
    email: item.Email || undefined,
    company: item.Company || undefined,
    companyId: dealId,
  }));
}

// Task API types
interface TaskListResponse {
  status?: string;
  data?: CrmTask[];
  count_returned?: number;
  count_total?: number;
  [key: string]: unknown;
}

interface UserListResponse {
  status?: string;
  data?: Array<{ UserID?: number; id?: number; Name?: string; name?: string }>;
  [key: string]: unknown;
}

interface SingleDealResponse {
  status?: string;
  data?: {
    CompanyID?: number;
    'Deal Name'?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface SingleContactResponse {
  status?: string;
  data?: {
    ContactID?: number;
    'Contact Name'?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// List tasks with filters
export async function listTasks(statusIds: number[], assignee?: string): Promise<CrmTask[]> {
  const params = new URLSearchParams();
  params.append('_x[]', '*');
  for (const id of statusIds) {
    params.append('TaskStatusID[]', id.toString());
  }
  if (assignee) {
    params.append('AssignedUserID[]', assignee);
  }
  const response = await apiRequest<TaskListResponse>(`/task/list?${params.toString()}`);
  return response.data || [];
}

// Create a new task
export async function createTask(
  data: Record<string, string>
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    }

    const response = await fetch(`${API_BASE_URL}/task/add`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as {
      status?: string;
      error?: string;
      TaskID?: number;
      id?: string;
    };

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.status === 'ok' || result.TaskID || result.id) {
      return {
        success: true,
        taskId: result.TaskID?.toString() || result.id,
      };
    }

    return { success: false, error: 'Unknown response format' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Update an existing task
export async function updateTask(
  taskId: number,
  data: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    }

    const response = await fetch(`${API_BASE_URL}/task/${taskId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as { status?: string; error?: string };

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// List all users
export async function listUsers(): Promise<CrmUser[]> {
  const response = await apiRequest<UserListResponse>('/user/list');
  const rawData = response.data || [];
  return rawData.map((u) => ({
    id: (u.UserID || u.id || '').toString(),
    name: u.Name || u.name || '',
  }));
}

// Get deal name by ID (lightweight)
export async function getDealName(dealId: string): Promise<{ id: string; name: string } | null> {
  try {
    const response = await apiRequest<SingleDealResponse>(`/deal/${dealId}?_x[]=CompanyName`);
    if (response.data) {
      return {
        id: (response.data.CompanyID || dealId).toString(),
        name: response.data['Deal Name'] || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Get contact name by ID (lightweight)
export async function getContactName(
  contactId: string
): Promise<{ id: string; name: string } | null> {
  try {
    const response = await apiRequest<SingleContactResponse>(`/contact/${contactId}?_x[]=Name`);
    if (response.data) {
      return {
        id: (response.data.ContactID || contactId).toString(),
        name: response.data['Contact Name'] || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Export for use in background service worker
export const sevantaApi = {
  checkConnection,
  getSchema,
  getContactSchema,
  searchDeals,
  searchDealsByText,
  searchDealsSemantically,
  checkDuplicate,
  createDeal,
  createContact,
  searchContacts,
  getContactsForDeal,
  addDealComment,
  listTasks,
  createTask,
  updateTask,
  listUsers,
  getDealName,
  getContactName,
};
