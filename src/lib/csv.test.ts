import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  autoMapColumns,
  autoMapContactColumns,
  isContactColumn,
  applyMapping,
  applyContactMapping,
  generateCsvTemplate,
  normalizeWebsite,
  generateCompanyKey,
  groupRowsByCompany,
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

describe('normalizeWebsite', () => {
  it('should return empty string for empty input', () => {
    expect(normalizeWebsite('')).toBe('');
    expect(normalizeWebsite('   ')).toBe('');
  });

  it('should remove http:// and https://', () => {
    expect(normalizeWebsite('https://acme.com')).toBe('acme.com');
    expect(normalizeWebsite('http://acme.com')).toBe('acme.com');
  });

  it('should remove www. prefix', () => {
    expect(normalizeWebsite('www.acme.com')).toBe('acme.com');
    expect(normalizeWebsite('https://www.acme.com')).toBe('acme.com');
  });

  it('should remove trailing slashes', () => {
    expect(normalizeWebsite('acme.com/')).toBe('acme.com');
    expect(normalizeWebsite('https://acme.com///')).toBe('acme.com');
  });

  it('should lowercase the URL', () => {
    expect(normalizeWebsite('ACME.COM')).toBe('acme.com');
    expect(normalizeWebsite('https://WWW.Acme.Com/')).toBe('acme.com');
  });
});

describe('generateCompanyKey', () => {
  it('should generate key from CompanyName and Website', () => {
    const row = { CompanyName: 'Acme Corp', Website: 'acme.com' };
    expect(generateCompanyKey(row)).toBe('acme corp|||acme.com');
  });

  it('should normalize company name to lowercase', () => {
    const row = { CompanyName: 'ACME Corp', Website: 'acme.com' };
    expect(generateCompanyKey(row)).toBe('acme corp|||acme.com');
  });

  it('should handle empty website', () => {
    const row = { CompanyName: 'Acme Corp', Website: '' };
    expect(generateCompanyKey(row)).toBe('acme corp|||');
  });

  it('should handle empty company name', () => {
    const row = { CompanyName: '', Website: 'acme.com' };
    expect(generateCompanyKey(row)).toBe('|||acme.com');
  });

  it('should normalize website URLs', () => {
    const row1 = { CompanyName: 'Acme', Website: 'https://www.acme.com/' };
    const row2 = { CompanyName: 'Acme', Website: 'acme.com' };
    expect(generateCompanyKey(row1)).toBe(generateCompanyKey(row2));
  });
});

describe('groupRowsByCompany', () => {
  it('should group rows with same CompanyName and Website', () => {
    const dealData = [
      { CompanyName: 'Acme Corp', Website: 'acme.com', Description: 'AI startup' },
      { CompanyName: 'Acme Corp', Website: 'acme.com', Description: '' },
      { CompanyName: 'Beta Inc', Website: 'beta.io', Description: 'Fintech' },
    ];
    const contactData = [
      { Name: 'John Doe', Email: 'john@acme.com' },
      { Name: 'Jane Smith', Email: 'jane@acme.com' },
      { Name: 'Bob Wilson', Email: 'bob@beta.io' },
    ];

    const result = groupRowsByCompany(dealData, contactData);

    expect(result).toHaveLength(2);

    const acme = result.find((g) => g.companyData.CompanyName === 'Acme Corp');
    expect(acme).toBeDefined();
    expect(acme!.contacts).toHaveLength(2);
    expect(acme!.sourceRowIndices).toEqual([0, 1]);
    expect(acme!.companyData.Description).toBe('AI startup'); // First row's data

    const beta = result.find((g) => g.companyData.CompanyName === 'Beta Inc');
    expect(beta).toBeDefined();
    expect(beta!.contacts).toHaveLength(1);
  });

  it('should not add contacts without Name', () => {
    const dealData = [
      { CompanyName: 'Acme Corp', Website: 'acme.com' },
      { CompanyName: 'Beta Inc', Website: 'beta.io' },
    ];
    const contactData = [
      { Name: 'John Doe', Email: 'john@acme.com' },
      { Name: '', Email: 'info@beta.io' }, // No name
    ];

    const result = groupRowsByCompany(dealData, contactData);

    const acme = result.find((g) => g.companyData.CompanyName === 'Acme Corp');
    expect(acme!.contacts).toHaveLength(1);

    const beta = result.find((g) => g.companyData.CompanyName === 'Beta Inc');
    expect(beta!.contacts).toHaveLength(0);
  });

  it('should treat different websites as different companies', () => {
    const dealData = [
      { CompanyName: 'Acme', Website: 'acme.com' },
      { CompanyName: 'Acme', Website: 'acme.io' },
    ];
    const contactData = [{ Name: 'John' }, { Name: 'Jane' }];

    const result = groupRowsByCompany(dealData, contactData);

    expect(result).toHaveLength(2);
  });

  it('should group companies with same name and ALL empty websites', () => {
    const dealData = [
      { CompanyName: 'Apollo', Website: '' },
      { CompanyName: 'Apollo', Website: '' },
    ];
    const contactData = [{ Name: 'John' }, { Name: 'Jane' }];

    const result = groupRowsByCompany(dealData, contactData);

    expect(result).toHaveLength(1);
    expect(result[0].contacts).toHaveLength(2);
  });

  it('should handle empty contact data array', () => {
    const dealData = [{ CompanyName: 'Acme', Website: 'acme.com' }];
    const contactData: Record<string, string>[] = [];

    const result = groupRowsByCompany(dealData, contactData);

    expect(result).toHaveLength(1);
    expect(result[0].contacts).toHaveLength(0);
  });

  it('should normalize website URLs when grouping', () => {
    const dealData = [
      { CompanyName: 'Acme', Website: 'https://www.acme.com/' },
      { CompanyName: 'Acme', Website: 'acme.com' },
      { CompanyName: 'Acme', Website: 'HTTP://ACME.COM' },
    ];
    const contactData = [{ Name: 'John' }, { Name: 'Jane' }, { Name: 'Bob' }];

    const result = groupRowsByCompany(dealData, contactData);

    expect(result).toHaveLength(1);
    expect(result[0].contacts).toHaveLength(3);
  });

  it('should preserve order of groups based on first occurrence', () => {
    const dealData = [
      { CompanyName: 'Beta', Website: 'beta.io' },
      { CompanyName: 'Acme', Website: 'acme.com' },
      { CompanyName: 'Beta', Website: 'beta.io' },
    ];
    const contactData = [{ Name: 'Bob' }, { Name: 'John' }, { Name: 'Jane' }];

    const result = groupRowsByCompany(dealData, contactData);

    expect(result[0].companyData.CompanyName).toBe('Beta');
    expect(result[1].companyData.CompanyName).toBe('Acme');
  });
});
