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

    const inputClass = `w-full border-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
      error
        ? 'border-danger-500 bg-danger-50 focus:ring-danger-500/20'
        : warning
          ? 'border-caution-500 bg-caution-50 focus:ring-caution-500/20'
          : 'border-warm-200 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10'
    } ${disabled ? 'bg-warm-100 text-warm-400' : 'bg-white'}`;

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
        <label className="block text-sm font-medium text-warm-700">
          {field.label}
          {field.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
        {input}
        {error && <p className="text-xs text-danger-600">{error.message}</p>}
        {warning && !error && <p className="text-xs text-caution-600">{warning.message}</p>}
      </div>
    );
  };

  const renderFieldGroup = (title: string, fields: SchemaField[]) => {
    if (fields.length === 0) return null;

    return (
      <div className="bg-warm-50 rounded-xl p-4 space-y-4">
        <h4 className="font-semibold text-warm-800 text-sm border-b border-warm-200 pb-2">
          {title}
        </h4>
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
    const inputClass = `w-full border-2 rounded-xl px-3 py-2 text-sm border-warm-200 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all duration-200 ${disabled ? 'bg-warm-100 text-warm-400' : 'bg-white'}`;

    return (
      <div key={fieldDef.name} className="space-y-1">
        <label className="block text-sm font-medium text-warm-600">
          {fieldDef.label}
          {fieldDef.required && <span className="text-danger-500 ml-1">*</span>}
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
    <div className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-800 truncate">
            Edit: {company.data.CompanyName || 'New Company'}
          </h2>
          <button
            onClick={onClose}
            className="text-warm-400 hover:text-warm-600 p-1 transition-colors"
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
        <div className="flex gap-1 p-1 mx-6 mt-4 bg-warm-100 rounded-xl">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'company'
                ? 'bg-white text-warm-800 shadow-sm'
                : 'text-warm-500 hover:text-warm-700'
            }`}
          >
            Company Details
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'contacts'
                ? 'bg-white text-warm-800 shadow-sm'
                : 'text-warm-500 hover:text-warm-700'
            }`}
          >
            Contacts ({editedContacts.length})
          </button>
        </div>

        {/* Discarded notice */}
        {company.skipped && (
          <div className="mx-6 mt-4 px-4 py-3 bg-warm-100 border border-warm-300 rounded-xl text-sm text-warm-600">
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
                <div className="text-center py-8 text-warm-500">
                  <p>No contacts associated with this company.</p>
                </div>
              ) : (
                editedContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="bg-accent-50 border border-accent-200 rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-accent-700">
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-warm-200 bg-warm-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-warm-700 bg-white border border-warm-200 rounded-xl hover:bg-warm-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-5 py-2.5 text-sm font-medium text-white bg-accent-500 rounded-xl hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
