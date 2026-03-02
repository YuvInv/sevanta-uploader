/**
 * Utilities for extracting typed options from CRM schemas.
 */

import type { Schema, ContactSchema } from './types';

export interface IndustryOption {
  value: string;
  label: string;
}

/**
 * Extract options from any dropdown field in the schema by field name.
 */
export function getDropdownOptions(
  schema: Schema | null,
  fieldName: string
): IndustryOption[] {
  if (!schema) return [];
  const field = schema.fields.find((f) => f.name === fieldName);
  if (!field?.optionlistFull) return [];
  return [
    { value: '', label: 'None' },
    ...Object.entries(field.optionlistFull).map(([value, label]) => ({ value, label })),
  ];
}

/**
 * Extract industry options from the deal schema's IndustryID field.
 * Returns [{value:'', label:'None'}, ...] for use in dropdowns.
 */
export function getIndustryOptions(schema: Schema | null): IndustryOption[] {
  return getDropdownOptions(schema, 'IndustryID');
}

/**
 * Find the fundraising amount field in the schema by label (e.g. "Fundraising ($M)").
 * Returns just the CRM dbname since it's a numeric field, not a dropdown.
 */
export function findFundraisingField(schema: Schema | null): string | null {
  if (!schema) return null;
  const field = schema.fields.find((f) => f.label.toLowerCase().includes('fundrais'));
  return field?.name ?? null;
}

/**
 * Find the recommendation/grade field in the schema by name or label.
 * Returns the CRM field name and its dropdown options, or null if not found.
 */
export function findRecommendationField(
  schema: Schema | null
): { name: string; options: IndustryOption[] } | null {
  if (!schema) return null;
  const field = schema.fields.find((f) => {
    const name = f.name.toLowerCase();
    const label = f.label.toLowerCase();
    return (
      name.includes('grade') ||
      name.includes('recommend') ||
      label.includes('grade') ||
      label.includes('recommend')
    );
  });
  if (!field?.optionlistFull) return null;
  return {
    name: field.name,
    options: [
      { value: '', label: 'None' },
      ...Object.entries(field.optionlistFull).map(([value, label]) => ({ value, label })),
    ],
  };
}

/**
 * Get a label map from a schema dropdown field (e.g. IndustryID, LifeStageID).
 */
export function getFieldLabels(
  schema: Schema | null,
  fieldName: string
): Record<string, string> | undefined {
  if (!schema) return undefined;
  const field = schema.fields.find((f) => f.name === fieldName);
  return field?.optionlistFull;
}

/**
 * Look up the ContactTypeID for board members from the contact schema.
 * Searches for codes/labels containing "board". Falls back to 'MGT'.
 */
export function findBoardMemberTypeId(contactSchema: ContactSchema | null): string {
  if (!contactSchema) return 'MGT';
  const field = contactSchema.fields.find((f) => f.name === 'ContactTypeID');
  if (!field?.optionlistFull) return 'MGT';

  for (const [code, label] of Object.entries(field.optionlistFull)) {
    const lower = label.toLowerCase();
    if (lower.includes('board') || lower.includes('director')) {
      return code;
    }
  }
  return 'MGT';
}
