import type { Schema, ContactSchema, Deal, SchemaField } from './types';

const BASE_URL = 'https://run.mydealflow.com/inv/api';

// Rate limiting state
const requestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;
const RATE_LIMIT_DELAY = 600; // 100 requests per minute = ~600ms between requests

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      await request();
      if (requestQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }
  }

  isProcessingQueue = false;
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const response = await fetch(`${BASE_URL}${endpoint} `, {
          ...options,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            reject(new Error('NOT_AUTHENTICATED'));
            return;
          }
          if (response.status === 429) {
            reject(new Error('RATE_LIMITED'));
            return;
          }
          reject(new Error(`API Error: ${response.status} `));
          return;
        }

        const data = await response.json();
        resolve(data as T);
      } catch (error) {
        reject(error);
      }
    });

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

export async function getSchema(): Promise<Schema> {
  const response = await apiRequest<RawSchemaResponse>('/schema/deals');

  // Log raw response for debugging
  console.log('Raw schema response:', response);

  // Sevanta returns { data: { fieldName: {...}, ... } } as an object
  const dataObj = response.data || {};
  const rawFields = Object.values(dataObj);

  console.log('Raw fields count:', rawFields.length);

  // Transform API response to our Schema type
  const fields: SchemaField[] = rawFields.map((field: RawSchemaField) => {
    const fieldName = field.dbname || '';

    // Convert optionlist object to array of values (the display labels)
    let options: string[] | undefined;
    if (field.optionlist && typeof field.optionlist === 'object') {
      // Store as "key:label" so we can map back later, or just use keys
      // For dropdowns, we typically need to send the key, not the label
      options = Object.entries(field.optionlist).map(([key]) => key);
    }

    return {
      name: fieldName,
      label: field.label || fieldName,
      type: mapFieldType(field.type),
      required: fieldName === 'CompanyName', // Only CompanyName is truly required
      options,
      // Store the full optionlist for reference
      optionlistFull: field.optionlist,
    };
  });

  console.log('Parsed fields:', fields.length);

  return {
    fields,
    fetchedAt: Date.now(),
    rawResponse: response,
  };
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

export async function getContactSchema(): Promise<ContactSchema> {
  const response = await apiRequest<RawSchemaResponse>('/schema/contacts');

  console.log('Raw contact schema response:', response);

  const dataObj = response.data || {};
  const rawFields = Object.values(dataObj);

  console.log('Raw contact fields count:', rawFields.length);

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
      required: fieldName === 'Name', // Only Name is required for contacts
      options,
      optionlistFull: field.optionlist,
    };
  });

  console.log('Parsed contact fields:', fields.length);

  return {
    fields,
    fetchedAt: Date.now(),
    rawResponse: response,
  };
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

export async function searchDeals(filter: string): Promise<Deal[]> {
  const response = await apiRequest<SearchResponse>(
    `/ deal / list ? ${filter}& _x[]=CompanyName & _x[]=Website`
  );

  // API returns data array, not deals
  const rawData = response.data || [];

  // Transform to our Deal format (API returns "Deal Name" not "CompanyName")
  return rawData.map((item) => ({
    id: item.CompanyID?.toString(),
    CompanyName: item['Deal Name'] || '',
    Website: item.Website || undefined,
    semanticScore: item.semantic_score,
  }));
}

// Search deals using text search (_text= parameter)
// This searches across all text fields and returns matching results
export async function searchDealsByText(searchText: string): Promise<Deal[]> {
  const encoded = encodeURIComponent(searchText);
  const response = await apiRequest<SearchResponse>(
    `/ deal / list ? _text = ${encoded}& _x[]=CompanyName & _x[]=Website`
  );

  const rawData = response.data || [];

  return rawData.map((item) => ({
    id: item.CompanyID?.toString(),
    CompanyName: item['Deal Name'] || '',
    Website: item.Website || undefined,
  }));
}

// Semantic search for fuzzy matching (_ss= parameter)
// Returns top 20 matches with semantic_score
export async function searchDealsSemantically(searchText: string): Promise<Deal[]> {
  const encoded = encodeURIComponent(searchText);
  const response = await apiRequest<SearchResponse>(
    `/ deal / list ? _ss = ${encoded}& _x[]=CompanyName & _x[]=Website`
  );

  const rawData = response.data || [];

  return rawData.map((item) => ({
    id: item.CompanyID?.toString(),
    CompanyName: item['Deal Name'] || '',
    Website: item.Website || undefined,
    semanticScore: item.semantic_score,
  }));
}

export async function checkDuplicate(
  companyName: string,
  website?: string
): Promise<{ isDuplicate: boolean; matches: Deal[] }> {
  const matches: Deal[] = [];

  // Search by company name using text search
  if (companyName) {
    // Use _text= search which properly filters results
    const nameResults = await searchDealsByText(companyName);

    // Filter client-side for exact match (case-insensitive)
    const exactMatches = nameResults.filter(
      (deal) => deal.CompanyName?.toLowerCase() === companyName.toLowerCase()
    );

    // If no exact matches, try semantic search for close matches
    if (exactMatches.length === 0) {
      const semanticResults = await searchDealsSemantically(companyName);
      // Only include semantic matches with high confidence (score > 0.8)
      const highConfidenceMatches = semanticResults.filter(
        (deal) =>
          deal.semanticScore &&
          deal.semanticScore > 0.8 &&
          deal.CompanyName?.toLowerCase() === companyName.toLowerCase()
      );
      matches.push(...highConfidenceMatches);
    } else {
      matches.push(...exactMatches);
    }
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

    const response = await fetch(`${BASE_URL} /deal/add`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as CreateDealResponse;

    console.log('Create deal response:', result);

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

    const response = await fetch(`${BASE_URL} /contact/add`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as CreateContactResponse;

    console.log('Create contact response:', result);

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
};
