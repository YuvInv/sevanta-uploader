import { useState, useMemo } from 'react';
import type { Company, Schema, SchemaField, ContactData } from '../../lib/types';

// Contact fields that we show in the editor
const CONTACT_FIELDS = [
  { name: 'Name', label: 'Name', required: true },
  { name: 'Email', label: 'Email', type: 'email' },
  { name: 'MobilePhone', label: 'Phone' },
  { name: 'Title', label: 'Title' },
];

// Field groupings for the company editor
const FIELD_GROUPS = {
  basic: ['CompanyName', 'Website', 'Description'],
  classification: ['SectorID', 'Sector', 'StageID', 'Stage'],
  source: ['SourceTypeID', 'SourceNotes', 'PastInvestments'],
};

interface CompanyEditorModalProps {
  company: Company;
  schema: Schema;
  onSave: (companyId: string, data: Record<string, string>, contacts: ContactData[]) => void;
  onClose: () => void;
}

export function CompanyEditorModal({ company, schema, onSave, onClose }: CompanyEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'company' | 'contacts'>('company');
  const [editedData, setEditedData] = useState<Record<string, string>>({ ...company.data });
  const [editedContacts, setEditedContacts] = useState<ContactData[]>(
    company.contacts?.map((c) => ({ ...c, data: { ...c.data } })) || []
  );

  // Track changes using useMemo to avoid calling setState in useEffect
  const hasChanges = useMemo(() => {
    const dataChanged = JSON.stringify(editedData) !== JSON.stringify(company.data);
    const contactsChanged =
      JSON.stringify(editedContacts.map((c) => c.data)) !==
      JSON.stringify(company.contacts?.map((c) => c.data) || []);
    return dataChanged || contactsChanged;
  }, [editedData, editedContacts, company.data, company.contacts]);

  // Categorize fields
  const categorizeFields = () => {
    const basic: SchemaField[] = [];
    const classification: SchemaField[] = [];
    const source: SchemaField[] = [];
    const other: SchemaField[] = [];

    for (const field of schema.fields) {
      if (FIELD_GROUPS.basic.includes(field.name)) {
        basic.push(field);
      } else if (FIELD_GROUPS.classification.includes(field.name)) {
        classification.push(field);
      } else if (FIELD_GROUPS.source.includes(field.name)) {
        source.push(field);
      } else {
        other.push(field);
      }
    }

    // Sort within groups to match the order in FIELD_GROUPS
    const sortByOrder = (fields: SchemaField[], order: string[]) =>
      fields.sort((a, b) => {
        const aIndex = order.indexOf(a.name);
        const bIndex = order.indexOf(b.name);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

    sortByOrder(basic, FIELD_GROUPS.basic);
    sortByOrder(classification, FIELD_GROUPS.classification);
    sortByOrder(source, FIELD_GROUPS.source);

    return { basic, classification, source, other };
  };

  const { basic, classification, source, other } = categorizeFields();

  const handleFieldChange = (fieldName: string, value: string) => {
    setEditedData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleContactChange = (contactIndex: number, fieldName: string, value: string) => {
    setEditedContacts((prev) => {
      const updated = [...prev];
      updated[contactIndex] = {
        ...updated[contactIndex],
        data: { ...updated[contactIndex].data, [fieldName]: value },
      };
      return updated;
    });
  };

  const handleSave = () => {
    onSave(company.id, editedData, editedContacts);
    onClose();
  };

  const getFieldError = (fieldName: string) => {
    return company.validation.errors.find((e) => e.field === fieldName);
  };

  const getFieldWarning = (fieldName: string) => {
    return company.validation.warnings.find((w) => w.field === fieldName);
  };

  const renderField = (field: SchemaField) => {
    const value = editedData[field.name] || '';
    const error = getFieldError(field.name);
    const warning = getFieldWarning(field.name);
    const disabled = company.skipped || false;

    const inputClass = `w-full border rounded px-3 py-2 text-sm ${
      error
        ? 'border-red-500 bg-red-50'
        : warning
          ? 'border-yellow-500 bg-yellow-50'
          : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
    } ${disabled ? 'bg-gray-100 text-gray-400' : ''}`;

    let input;
    if (field.type === 'dropdown') {
      if (field.optionlistFull) {
        input = (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={inputClass}
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
        input = (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={inputClass}
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
    } else if (field.name === 'Description' || field.name.toLowerCase().includes('notes')) {
      input = (
        <textarea
          value={value}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder={field.label}
          disabled={disabled}
        />
      );
    } else {
      input = (
        <input
          type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
          value={value}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          className={inputClass}
          placeholder={field.label}
          disabled={disabled}
        />
      );
    }

    return (
      <div key={field.name} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {input}
        {error && <p className="text-xs text-red-600">{error.message}</p>}
        {warning && !error && <p className="text-xs text-yellow-600">{warning.message}</p>}
      </div>
    );
  };

  const renderFieldGroup = (title: string, fields: SchemaField[]) => {
    if (fields.length === 0) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900 text-sm border-b border-gray-200 pb-2">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => renderField(field))}
        </div>
      </div>
    );
  };

  const renderContactField = (
    contact: ContactData,
    contactIndex: number,
    fieldDef: (typeof CONTACT_FIELDS)[0]
  ) => {
    const value = contact.data[fieldDef.name] || '';
    const disabled = company.skipped || false;
    const inputClass = `w-full border rounded px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${disabled ? 'bg-gray-100 text-gray-400' : ''}`;

    return (
      <div key={fieldDef.name} className="space-y-1">
        <label className="block text-sm font-medium text-gray-600">
          {fieldDef.label}
          {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={fieldDef.type === 'email' ? 'email' : 'text'}
          value={value}
          onChange={(e) => handleContactChange(contactIndex, fieldDef.name, e.target.value)}
          className={inputClass}
          placeholder={fieldDef.label}
          disabled={disabled}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            Edit: {company.data.CompanyName || 'New Company'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'company'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Company Details
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'contacts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Contacts ({editedContacts.length})
          </button>
        </div>

        {/* Discarded notice */}
        {company.skipped && (
          <div className="mx-6 mt-4 px-4 py-3 bg-gray-100 border border-gray-300 rounded text-sm text-gray-600">
            This company is discarded and will not be uploaded.
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'company' && (
            <div className="space-y-6">
              {renderFieldGroup('Basic Information', basic)}
              {renderFieldGroup('Classification', classification)}
              {renderFieldGroup('Source', source)}
              {other.length > 0 && renderFieldGroup('Other Fields', other)}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {editedContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No contacts associated with this company.</p>
                </div>
              ) : (
                editedContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-purple-700">
                        Contact {index + 1}
                        {contact.data.Name && `: ${contact.data.Name}`}
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {CONTACT_FIELDS.map((fieldDef) =>
                        renderContactField(contact, index, fieldDef)
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
