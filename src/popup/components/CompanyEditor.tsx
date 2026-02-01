import { useState } from 'react';
import type { Company, Schema, SchemaField, ContactData } from '../../lib/types';

// Contact fields that we show in the editor (basic fields for now)
const CONTACT_FIELDS = [
  { name: 'Name', label: 'Name', required: true },
  { name: 'Email', label: 'Email', type: 'email' },
  { name: 'MobilePhone', label: 'Phone' },
  { name: 'Title', label: 'Title' },
];

interface CompanyEditorProps {
  company: Company;
  schema: Schema;
  onEdit: (field: string, value: string) => void;
  onContactEdit?: (contactIndex: number, field: string, value: string) => void;
  onClose: () => void;
}

export function CompanyEditor({
  company,
  schema,
  onEdit,
  onContactEdit,
  onClose,
}: CompanyEditorProps) {
  const [contactsExpanded, setContactsExpanded] = useState(true);

  const renderField = (field: SchemaField) => {
    const value = company.data[field.name] || '';
    const hasError = company.validation.errors.some((e) => e.field === field.name);
    const hasWarning = company.validation.warnings.some((w) => w.field === field.name);

    const inputClass = `w-full border rounded px-2 py-1 text-sm ${
      hasError
        ? 'border-red-500 bg-red-50'
        : hasWarning
          ? 'border-yellow-500 bg-yellow-50'
          : 'border-gray-300'
    }`;

    const disabled = company.skipped || false;

    if (field.type === 'dropdown') {
      // Use optionlistFull if available (shows labels), otherwise use options array
      if (field.optionlistFull) {
        return (
          <select
            value={value}
            onChange={(e) => onEdit(field.name, e.target.value)}
            className={`${inputClass} ${disabled ? 'bg-gray-100 text-gray-400' : ''}`}
            disabled={disabled}
          >
            <option value="">-- Select --</option>
            {Object.entries(field.optionlistFull).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        );
      } else if (field.options) {
        return (
          <select
            value={value}
            onChange={(e) => onEdit(field.name, e.target.value)}
            className={`${inputClass} ${disabled ? 'bg-gray-100 text-gray-400' : ''}`}
            disabled={disabled}
          >
            <option value="">-- Select --</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }
    }

    return (
      <input
        type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
        value={value}
        onChange={(e) => onEdit(field.name, e.target.value)}
        className={`${inputClass} ${disabled ? 'bg-gray-100 text-gray-400' : ''}`}
        placeholder={field.label}
        disabled={disabled}
      />
    );
  };

  const renderContactField = (
    contact: ContactData,
    contactIndex: number,
    fieldDef: (typeof CONTACT_FIELDS)[0]
  ) => {
    const value = contact.data[fieldDef.name] || '';
    const disabled = company.skipped || false;
    const inputClass = `w-full border rounded px-2 py-1 text-sm border-gray-300 ${disabled ? 'bg-gray-100 text-gray-400' : ''}`;

    return (
      <input
        type={fieldDef.type === 'email' ? 'email' : 'text'}
        value={value}
        onChange={(e) => onContactEdit?.(contactIndex, fieldDef.name, e.target.value)}
        className={inputClass}
        placeholder={fieldDef.label}
        disabled={disabled || !onContactEdit}
      />
    );
  };

  return (
    <div className="bg-white border rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">Edit Company</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      </div>

      {company.skipped && (
        <div className="mb-3 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-xs text-gray-600">
          This company is discarded and will not be uploaded.
        </div>
      )}

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {schema.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Contacts Section */}
      {company.contacts && company.contacts.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={() => setContactsExpanded(!contactsExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-medium text-sm text-purple-700">
              Contacts ({company.contacts.length})
            </h4>
            <span className="text-gray-400 text-sm">{contactsExpanded ? '▼' : '▶'}</span>
          </button>

          {contactsExpanded && (
            <div className="mt-3 space-y-3">
              {company.contacts.map((contact, index) => (
                <div
                  key={index}
                  className="bg-purple-50 border border-purple-200 rounded p-3 space-y-2"
                >
                  <div className="text-xs font-medium text-purple-600 mb-2">
                    Contact {index + 1}
                    {contact.data.Name && `: ${contact.data.Name}`}
                  </div>
                  {CONTACT_FIELDS.map((fieldDef) => (
                    <div key={fieldDef.name}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {fieldDef.label}
                        {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderContactField(contact, index, fieldDef)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
