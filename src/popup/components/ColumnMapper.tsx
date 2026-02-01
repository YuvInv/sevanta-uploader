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
  const unifiedMappings: UnifiedMapping[] = csvHeaders.map(csvColumn => {
    // Check if it's in contact mappings (even with null field - indicates user selected contact type)
    const contactMapping = contactMappings?.find(m => m.csvColumn === csvColumn);
    if (contactMapping) {
      return {
        csvColumn,
        type: 'contact' as MappingType,
        field: contactMapping.contactField,
      };
    }

    // Check deal mapping
    const dealMapping = mappings.find(m => m.csvColumn === csvColumn);
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
        const existing = contactMappings.find(m => m.csvColumn === csvColumn);
        if (!existing) {
          onContactMappingChange([...contactMappings, { csvColumn, contactField: null }]);
        }
      }
      // Clear deal field mapping
      onMappingChange(
        mappings.map(m => m.csvColumn === csvColumn ? { ...m, crmField: null } : m)
      );
    } else if (newType === 'deal') {
      // Remove from contact mappings
      if (onContactMappingChange && contactMappings) {
        onContactMappingChange(contactMappings.filter(m => m.csvColumn !== csvColumn));
      }
      // Keep in deal mappings with null field (user will select the field)
      // No change needed to mappings - just ensure it exists
      if (!mappings.find(m => m.csvColumn === csvColumn)) {
        onMappingChange([...mappings, { csvColumn, crmField: null }]);
      }
    } else {
      // Skip - remove from contact mappings, clear deal field
      if (onContactMappingChange && contactMappings) {
        onContactMappingChange(contactMappings.filter(m => m.csvColumn !== csvColumn));
      }
      onMappingChange(
        mappings.map(m => m.csvColumn === csvColumn ? { ...m, crmField: null } : m)
      );
    }
  };

  const handleFieldChange = (csvColumn: string, type: MappingType, field: string | null) => {
    if (type === 'deal') {
      onMappingChange(
        mappings.map(m => m.csvColumn === csvColumn ? { ...m, crmField: field } : m)
      );
      // Clear from contact mappings
      if (onContactMappingChange && contactMappings) {
        onContactMappingChange(contactMappings.filter(m => m.csvColumn !== csvColumn));
      }
    } else if (type === 'contact' && onContactMappingChange && contactMappings) {
      // Update or add contact mapping
      const existingIndex = contactMappings.findIndex(m => m.csvColumn === csvColumn);
      if (existingIndex >= 0) {
        onContactMappingChange(
          contactMappings.map((m, i) => i === existingIndex ? { ...m, contactField: field } : m)
        );
      } else if (field) {
        onContactMappingChange([...contactMappings, { csvColumn, contactField: field }]);
      }
      // Clear deal mapping
      onMappingChange(
        mappings.map(m => m.csvColumn === csvColumn ? { ...m, crmField: null } : m)
      );
    }
  };

  const missingRequiredFields = schemaFields
    .filter(f => f.required)
    .filter(f => !mappings.some(m => m.crmField === f.name));

  const canConfirm = missingRequiredFields.length === 0;

  // Count mappings by type
  const dealMappedCount = unifiedMappings.filter(m => m.type === 'deal' && m.field).length;
  const contactMappedCount = unifiedMappings.filter(m => m.type === 'contact' && m.field).length;
  const skippedCount = unifiedMappings.filter(m => m.type === 'skip' || !m.field).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Map Columns</h2>
            <p className="text-sm text-gray-500 mt-0.5">Match your CSV columns to CRM fields</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-blue-100 rounded-full text-sm text-blue-700">
              {dealMappedCount} deals
            </span>
            {hasContactFields && (
              <span className="px-3 py-1.5 bg-purple-100 rounded-full text-sm text-purple-700">
                {contactMappedCount} contacts
              </span>
            )}
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600">
              {skippedCount} skipped
            </span>
          </div>
        </div>
      </div>

      {missingRequiredFields.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-yellow-800 text-sm">Missing required fields:</p>
            <ul className="mt-1 text-sm text-yellow-700">
              {missingRequiredFields.map(f => (
                <li key={f.name}>{f.label}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Help text */}
      {hasContactFields && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> For each column, choose whether it&apos;s a <span className="font-semibold text-blue-800">Deal</span> field, a <span className="font-semibold text-purple-800">Contact</span> field, or should be <span className="font-semibold text-gray-600">Skipped</span>. Contact fields will be created as contacts linked to each deal.
          </p>
        </div>
      )}

      {/* Unified mapping table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">CSV Column</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wider w-32">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs uppercase tracking-wider">CRM Field</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {unifiedMappings.map(mapping => {
              const currentDealField = schemaFields.find(f => f.name === mapping.field);
              const isRequired = mapping.type === 'deal' && currentDealField?.required;

              return (
                <tr key={mapping.csvColumn} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-700">{mapping.csvColumn}</code>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={mapping.type}
                      onChange={e => handleTypeChange(mapping.csvColumn, e.target.value as MappingType)}
                      className={`w-full border rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${mapping.type === 'deal'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : mapping.type === 'contact'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                    >
                      <option value="deal">Deal</option>
                      {hasContactFields && <option value="contact">Contact</option>}
                      <option value="skip">Skip</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {mapping.type === 'skip' ? (
                      <span className="text-gray-400 italic">Column will be ignored</span>
                    ) : mapping.type === 'deal' ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={mapping.field || ''}
                          onChange={e => handleFieldChange(mapping.csvColumn, 'deal', e.target.value || null)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">-- Select field --</option>
                          {schemaFields.map(field => {
                            const isAlreadyMapped = mappings.some(
                              m => m.crmField === field.name && m.csvColumn !== mapping.csvColumn
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
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">Required</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={mapping.field || ''}
                          onChange={e => handleFieldChange(mapping.csvColumn, 'contact', e.target.value || null)}
                          className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50"
                        >
                          <option value="">-- Select contact field --</option>
                          {contactSchemaFields?.map(field => {
                            const isAlreadyMapped = contactMappings?.some(
                              m => m.contactField === field.name && m.csvColumn !== mapping.csvColumn
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
                    )}
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
          className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}
