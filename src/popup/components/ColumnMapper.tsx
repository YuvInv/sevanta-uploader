import type { SchemaField, ColumnMapping, ContactColumnMapping } from '../../lib/types';
import { isContactColumn } from '../../lib/csv';

interface ColumnMapperProps {
  csvHeaders: string[];
  schemaFields: SchemaField[];
  mappings: ColumnMapping[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
  onConfirm: () => void;
  onBack: () => void;
  // Contact mapping props (optional)
  contactSchemaFields?: SchemaField[];
  contactMappings?: ContactColumnMapping[];
  onContactMappingChange?: (mappings: ContactColumnMapping[]) => void;
}

type MappingType = 'deal' | 'contact' | 'skip';

interface UnifiedMapping {
  csvColumn: string;
  type: MappingType;
  field: string | null; // deal field name or contact field name
}

export function ColumnMapper({
  csvHeaders,
  schemaFields,
  mappings,
  onMappingChange,
  onConfirm,
  onBack,
  contactSchemaFields,
  contactMappings,
  onContactMappingChange,
}: ColumnMapperProps) {
  const hasContactFields = contactSchemaFields && contactSchemaFields.length > 0;

  // Build unified mapping view from deal mappings and contact mappings
  const unifiedMappings: UnifiedMapping[] = csvHeaders.map((csvColumn) => {
    // Check if it's in contact mappings (even with null field - indicates user selected contact type)
    const contactMapping = contactMappings?.find((m) => m.csvColumn === csvColumn);
    if (contactMapping) {
      return {
        csvColumn,
        type: 'contact' as MappingType,
        field: contactMapping.contactField,
      };
    }

    // Check deal mapping
    const dealMapping = mappings.find((m) => m.csvColumn === csvColumn);
    if (dealMapping?.crmField) {
      // Has a deal field mapped
      return {
        csvColumn,
        type: 'deal' as MappingType,
        field: dealMapping.crmField,
      };
    }

    // Column exists in mappings but has no field - check if it looks like a contact column
    // This is only for initial auto-detection, not for persisting user's choice
    if (dealMapping && !dealMapping.crmField) {
      // If it looks like a contact column and user hasn't explicitly changed it, suggest contact
      const looksLikeContact = isContactColumn(csvColumn);
      if (looksLikeContact && hasContactFields) {
        return {
          csvColumn,
          type: 'contact' as MappingType,
          field: null,
        };
      }
      // Otherwise it's a deal column waiting for field selection, or skip
      return {
        csvColumn,
        type: 'deal' as MappingType,
        field: null,
      };
    }

    // Fallback - shouldn't normally reach here
    return {
      csvColumn,
      type: 'skip' as MappingType,
      field: null,
    };
  });

  const handleTypeChange = (csvColumn: string, newType: MappingType) => {
    if (newType === 'contact') {
      // Add to contact mappings (this tracks that user selected contact type)
      if (onContactMappingChange && contactMappings) {
        const existing = contactMappings.find((m) => m.csvColumn === csvColumn);
        if (!existing) {
          onContactMappingChange([...contactMappings, { csvColumn, contactField: null }]);
        }
      }
      // Clear deal field mapping
      onMappingChange(
        mappings.map((m) => (m.csvColumn === csvColumn ? { ...m, crmField: null } : m))
      );
    } else if (newType === 'deal') {
      // Remove from contact mappings
      if (onContactMappingChange && contactMappings) {
        onContactMappingChange(contactMappings.filter((m) => m.csvColumn !== csvColumn));
      }
      // Keep in deal mappings with null field (user will select the field)
      // No change needed to mappings - just ensure it exists
      if (!mappings.find((m) => m.csvColumn === csvColumn)) {
        onMappingChange([...mappings, { csvColumn, crmField: null }]);
      }
    } else {
      // Skip - remove from contact mappings, clear deal field
      if (onContactMappingChange && contactMappings) {
        onContactMappingChange(contactMappings.filter((m) => m.csvColumn !== csvColumn));
      }
      onMappingChange(
        mappings.map((m) => (m.csvColumn === csvColumn ? { ...m, crmField: null } : m))
      );
    }
  };

  const handleFieldChange = (csvColumn: string, type: MappingType, field: string | null) => {
    if (type === 'deal') {
      onMappingChange(
        mappings.map((m) => (m.csvColumn === csvColumn ? { ...m, crmField: field } : m))
      );
      // Clear from contact mappings
      if (onContactMappingChange && contactMappings) {
        onContactMappingChange(contactMappings.filter((m) => m.csvColumn !== csvColumn));
      }
    } else if (type === 'contact' && onContactMappingChange && contactMappings) {
      // Update or add contact mapping
      const existingIndex = contactMappings.findIndex((m) => m.csvColumn === csvColumn);
      if (existingIndex >= 0) {
        onContactMappingChange(
          contactMappings.map((m, i) => (i === existingIndex ? { ...m, contactField: field } : m))
        );
      } else if (field) {
        onContactMappingChange([...contactMappings, { csvColumn, contactField: field }]);
      }
      // Clear deal mapping
      onMappingChange(
        mappings.map((m) => (m.csvColumn === csvColumn ? { ...m, crmField: null } : m))
      );
    }
  };

  const missingRequiredFields = schemaFields
    .filter((f) => f.required)
    .filter((f) => !mappings.some((m) => m.crmField === f.name));

  const canConfirm = missingRequiredFields.length === 0;

  // Count mappings by type
  const dealMappedCount = unifiedMappings.filter((m) => m.type === 'deal' && m.field).length;
  const contactMappedCount = unifiedMappings.filter((m) => m.type === 'contact' && m.field).length;
  const skippedCount = unifiedMappings.filter((m) => m.type === 'skip' || !m.field).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-warm-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-warm-800">Map Columns</h2>
            <p className="text-sm text-warm-500 mt-0.5">Match your CSV columns to CRM fields</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-accent-100 rounded-full text-sm text-accent-700 font-medium">
              {dealMappedCount} deals
            </span>
            {hasContactFields && (
              <span className="px-3 py-1.5 bg-accent-100 rounded-full text-sm text-accent-700 font-medium">
                {contactMappedCount} contacts
              </span>
            )}
            <span className="px-3 py-1.5 bg-warm-100 rounded-full text-sm text-warm-600 font-medium">
              {skippedCount} skipped
            </span>
          </div>
        </div>
      </div>

      {missingRequiredFields.length > 0 && (
        <div className="bg-caution-50 border border-caution-200 rounded-xl p-4 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-caution-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="font-medium text-caution-800 text-sm">Missing required fields:</p>
            <ul className="mt-1 text-sm text-caution-700">
              {missingRequiredFields.map((f) => (
                <li key={f.name}>{f.label}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Help text */}
      {hasContactFields && (
        <div className="bg-accent-50 border border-accent-200 rounded-xl p-4">
          <p className="text-sm text-accent-700">
            <strong>Tip:</strong> For each column, choose whether it&apos;s a{' '}
            <span className="font-semibold text-accent-800">Deal</span> field, a{' '}
            <span className="font-semibold text-accent-800">Contact</span> field, or should be{' '}
            <span className="font-semibold text-warm-600">Skipped</span>. Contact fields will be
            created as contacts linked to each deal.
          </p>
        </div>
      )}

      {/* Unified mapping table */}
      <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-warm-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-warm-600">
                CSV Column
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-warm-600 w-32">
                Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-warm-600">
                CRM Field
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Deal Fields Section */}
            {unifiedMappings.some((m) => m.type === 'deal') && (
              <tr className="bg-warm-50">
                <td colSpan={3} className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-warm-700 uppercase tracking-wide">
                      Deal Fields
                    </span>
                  </div>
                </td>
              </tr>
            )}
            {unifiedMappings.filter((m) => m.type === 'deal').map((mapping) => {
              const currentDealField = schemaFields.find((f) => f.name === mapping.field);
              const isRequired = currentDealField?.required;

              return (
                <tr key={mapping.csvColumn} className="border-t border-warm-100 hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3">
                    <code className="bg-warm-100 px-2 py-1 rounded-lg text-sm font-mono text-warm-700">
                      {mapping.csvColumn}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={mapping.type}
                      onChange={(e) =>
                        handleTypeChange(mapping.csvColumn, e.target.value as MappingType)
                      }
                      className="w-full border rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-accent-50 text-accent-700 border-accent-200"
                    >
                      <option value="deal">🏢 Deal Field</option>
                      {hasContactFields && <option value="contact">👤 Contact Field</option>}
                      <option value="skip">⊘ Skip Column</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={mapping.field || ''}
                        onChange={(e) =>
                          handleFieldChange(mapping.csvColumn, 'deal', e.target.value || null)
                        }
                        className="w-full border border-warm-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      >
                        <option value="">-- Select field --</option>
                        {schemaFields.map((field) => {
                          const isAlreadyMapped = mappings.some(
                            (m) => m.crmField === field.name && m.csvColumn !== mapping.csvColumn
                          );
                          return (
                            <option
                              key={field.name}
                              value={field.name}
                              disabled={isAlreadyMapped}
                            >
                              {field.label}
                              {field.required ? ' *' : ''}
                              {isAlreadyMapped ? ' (already mapped)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {isRequired && (
                        <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded-full whitespace-nowrap font-medium">
                          Required
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Contact Fields Section */}
            {hasContactFields && unifiedMappings.some((m) => m.type === 'contact') && (
              <tr className="bg-accent-50">
                <td colSpan={3} className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-accent-700 uppercase tracking-wide">
                      Contact Fields
                    </span>
                  </div>
                </td>
              </tr>
            )}
            {hasContactFields && unifiedMappings.filter((m) => m.type === 'contact').map((mapping) => {
              return (
                <tr key={mapping.csvColumn} className="border-t border-accent-100 hover:bg-accent-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <code className="bg-accent-100 px-2 py-1 rounded-lg text-sm font-mono text-accent-800">
                      {mapping.csvColumn}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={mapping.type}
                      onChange={(e) =>
                        handleTypeChange(mapping.csvColumn, e.target.value as MappingType)
                      }
                      className="w-full border rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-accent-50 text-accent-700 border-accent-200"
                    >
                      <option value="deal">🏢 Deal Field</option>
                      {hasContactFields && <option value="contact">👤 Contact Field</option>}
                      <option value="skip">⊘ Skip Column</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={mapping.field || ''}
                        onChange={(e) =>
                          handleFieldChange(mapping.csvColumn, 'contact', e.target.value || null)
                        }
                        className="w-full border border-accent-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-accent-50"
                      >
                        <option value="">-- Select contact field --</option>
                        {contactSchemaFields?.map((field) => {
                          const isAlreadyMapped = contactMappings?.some(
                            (m) =>
                              m.contactField === field.name && m.csvColumn !== mapping.csvColumn
                          );
                          return (
                            <option
                              key={field.name}
                              value={field.name}
                              disabled={isAlreadyMapped}
                            >
                              {field.label}
                              {isAlreadyMapped ? ' (already mapped)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Skipped Fields Section */}
            {unifiedMappings.some((m) => m.type === 'skip') && (
              <tr className="bg-warm-50">
                <td colSpan={3} className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-warm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-warm-600 uppercase tracking-wide">
                      Skipped Columns
                    </span>
                  </div>
                </td>
              </tr>
            )}
            {unifiedMappings.filter((m) => m.type === 'skip').map((mapping) => {
              return (
                <tr key={mapping.csvColumn} className="border-t border-warm-100 hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3">
                    <code className="bg-warm-100 px-2 py-1 rounded-lg text-sm font-mono text-warm-500">
                      {mapping.csvColumn}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={mapping.type}
                      onChange={(e) =>
                        handleTypeChange(mapping.csvColumn, e.target.value as MappingType)
                      }
                      className="w-full border rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-warm-50 text-warm-600 border-warm-200"
                    >
                      <option value="deal">🏢 Deal Field</option>
                      {hasContactFields && <option value="contact">👤 Contact Field</option>}
                      <option value="skip">⊘ Skip Column</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-warm-400 italic">Column will be ignored</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-warm-600 hover:text-warm-800 hover:bg-warm-100 rounded-xl transition-colors text-sm font-medium"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="px-5 py-2.5 bg-accent-500 text-white rounded-xl hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}
