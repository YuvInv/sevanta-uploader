import Papa from 'papaparse';
import type { ColumnMapping, ContactColumnMapping, SchemaField } from './types';

// Simple template field definitions (hardcoded for consistency)
// Note: SourceTypeID, Source (Source Notes), StageID, StatusID, FundID are auto-populated
// with defaults during upload, so they're excluded from the simple template
export const SIMPLE_TEMPLATE_FIELDS: Array<{ name: string; label: string; required?: boolean }> = [
  { name: 'CompanyName', label: 'Deal Name', required: true },
  { name: 'Description', label: 'Description' },
  { name: 'Website', label: 'Website' },
  { name: 'PastInvestments', label: 'Past Investments' },
];

// Contact fields for simple template
// Note: Using MobilePhone - Sevanta API accepts HomePhone, MobilePhone, WorkPhone
export const SIMPLE_CONTACT_FIELDS: Array<{ name: string; label: string; required?: boolean }> = [
  { name: 'Name', label: 'Contact Name' },
  { name: 'Email', label: 'Email' },
  { name: 'MobilePhone', label: 'Phone' },
  { name: 'Title', label: 'Title' },
];

// Deal field aliases for common field name mismatches
// Note: SourceTypeID and Source are not included here since they're auto-populated with defaults
const DEAL_ALIASES: Record<string, string[]> = {
  CompanyName: ['companyname', 'dealname', 'company', 'name', 'deal'],
  Description: ['description', 'desc', 'summary', 'about'],
  Website: ['website', 'url', 'site', 'web', 'homepage'],
  Num01: [
    'pastinvestments',
    'investments',
    'priorinvestments',
    'previousinvestments',
    'fundinground',
    'funding',
  ],
};

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCsv(content: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  const errors: string[] = [];

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      errors.push(`Row ${error.row}: ${error.message}`);
    }
  }

  return {
    headers: result.meta.fields || [],
    rows: result.data,
    errors,
  };
}

export function autoMapColumns(csvHeaders: string[], schemaFields: SchemaField[]): ColumnMapping[] {
  return csvHeaders.map((csvColumn) => {
    const normalizedCsvColumn = normalizeFieldName(csvColumn);

    // Try exact match first
    let matchedField = schemaFields.find(
      (f) =>
        normalizeFieldName(f.name) === normalizedCsvColumn ||
        normalizeFieldName(f.label) === normalizedCsvColumn
    );

    // Try deal aliases for common field name mismatches
    if (!matchedField) {
      for (const [fieldName, aliases] of Object.entries(DEAL_ALIASES)) {
        if (
          aliases.some((alias) => normalizedCsvColumn === alias || alias === normalizedCsvColumn)
        ) {
          // Look up the aliased field name in schema (using normalized check to be safe)
          matchedField = schemaFields.find(
            (f) => normalizeFieldName(f.name) === normalizeFieldName(fieldName)
          );
          if (matchedField) break;
        }
      }
    }

    // Try partial match
    if (!matchedField) {
      matchedField = schemaFields.find((f) => {
        const normalizedName = normalizeFieldName(f.name);
        const normalizedLabel = normalizeFieldName(f.label);
        return (
          normalizedName.includes(normalizedCsvColumn) ||
          normalizedCsvColumn.includes(normalizedName) ||
          normalizedLabel.includes(normalizedCsvColumn) ||
          normalizedCsvColumn.includes(normalizedLabel)
        );
      });
    }

    return {
      csvColumn,
      crmField: matchedField?.name || null,
    };
  });
}

function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Common aliases for contact fields
// Note: Using MobilePhone as the phone field - Sevanta API accepts HomePhone, MobilePhone, WorkPhone
// Note: LinkedIn field is not available in Sevanta contact schema
const CONTACT_ALIASES: Record<string, string[]> = {
  Name: [
    'name',
    'founder',
    'foundername',
    'contactname',
    'ceoname',
    'ceo',
    'contact',
    'person',
    'foundercontact',
  ],
  Email: ['email', 'founderemail', 'contactemail', 'ceoemail', 'emailaddress'],
  MobilePhone: [
    'phone',
    'founderphone',
    'contactphone',
    'ceophone',
    'phonenumber',
    'mobile',
    'cell',
    'mobilephone',
  ],
  Title: ['title', 'foundertitle', 'contacttitle', 'jobtitle', 'position', 'role'],
};

// Exclusive contact keywords that clearly indicate a contact column (not generic fields)
const EXCLUSIVE_CONTACT_KEYWORDS = [
  'founder',
  'foundername',
  'founderphone',
  'founderemail',
  'foundertitle',
  'contactname',
  'contactphone',
  'contactemail',
  'contacttitle',
  'contactmobilephone',
  'ceoname',
  'ceophone',
  'ceoemail',
];

// Check if a CSV column is a contact column (has Contact_ prefix or matches exclusive contact patterns)
export function isContactColumn(csvColumn: string): boolean {
  const normalized = normalizeFieldName(csvColumn);

  // Check for Contact_ prefix (case-insensitive) - must have something after "contact"
  // This matches "Contact_Name", "ContactName", but NOT just "Contact" or "CompanyName"
  if (normalized.startsWith('contact') && normalized.length > 7) {
    // Make sure it's not something like "ContactInfo" which could be a deal field
    // Only match if what follows is a known contact field pattern
    const afterContact = normalized.slice(7); // Remove "contact"
    const contactFieldNames = ['name', 'email', 'phone', 'title', 'linkedin', 'mobile', 'cell'];
    if (contactFieldNames.some((f) => afterContact === f || afterContact.startsWith(f))) {
      return true;
    }
  }

  // Check if it exactly matches an exclusive contact keyword
  if (EXCLUSIVE_CONTACT_KEYWORDS.includes(normalized)) {
    return true;
  }

  return false;
}

export function autoMapContactColumns(
  csvHeaders: string[],
  contactSchemaFields: SchemaField[]
): ContactColumnMapping[] {
  const mappings: ContactColumnMapping[] = [];

  for (const csvColumn of csvHeaders) {
    const normalizedCsvColumn = normalizeFieldName(csvColumn);

    // Strip Contact_ prefix for matching
    const contactPrefix = 'contact';
    const strippedColumn = normalizedCsvColumn.startsWith(contactPrefix)
      ? normalizedCsvColumn.slice(contactPrefix.length)
      : normalizedCsvColumn;

    // Check if this column looks like a contact field
    let matchedField: SchemaField | undefined;

    // Check aliases first (using stripped column name)
    for (const [fieldName, aliases] of Object.entries(CONTACT_ALIASES)) {
      if (
        aliases.some(
          (alias) =>
            strippedColumn === alias ||
            alias === strippedColumn ||
            normalizedCsvColumn === alias ||
            alias === normalizedCsvColumn
        )
      ) {
        // Try to find this field in the schema by name or label
        matchedField = contactSchemaFields.find(
          (f) =>
            f.name === fieldName ||
            normalizeFieldName(f.name) === normalizeFieldName(fieldName) ||
            normalizeFieldName(f.label) === normalizeFieldName(fieldName)
        );
        if (matchedField) break;
      }
    }

    // Try direct match with schema fields (using both original and stripped column)
    if (!matchedField) {
      matchedField = contactSchemaFields.find(
        (f) =>
          normalizeFieldName(f.name) === normalizedCsvColumn ||
          normalizeFieldName(f.label) === normalizedCsvColumn ||
          normalizeFieldName(f.name) === strippedColumn ||
          normalizeFieldName(f.label) === strippedColumn
      );
    }

    // Only add mapping if we found a match (contact columns are optional)
    if (matchedField) {
      mappings.push({
        csvColumn,
        contactField: matchedField.name,
      });
    }
  }

  return mappings;
}

export function applyContactMapping(
  rows: Record<string, string>[],
  mappings: ContactColumnMapping[]
): Record<string, string>[] {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};

    for (const mapping of mappings) {
      if (mapping.contactField) {
        const value = row[mapping.csvColumn];
        if (value) {
          mapped[mapping.contactField] = value;
        }
      }
    }

    return mapped;
  });
}

export function applyMapping(
  rows: Record<string, string>[],
  mappings: ColumnMapping[]
): Record<string, string>[] {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};

    for (const mapping of mappings) {
      if (mapping.crmField) {
        mapped[mapping.crmField] = row[mapping.csvColumn] || '';
      }
    }

    return mapped;
  });
}

export interface TemplateOptions {
  includeDescriptionRow?: boolean;
  includeContactFields?: boolean;
  contactSchemaFields?: SchemaField[];
  simple?: boolean;
}

export function generateCsvTemplate(
  schemaFields: SchemaField[],
  options: TemplateOptions = {}
): string {
  const {
    includeDescriptionRow = false,
    includeContactFields = false,
    contactSchemaFields = [],
    simple = false,
  } = options;

  if (simple) {
    // Use hardcoded simple template fields
    const dealHeaders = SIMPLE_TEMPLATE_FIELDS.map((f) => f.name);
    const contactHeaders = includeContactFields
      ? SIMPLE_CONTACT_FIELDS.map((f) => `Contact_${f.name}`)
      : [];
    const headers = [...dealHeaders, ...contactHeaders];

    const data: string[][] = [];
    if (includeDescriptionRow) {
      const dealDescriptions = SIMPLE_TEMPLATE_FIELDS.map((f) => {
        const parts: string[] = [];
        if (f.label) parts.push(f.label);
        if (f.required) parts.push('REQUIRED');
        return parts.join(' | ') || '';
      });
      const contactDescriptions = includeContactFields
        ? SIMPLE_CONTACT_FIELDS.map((f) => {
            const parts: string[] = [];
            if (f.label) parts.push(f.label);
            if (f.required) parts.push('REQUIRED');
            return parts.join(' | ') || '';
          })
        : [];
      data.push([...dealDescriptions, ...contactDescriptions]);
    }

    return Papa.unparse({ fields: headers, data });
  }

  // Full template: use schema fields
  const dealHeaders = schemaFields.map((f) => f.name);
  const contactHeaders =
    includeContactFields && contactSchemaFields.length > 0
      ? contactSchemaFields.map((f) => `Contact_${f.name}`)
      : [];
  const headers = [...dealHeaders, ...contactHeaders];

  const data: string[][] = [];
  if (includeDescriptionRow) {
    const dealDescriptions = schemaFields.map((f) => {
      const parts: string[] = [];
      if (f.label !== f.name) parts.push(f.label);
      if (f.required) parts.push('REQUIRED');
      if (f.type !== 'string') parts.push(`Type: ${f.type}`);
      if (f.options && f.options.length > 0) {
        const optionSample = f.options.slice(0, 3).join(', ');
        parts.push(`Options: ${optionSample}${f.options.length > 3 ? '...' : ''}`);
      }
      return parts.join(' | ') || '';
    });

    const contactDescriptions =
      includeContactFields && contactSchemaFields.length > 0
        ? contactSchemaFields.map((f) => {
            const parts: string[] = [];
            if (f.label !== f.name) parts.push(f.label);
            if (f.required) parts.push('REQUIRED');
            return parts.join(' | ') || '';
          })
        : [];

    data.push([...dealDescriptions, ...contactDescriptions]);
  }

  return Papa.unparse({ fields: headers, data });
}

export function downloadCsvTemplate(
  schemaFields: SchemaField[],
  options: TemplateOptions = {},
  filename = 'sevanta-template.csv'
): void {
  const csvContent = generateCsvTemplate(schemaFields, options);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
