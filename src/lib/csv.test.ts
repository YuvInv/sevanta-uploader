import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  autoMapColumns,
  autoMapContactColumns,
  isContactColumn,
  applyMapping,
  applyContactMapping,
  generateCsvTemplate,
  SIMPLE_TEMPLATE_FIELDS,
  SIMPLE_CONTACT_FIELDS,
} from './csv';
import type { SchemaField } from './types';

// Helper to create test schema fields
function createFields(fields: Partial<SchemaField>[]): SchemaField[] {
  return fields.map((f, i) => ({
    name: f.name || `field${i}`,
    label: f.label || f.name || `Field ${i}`,
    type: f.type || 'string',
    required: f.required || false,
    options: f.options,
  }));
}

describe('parseCsv', () => {
  it('should parse simple CSV with headers', () => {
    const csv = `Name,Email,Website
Acme,acme@example.com,https://acme.com
Beta,beta@example.com,https://beta.com`;

    const result = parseCsv(csv);

    expect(result.headers).toEqual(['Name', 'Email', 'Website']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      Name: 'Acme',
      Email: 'acme@example.com',
      Website: 'https://acme.com',
    });
    expect(result.errors).toHaveLength(0);
  });

  it('should trim headers and values', () => {
    const csv = `  Name  ,  Email
  Acme Corp  ,  acme@example.com  `;

    const result = parseCsv(csv);

    expect(result.headers).toEqual(['Name', 'Email']);
    expect(result.rows[0].Name).toBe('Acme Corp');
    expect(result.rows[0].Email).toBe('acme@example.com');
  });

  it('should skip empty lines', () => {
    const csv = `Name,Email
Acme,acme@example.com

Beta,beta@example.com
`;

    const result = parseCsv(csv);

    expect(result.rows).toHaveLength(2);
  });

  it('should handle quoted values with commas', () => {
    const csv = `Name,Description
Acme,"A company, inc."`;

    const result = parseCsv(csv);

    expect(result.rows[0].Description).toBe('A company, inc.');
  });

  it('should handle empty CSV', () => {
    const result = parseCsv('');

    expect(result.headers).toEqual([]);
    expect(result.rows).toHaveLength(0);
  });
});

describe('autoMapColumns', () => {
  it('should map exact matches by field name', () => {
    const headers = ['CompanyName', 'Description', 'Website'];
    const fields = createFields([
      { name: 'CompanyName', label: 'Deal Name' },
      { name: 'Description', label: 'Description' },
      { name: 'Website', label: 'Website' },
    ]);

    const result = autoMapColumns(headers, fields);

    expect(result).toEqual([
      { csvColumn: 'CompanyName', crmField: 'CompanyName' },
      { csvColumn: 'Description', crmField: 'Description' },
      { csvColumn: 'Website', crmField: 'Website' },
    ]);
  });

  it('should map by label when name does not match', () => {
    const headers = ['Deal Name', 'Description'];
    const fields = createFields([
      { name: 'CompanyName', label: 'Deal Name' },
      { name: 'Description', label: 'Description' },
    ]);

    const result = autoMapColumns(headers, fields);

    expect(result[0].crmField).toBe('CompanyName');
  });

  it('should map case-insensitively', () => {
    const headers = ['companyname', 'DESCRIPTION'];
    const fields = createFields([
      { name: 'CompanyName', label: 'Deal Name' },
      { name: 'Description', label: 'Description' },
    ]);

    const result = autoMapColumns(headers, fields);

    expect(result[0].crmField).toBe('CompanyName');
    expect(result[1].crmField).toBe('Description');
  });

  it('should use aliases for common field names', () => {
    const headers = ['company', 'url', 'desc'];
    const fields = createFields([
      { name: 'CompanyName', label: 'Deal Name' },
      { name: 'Website', label: 'Website' },
      { name: 'Description', label: 'Description' },
    ]);

    const result = autoMapColumns(headers, fields);

    expect(result[0].crmField).toBe('CompanyName');
    expect(result[1].crmField).toBe('Website');
    expect(result[2].crmField).toBe('Description');
  });

  it('should return null for unmatched columns', () => {
    const headers = ['RandomColumn'];
    const fields = createFields([{ name: 'CompanyName' }]);

    const result = autoMapColumns(headers, fields);

    expect(result[0].crmField).toBeNull();
  });
});

describe('isContactColumn', () => {
  it('should detect Contact_ prefixed columns', () => {
    expect(isContactColumn('Contact_Name')).toBe(true);
    expect(isContactColumn('Contact_Email')).toBe(true);
    expect(isContactColumn('Contact_Phone')).toBe(true);
    expect(isContactColumn('ContactName')).toBe(true);
  });

  it('should not match generic "Contact" or partial matches', () => {
    expect(isContactColumn('Contact')).toBe(false);
    expect(isContactColumn('CompanyContact')).toBe(false);
  });

  it('should detect founder columns', () => {
    expect(isContactColumn('FounderName')).toBe(true);
    expect(isContactColumn('Founder')).toBe(true);
    expect(isContactColumn('FounderEmail')).toBe(true);
    expect(isContactColumn('FounderPhone')).toBe(true);
  });

  it('should detect CEO columns', () => {
    expect(isContactColumn('CEOName')).toBe(true);
    expect(isContactColumn('CEOEmail')).toBe(true);
  });

  it('should not detect deal columns as contact columns', () => {
    expect(isContactColumn('CompanyName')).toBe(false);
    expect(isContactColumn('Website')).toBe(false);
    expect(isContactColumn('Description')).toBe(false);
    expect(isContactColumn('Email')).toBe(false); // Generic email is not a contact column
  });
});

describe('autoMapContactColumns', () => {
  it('should map Contact_ prefixed columns', () => {
    const headers = ['Contact_Name', 'Contact_Email'];
    const fields = createFields([
      { name: 'Name', label: 'Name' },
      { name: 'Email', label: 'Email' },
    ]);

    const result = autoMapContactColumns(headers, fields);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ csvColumn: 'Contact_Name', contactField: 'Name' });
    expect(result[1]).toEqual({ csvColumn: 'Contact_Email', contactField: 'Email' });
  });

  it('should map founder columns', () => {
    const headers = ['FounderName', 'FounderEmail'];
    const fields = createFields([
      { name: 'Name', label: 'Name' },
      { name: 'Email', label: 'Email' },
    ]);

    const result = autoMapContactColumns(headers, fields);

    expect(result).toHaveLength(2);
    expect(result.find((m) => m.csvColumn === 'FounderName')?.contactField).toBe('Name');
  });

  it('should map phone to MobilePhone', () => {
    const headers = ['FounderPhone'];
    const fields = createFields([{ name: 'MobilePhone', label: 'Mobile Phone' }]);

    const result = autoMapContactColumns(headers, fields);

    expect(result[0].contactField).toBe('MobilePhone');
  });

  it('should not create mappings for unrecognized columns', () => {
    const headers = ['RandomColumn'];
    const fields = createFields([{ name: 'Name' }]);

    const result = autoMapContactColumns(headers, fields);

    expect(result).toHaveLength(0);
  });
});

describe('applyMapping', () => {
  it('should apply column mappings to rows', () => {
    const rows = [{ Company: 'Acme', URL: 'https://acme.com' }];
    const mappings = [
      { csvColumn: 'Company', crmField: 'CompanyName' },
      { csvColumn: 'URL', crmField: 'Website' },
    ];

    const result = applyMapping(rows, mappings);

    expect(result[0]).toEqual({
      CompanyName: 'Acme',
      Website: 'https://acme.com',
    });
  });

  it('should skip unmapped columns', () => {
    const rows = [{ Company: 'Acme', Notes: 'Some notes' }];
    const mappings = [
      { csvColumn: 'Company', crmField: 'CompanyName' },
      { csvColumn: 'Notes', crmField: null },
    ];

    const result = applyMapping(rows, mappings);

    expect(result[0]).toEqual({ CompanyName: 'Acme' });
    expect(result[0]).not.toHaveProperty('Notes');
  });

  it('should handle empty values', () => {
    const rows = [{ Company: '' }];
    const mappings = [{ csvColumn: 'Company', crmField: 'CompanyName' }];

    const result = applyMapping(rows, mappings);

    expect(result[0].CompanyName).toBe('');
  });
});

describe('applyContactMapping', () => {
  it('should apply contact mappings to rows', () => {
    const rows = [{ Contact_Name: 'John Doe', Contact_Email: 'john@example.com' }];
    const mappings = [
      { csvColumn: 'Contact_Name', contactField: 'Name' },
      { csvColumn: 'Contact_Email', contactField: 'Email' },
    ];

    const result = applyContactMapping(rows, mappings);

    expect(result[0]).toEqual({
      Name: 'John Doe',
      Email: 'john@example.com',
    });
  });

  it('should skip null mappings', () => {
    const rows = [{ Contact_Name: 'John Doe', Random: 'value' }];
    const mappings = [
      { csvColumn: 'Contact_Name', contactField: 'Name' },
      { csvColumn: 'Random', contactField: null },
    ];

    const result = applyContactMapping(rows, mappings);

    expect(result[0]).toEqual({ Name: 'John Doe' });
  });

  it('should skip empty values', () => {
    const rows = [{ Contact_Name: '', Contact_Email: 'john@example.com' }];
    const mappings = [
      { csvColumn: 'Contact_Name', contactField: 'Name' },
      { csvColumn: 'Contact_Email', contactField: 'Email' },
    ];

    const result = applyContactMapping(rows, mappings);

    expect(result[0]).toEqual({ Email: 'john@example.com' });
    expect(result[0]).not.toHaveProperty('Name');
  });
});

describe('generateCsvTemplate', () => {
  it('should generate simple template with headers only', () => {
    const fields = createFields([
      { name: 'CompanyName', label: 'Deal Name' },
      { name: 'Description', label: 'Description' },
    ]);

    const result = generateCsvTemplate(fields);

    expect(result).toContain('CompanyName');
    expect(result).toContain('Description');
  });

  it('should include description row when requested', () => {
    const fields = createFields([
      { name: 'CompanyName', label: 'Deal Name', required: true },
      { name: 'Stage', label: 'Stage', type: 'dropdown', options: ['Seed', 'Series A'] },
    ]);

    const result = generateCsvTemplate(fields, { includeDescriptionRow: true });

    expect(result).toContain('REQUIRED');
    expect(result).toContain('dropdown');
    expect(result).toContain('Seed');
  });

  it('should include contact fields when requested', () => {
    const fields = createFields([{ name: 'CompanyName' }]);
    const contactFields = createFields([{ name: 'Name' }, { name: 'Email' }]);

    const result = generateCsvTemplate(fields, {
      includeContactFields: true,
      contactSchemaFields: contactFields,
    });

    expect(result).toContain('Contact_Name');
    expect(result).toContain('Contact_Email');
  });

  it('should generate simple template with hardcoded fields', () => {
    const fields: SchemaField[] = []; // Ignored when simple=true

    const result = generateCsvTemplate(fields, { simple: true });

    for (const field of SIMPLE_TEMPLATE_FIELDS) {
      expect(result).toContain(field.name);
    }
  });

  it('should include contact fields in simple template when requested', () => {
    const fields: SchemaField[] = [];

    const result = generateCsvTemplate(fields, { simple: true, includeContactFields: true });

    for (const field of SIMPLE_CONTACT_FIELDS) {
      expect(result).toContain(`Contact_${field.name}`);
    }
  });
});
