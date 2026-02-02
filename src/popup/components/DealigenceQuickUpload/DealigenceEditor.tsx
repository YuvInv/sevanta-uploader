/**
 * Editor component for modifying extracted data before upload
 */

import { useState, useCallback } from 'react';
import type { DealigenceCompanyData } from '../../../lib/dealigence/types';

interface DealigenceEditorProps {
  data: DealigenceCompanyData;
  crmData: Record<string, string>;
  includeFounder: boolean;
  onSave: (data: Record<string, string>, includeFounder: boolean) => void;
  onCancel: () => void;
}

export function DealigenceEditor({
  data,
  crmData,
  includeFounder: initialIncludeFounder,
  onSave,
  onCancel,
}: DealigenceEditorProps) {
  const [editedData, setEditedData] = useState<Record<string, string>>(() => ({
    CompanyName: crmData.CompanyName || data.companyName,
    DescriptionShort: crmData.DescriptionShort || data.description || '',
    URL: crmData.URL || data.website || '',
    Source: crmData.Source || `Dealigence: ${data.sourceUrl}`,
  }));
  const [includeFounder, setIncludeFounder] = useState(initialIncludeFounder);

  const handleChange = useCallback((field: string, value: string) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(editedData, includeFounder);
  }, [editedData, includeFounder, onSave]);

  const firstFounder = data.founders[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-warm-800">Edit Before Upload</h2>
        <button onClick={onCancel} className="text-warm-500 hover:text-warm-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="bg-white border border-warm-200 rounded-xl p-5 space-y-4">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Company Name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={editedData.CompanyName}
            onChange={(e) => handleChange('CompanyName', e.target.value)}
            className="w-full px-4 py-2.5 border border-warm-300 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors text-base"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Description</label>
          <textarea
            value={editedData.DescriptionShort}
            onChange={(e) => handleChange('DescriptionShort', e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 border border-warm-300 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors text-base resize-none"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Website</label>
          <input
            type="url"
            value={editedData.URL}
            onChange={(e) => handleChange('URL', e.target.value)}
            className="w-full px-4 py-2.5 border border-warm-300 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors text-base"
          />
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Source Notes</label>
          <input
            type="text"
            value={editedData.Source}
            onChange={(e) => handleChange('Source', e.target.value)}
            className="w-full px-4 py-2.5 border border-warm-300 rounded-xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors text-base"
          />
        </div>

        {/* Founder toggle */}
        {firstFounder && (
          <div className="pt-2 border-t border-warm-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFounder}
                onChange={(e) => setIncludeFounder(e.target.checked)}
                className="w-5 h-5 rounded border-warm-300 text-accent-500 focus:ring-accent-500/20"
              />
              <span className="text-warm-700">
                Create founder contact: <span className="font-medium">{firstFounder.name}</span>
                {firstFounder.title && (
                  <span className="text-warm-500"> ({firstFounder.title})</span>
                )}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-warm-300 text-warm-700 rounded-xl font-medium hover:bg-warm-100 transition-colors text-base"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!editedData.CompanyName.trim()}
          className="flex-1 px-4 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}
