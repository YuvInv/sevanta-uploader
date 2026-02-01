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

export interface Company {
  id: string; // Local ID for tracking
  data: Record<string, string>;
  validation: ValidationResult;
  duplicate?: DuplicateInfo;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  uploadError?: string;
  createdDealId?: string;
  // Contact/Founder data
  contactData?: Record<string, string>;
  contactValidation?: ValidationResult;
  createdContactId?: string;
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
  | { type: 'CHECK_DUPLICATE'; companyName: string; website?: string };

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
}
