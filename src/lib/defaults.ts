/**
 * Default field values for automatic population during upload
 */

export type UploadSource = 'csv' | 'dealigence' | 'ivc';

const SOURCE_LABELS: Record<UploadSource, string> = {
  csv: 'Sevanta Uploader',
  dealigence: 'Dealigence',
  ivc: 'IVC',
};

/**
 * Default values for deal fields (using API values/codes)
 * - SourceTypeID: Research (RES)
 * - FundID: INV
 * - StageID: Screening (0)
 * - StatusID: Active (1)
 */
export const DEAL_DEFAULTS: Record<string, string> = {
  SourceTypeID: 'RES',
  FundID: 'INV',
  StageID: '0',
  StatusID: '1',
};

/**
 * Default values for contact fields
 * - ContactTypeID: Management (MGT)
 */
export const CONTACT_DEFAULTS: Record<string, string> = {
  ContactTypeID: 'MGT',
};

/**
 * Apply default values to deal data
 * Only fills missing fields - doesn't overwrite existing CSV values
 */
export function applyDealDefaults(
  data: Record<string, string>,
  source: UploadSource = 'csv'
): Record<string, string> {
  const result = { ...data };

  // Apply Source field with source-specific message
  if (!result.Source) {
    result.Source = `Uploaded via ${SOURCE_LABELS[source]}`;
  }

  // Apply other defaults only if not set
  for (const [key, value] of Object.entries(DEAL_DEFAULTS)) {
    if (!result[key]) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Apply default values to contact data
 * Only fills missing fields - doesn't overwrite existing CSV values
 */
export function applyContactDefaults(data: Record<string, string>): Record<string, string> {
  const result = { ...data };

  for (const [key, value] of Object.entries(CONTACT_DEFAULTS)) {
    if (!result[key]) {
      result[key] = value;
    }
  }

  return result;
}
