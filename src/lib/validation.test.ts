import { describe, it, expect } from 'vitest';
import { validateCompany, normalizeDropdownValue, normalizeCompanyData } from './validation';
import type { Schema, SchemaField } from './types';

// Helper to create test schema
function createSchema(fields: Partial<SchemaField>[]): Schema {
  return {
    fields: fields.map((f, i) => ({
      name: f.name || `field${i}`,
      label: f.label || f.name || `Field ${i}`,
      type: f.type || 'string',
      required: f.required || false,
      options: f.options,
      optionlistFull: f.optionlistFull,
    })),
    fetchedAt: Date.now(),
  };
}

describe('validateCompany', () => {
  describe('required fields', () => {
    it('should fail validation when required field is missing', () => {
      const schema = createSchema([
        { name: 'CompanyName', label: 'Company Name', required: true },
      ]);
      const data = {};

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('CompanyName');
      expect(result.errors[0].message).toContain('required');
    });

    it('should fail validation when required field is empty string', () => {
      const schema = createSchema([
        { name: 'CompanyName', label: 'Company Name', required: true },
      ]);
      const data = { CompanyName: '   ' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should pass validation when required field is present', () => {
      const schema = createSchema([
        { name: 'CompanyName', label: 'Company Name', required: true },
      ]);
      const data = { CompanyName: 'Acme Corp' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('unknown fields', () => {
    it('should warn about unknown fields', () => {
      const schema = createSchema([{ name: 'CompanyName' }]);
      const data = { CompanyName: 'Acme', UnknownField: 'value' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true); // Warnings don't make it invalid
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('UnknownField');
    });
  });

  describe('URL validation', () => {
    it('should accept valid URLs with protocol', () => {
      const schema = createSchema([{ name: 'Website', type: 'url' }]);
      const data = { Website: 'https://example.com' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid URLs without protocol', () => {
      const schema = createSchema([{ name: 'Website', type: 'url' }]);
      const data = { Website: 'example.com' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const schema = createSchema([{ name: 'Website', type: 'url' }]);
      const data = { Website: 'not a url' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid URL');
    });
  });

  describe('email validation', () => {
    it('should accept valid emails', () => {
      const schema = createSchema([{ name: 'Email', type: 'email' }]);
      const data = { Email: 'test@example.com' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });

    it('should reject emails without @', () => {
      const schema = createSchema([{ name: 'Email', type: 'email' }]);
      const data = { Email: 'notanemail.com' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid email');
    });

    it('should reject emails without domain', () => {
      const schema = createSchema([{ name: 'Email', type: 'email' }]);
      const data = { Email: 'test@' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(false);
    });
  });

  describe('number validation', () => {
    it('should accept valid numbers', () => {
      const schema = createSchema([{ name: 'Amount', type: 'number' }]);
      const data = { Amount: '123.45' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });

    it('should accept negative numbers', () => {
      const schema = createSchema([{ name: 'Amount', type: 'number' }]);
      const data = { Amount: '-100' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });

    it('should reject non-numeric strings', () => {
      const schema = createSchema([{ name: 'Amount', type: 'number' }]);
      const data = { Amount: 'not a number' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('number');
    });
  });

  describe('date validation', () => {
    it('should accept valid ISO dates', () => {
      const schema = createSchema([{ name: 'FoundedDate', type: 'date' }]);
      const data = { FoundedDate: '2023-01-15' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });

    it('should accept other date formats', () => {
      const schema = createSchema([{ name: 'FoundedDate', type: 'date' }]);
      const data = { FoundedDate: 'January 15, 2023' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid dates', () => {
      const schema = createSchema([{ name: 'FoundedDate', type: 'date' }]);
      const data = { FoundedDate: 'not a date' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid date');
    });
  });

  describe('dropdown validation', () => {
    it('should accept valid dropdown option', () => {
      const schema = createSchema([
        { name: 'Stage', type: 'dropdown', options: ['Seed', 'Series A', 'Series B'] },
      ]);
      const data = { Stage: 'Seed' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });

    it('should accept dropdown option case-insensitively', () => {
      const schema = createSchema([
        { name: 'Stage', type: 'dropdown', options: ['Seed', 'Series A', 'Series B'] },
      ]);
      const data = { Stage: 'seed' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid dropdown option', () => {
      const schema = createSchema([
        { name: 'Stage', type: 'dropdown', options: ['Seed', 'Series A', 'Series B'] },
      ]);
      const data = { Stage: 'Invalid Stage' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid value');
      expect(result.errors[0].message).toContain('Seed');
    });

    it('should accept any value if no options defined', () => {
      const schema = createSchema([{ name: 'Stage', type: 'dropdown' }]);
      const data = { Stage: 'Anything' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });
  });

  describe('empty values', () => {
    it('should skip validation for empty non-required fields', () => {
      const schema = createSchema([{ name: 'Email', type: 'email', required: false }]);
      const data = { Email: '' };

      const result = validateCompany(data, schema);

      expect(result.valid).toBe(true);
    });
  });
});

describe('normalizeDropdownValue', () => {
  it('should return correct casing for dropdown values', () => {
    const field: SchemaField = {
      name: 'Stage',
      label: 'Stage',
      type: 'dropdown',
      required: false,
      options: ['Seed', 'Series A', 'Series B'],
    };

    expect(normalizeDropdownValue('seed', field)).toBe('Seed');
    expect(normalizeDropdownValue('SERIES A', field)).toBe('Series A');
    expect(normalizeDropdownValue('series b', field)).toBe('Series B');
  });

  it('should return original value for non-dropdown fields', () => {
    const field: SchemaField = {
      name: 'Name',
      label: 'Name',
      type: 'string',
      required: false,
    };

    expect(normalizeDropdownValue('test', field)).toBe('test');
  });

  it('should return original value if no match found', () => {
    const field: SchemaField = {
      name: 'Stage',
      label: 'Stage',
      type: 'dropdown',
      required: false,
      options: ['Seed', 'Series A'],
    };

    expect(normalizeDropdownValue('Unknown', field)).toBe('Unknown');
  });
});

describe('normalizeCompanyData', () => {
  it('should normalize all dropdown fields', () => {
    const schema = createSchema([
      { name: 'CompanyName', type: 'string' },
      { name: 'Stage', type: 'dropdown', options: ['Seed', 'Series A'] },
      { name: 'Sector', type: 'dropdown', options: ['FinTech', 'HealthTech'] },
    ]);
    const data = {
      CompanyName: '  Acme Corp  ',
      Stage: 'seed',
      Sector: 'fintech',
    };

    const result = normalizeCompanyData(data, schema);

    expect(result.CompanyName).toBe('Acme Corp');
    expect(result.Stage).toBe('Seed');
    expect(result.Sector).toBe('FinTech');
  });

  it('should handle null/undefined values', () => {
    const schema = createSchema([{ name: 'Name', type: 'string' }]);
    const data = { Name: undefined as unknown as string };

    const result = normalizeCompanyData(data, schema);

    expect(result.Name).toBe('');
  });
});
