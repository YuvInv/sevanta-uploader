import type {
  Schema,
  SchemaField,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';

export function validateCompany(data: Record<string, string>, schema: Schema): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check required fields
  for (const field of schema.fields) {
    if (field.required) {
      const value = data[field.name];
      if (!value || value.trim() === '') {
        errors.push({
          field: field.name,
          message: `${field.label} is required`,
        });
      }
    }
  }

  // Validate each field
  for (const [fieldName, value] of Object.entries(data)) {
    if (!value || value.trim() === '') continue;

    const field = schema.fields.find((f) => f.name === fieldName);
    if (!field) {
      warnings.push({
        field: fieldName,
        message: `Unknown field: ${fieldName}`,
      });
      continue;
    }

    const fieldError = validateFieldValue(value, field);
    if (fieldError) {
      errors.push({
        field: fieldName,
        message: fieldError,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateFieldValue(value: string, field: SchemaField): string | null {
  switch (field.type) {
    case 'dropdown':
      return validateDropdown(value, field);
    case 'url':
      return validateUrl(value);
    case 'email':
      return validateEmail(value);
    case 'number':
      return validateNumber(value);
    case 'date':
      return validateDate(value);
    default:
      return null;
  }
}

function validateDropdown(value: string, field: SchemaField): string | null {
  if (!field.options || field.options.length === 0) {
    return null; // No options defined, accept any value
  }

  // Case-insensitive comparison
  const normalizedValue = value.toLowerCase().trim();
  const validOption = field.options.find((opt) => opt.toLowerCase().trim() === normalizedValue);

  if (!validOption) {
    return `Invalid value for ${field.label}. Valid options: ${field.options.join(', ')}`;
  }

  return null;
}

function validateUrl(value: string): string | null {
  // Add protocol if missing for validation
  let urlToTest = value;
  if (!urlToTest.match(/^https?:\/\//i)) {
    urlToTest = 'https://' + urlToTest;
  }

  try {
    new URL(urlToTest);
    return null;
  } catch {
    return 'Invalid URL format';
  }
}

function validateEmail(value: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Invalid email format';
  }
  return null;
}

function validateNumber(value: string): string | null {
  if (isNaN(Number(value))) {
    return 'Must be a number';
  }
  return null;
}

function validateDate(value: string): string | null {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return 'Invalid date format';
  }
  return null;
}

export function normalizeDropdownValue(value: string, field: SchemaField): string {
  if (field.type !== 'dropdown' || !field.options) {
    return value;
  }

  // Find the matching option with correct casing
  const normalizedValue = value.toLowerCase().trim();
  const matchingOption = field.options.find((opt) => opt.toLowerCase().trim() === normalizedValue);

  return matchingOption || value;
}

export function normalizeCompanyData(
  data: Record<string, string>,
  schema: Schema
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    const field = schema.fields.find((f) => f.name === key);
    if (field && field.type === 'dropdown') {
      normalized[key] = normalizeDropdownValue(value, field);
    } else {
      normalized[key] = value?.trim() || '';
    }
  }

  return normalized;
}
