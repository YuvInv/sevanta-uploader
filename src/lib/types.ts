// Sevanta API Types

export interface SchemaField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'dropdown' | 'url' | 'email' | 'boolean';
  required: boolean;
  options?: string[]; // For dropdown fields - the keys to send to API
  optionlistFull?: Record<string, string>; // Full key->label mapping for display
}

export interface Schema {
  fields: SchemaField[];
  fetchedAt: number;
  rawResponse?: unknown; // For debugging - stores the raw API response
}

// Contact schema follows same structure as deal schema
export type ContactSchemaField = SchemaField;

export interface ContactSchema {
  fields: ContactSchemaField[];
  fetchedAt: number;
  rawResponse?: unknown;
}

export interface Contact {
  id?: string;
  Name: string;
  Email?: string;
  MobilePhone?: string; // Correct API field name (alternatives: HomePhone, WorkPhone)
  Title?: string;
  CompanyID?: string; // Link to deal
  ContactTypeID?: string; // e.g., "MGT" for management, "SRC" for source
  [key: string]: string | number | boolean | undefined;
}

export interface Deal {
  id?: string;
  CompanyName: string;
  Website?: string;
  semanticScore?: number;
  [key: string]: string | number | boolean | undefined;
}

// Contact data with validation for multi-contact support
export interface ContactData {
  data: Record<string, string>;
  validation: ValidationResult;
}

// Upload status for individual contacts
export interface ContactUploadStatus {
  index: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
  createdContactId?: string;
}

export interface Company {
  id: string; // Local ID for tracking
  data: Record<string, string>;
  validation: ValidationResult;
  duplicate?: DuplicateInfo;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error' | 'partial';
  uploadError?: string;
  createdDealId?: string;

  // Multi-contact support (array of contacts per company)
  contacts: ContactData[];
  contactUploadStatuses?: ContactUploadStatus[];

  // Grouping metadata
  sourceRowCount?: number;

  skipped?: boolean;
}

export interface ContactColumnMapping {
  csvColumn: string;
  contactField: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface DuplicateInfo {
  isDuplicate: boolean;
  matchedOn: 'CompanyName' | 'Website' | 'both';
  existingDeal?: {
    id: string;
    CompanyName: string;
    Website?: string;
  };
}

export interface ColumnMapping {
  csvColumn: string;
  crmField: string | null;
}

export interface UploadProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  current?: string; // Current company being uploaded
}

// Message types for communication between popup and background
export type MessageType =
  | { type: 'CHECK_CONNECTION' }
  | { type: 'GET_SCHEMA' }
  | { type: 'GET_CONTACT_SCHEMA' }
  | { type: 'CLEAR_CACHE' }
  | { type: 'SEARCH_DEALS'; filter: string }
  | { type: 'CREATE_DEAL'; data: Record<string, string> }
  | { type: 'CREATE_CONTACT'; data: Record<string, string>; companyId: string }
  | { type: 'CHECK_DUPLICATE'; companyName: string; website?: string }
  | { type: 'SEARCH_CONTACTS'; name?: string; email?: string }
  | { type: 'ADD_DEAL_COMMENT'; dealId: string; comment: string }
  | { type: 'EXTRACT_DEALIGENCE_DATA'; tabId: number }
  | { type: 'EXTRACT_IVC_DATA'; tabId: number }
  | { type: 'EXTRACT_TIMELESS_DATA'; tabId: number }
  | { type: 'GET_ACTIVE_TAB_INFO' }
  | { type: 'GET_DEAL_CONTACTS'; dealId: string };

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
}

// Contact Lookup Types

export type MatchType = 'strong' | 'possible' | 'none';

export interface LookupContact {
  id: string;
  name: string;
  email?: string;
  rawInput: string;
}

export interface CRMContact {
  contactId: string;
  name: string;
  email?: string;
  company?: string;
  companyId?: string;
}

export interface ContactLookupResult {
  id: string;
  input: LookupContact;
  matchType: MatchType;
  bestMatch?: CRMContact;
  allMatches: CRMContact[];
}

export interface ContactLookupProgress {
  total: number;
  completed: number;
  current?: string;
  strongCount: number;
  possibleCount: number;
}
