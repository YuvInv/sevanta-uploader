/**
 * Preview card for a new company from Timeless memo.
 * Shows extracted fields mapped to CRM — all editable before upload.
 */

import { useState, useCallback } from 'react';
import type { TimelessMemoData, TimelessFounder } from '../../../lib/timeless/types';
import {
  parseFundingFromMemo,
  mapMarketToIndustry,
} from '../../../lib/timeless/transformers';
import { parseFundingAmount } from '../../../lib/dealigence/transformers';

interface TimelessPreviewProps {
  data: TimelessMemoData;
  onUpload: (editedData: TimelessMemoData, overrides?: { industryId?: string }) => void;
  isUploading?: boolean;
}

const INDUSTRY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'Health', label: 'Healthcare' },
  { value: 'HCD', label: 'Health Diagnostics' },
  { value: 'Assi', label: 'Medical Devices' },
  { value: 'IT', label: 'IT/Software' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'IND4', label: 'Industry 4.0' },
  { value: 'IOT', label: 'IoT/Hardware' },
  { value: 'Cyber', label: 'Cybersecurity' },
  { value: 'AgFo', label: 'AgTech/FoodTech' },
  { value: 'Clean', label: 'CleanTech' },
];

function FounderBadge({
  founder,
  onRemove,
}: {
  founder: TimelessFounder;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-warm-50 rounded-lg px-3 py-2 group">
      <div className="w-7 h-7 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-accent-700 font-medium text-xs">
          {founder.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
      </div>
      <div className="text-left min-w-0">
        <p className="font-medium text-warm-800 text-sm truncate">{founder.name}</p>
        {founder.title && <p className="text-xs text-warm-500 truncate">{founder.title}</p>}
      </div>
      <button
        onClick={onRemove}
        className="ml-auto opacity-0 group-hover:opacity-100 text-warm-400 hover:text-danger-500 transition-opacity flex-shrink-0"
        title="Remove contact"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-baseline gap-2 py-1.5">
      <span className="text-sm text-warm-500 flex-shrink-0 w-28">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm text-warm-800 text-right bg-transparent border-b border-transparent hover:border-warm-300 focus:border-accent-500 focus:outline-none transition-colors py-0.5 min-w-0"
      />
    </div>
  );
}

function EditableSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-baseline gap-2 py-1.5">
      <span className="text-sm text-warm-500 flex-shrink-0 w-28">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm text-warm-800 text-right bg-transparent border-b border-transparent hover:border-warm-300 focus:border-accent-500 focus:outline-none transition-colors py-0.5 min-w-0 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TimelessPreview({ data, onUpload, isUploading }: TimelessPreviewProps) {
  const [showMemo, setShowMemo] = useState(false);

  // Derive initial CRM field values from extracted data
  const rawAmount = parseFundingFromMemo(data.fundingHistory);
  const initialFunding = parseFundingAmount(rawAmount);
  const initialIndustry = mapMarketToIndustry(data.market) || '';

  // Editable state
  const [companyName, setCompanyName] = useState(data.companyName);
  const [solution, setSolution] = useState(data.solution || '');
  const [funding, setFunding] = useState(
    initialFunding !== undefined ? initialFunding.toString() : ''
  );
  const [industryId, setIndustryId] = useState(initialIndustry);
  const [location, setLocation] = useState(data.location || '');
  const [founded, setFounded] = useState(data.founded || '');
  const [founders, setFounders] = useState<TimelessFounder[]>([...data.founders]);

  const handleRemoveFounder = useCallback((index: number) => {
    setFounders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(() => {
    const editedData: TimelessMemoData = {
      ...data,
      companyName,
      solution,
      location,
      founded,
      founders,
      fundingHistory: funding ? `Raised $${funding}M` : data.fundingHistory,
    };
    onUpload(editedData, industryId ? { industryId } : undefined);
  }, [data, companyName, solution, funding, industryId, location, founded, founders, onUpload]);

  return (
    <div className="space-y-4">
      {/* Main card */}
      <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-50 to-warm-50 px-5 py-4 border-b border-warm-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-xs font-medium rounded-full">
              New Company
            </span>
          </div>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full text-xl font-semibold text-warm-800 mt-1 bg-transparent border-b border-transparent hover:border-warm-300 focus:border-accent-500 focus:outline-none transition-colors"
          />
          {data.market && (
            <p className="text-sm text-warm-500 mt-0.5">{data.market}</p>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Description */}
          <div>
            <p className="text-sm font-medium text-warm-500 mb-1">Solution</p>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={3}
              className="w-full text-warm-700 text-sm leading-relaxed bg-transparent border border-transparent rounded-lg hover:border-warm-300 focus:border-accent-500 focus:outline-none transition-colors resize-y p-1"
            />
          </div>

          {/* CRM Fields */}
          <div className="bg-warm-50 rounded-xl p-4">
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-2">
              CRM Fields
            </p>
            <div className="divide-y divide-warm-200">
              <EditableField
                label="Past Investment"
                value={funding}
                onChange={setFunding}
                placeholder="e.g. 1.5 ($M)"
              />
              <EditableSelect
                label="Industry"
                value={industryId}
                onChange={setIndustryId}
                options={INDUSTRY_OPTIONS}
              />
              <EditableField
                label="Location"
                value={location}
                onChange={setLocation}
                placeholder="e.g. Tel Aviv, Israel"
              />
              <EditableField
                label="Founded"
                value={founded}
                onChange={setFounded}
                placeholder="e.g. 2022"
              />
            </div>
          </div>

          {/* Full memo (collapsible) */}
          <div>
            <button
              onClick={() => setShowMemo(!showMemo)}
              className="flex items-center gap-2 text-sm text-warm-500 hover:text-warm-700 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showMemo ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Full Memo (will be added as comment)
            </button>
            {showMemo && (
              <div className="mt-2 p-3 bg-warm-50 rounded-lg text-xs text-warm-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {data.fullMemoText}
              </div>
            )}
          </div>

          {/* Contacts Section */}
          {founders.length > 0 && (
            <div className="pt-3 border-t border-warm-200">
              <p className="text-sm font-medium text-warm-700 mb-2">
                Will create {founders.length} contact{founders.length > 1 ? 's' : ''}{' '}
                <span className="text-warm-400 font-normal">(Management)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {founders.map((founder, i) => (
                  <FounderBadge
                    key={i}
                    founder={founder}
                    onRemove={() => handleRemoveFounder(i)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-warm-50 border-t border-warm-200">
          <button
            onClick={handleUpload}
            disabled={isUploading || !companyName.trim()}
            className="w-full px-4 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 text-base"
          >
            {isUploading ? 'Uploading...' : 'Upload to CRM'}
          </button>
        </div>
      </div>

      {/* Source link */}
      <p className="text-xs text-warm-400 text-center">
        Source:{' '}
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-500 hover:underline"
        >
          Timeless
        </a>
      </p>
    </div>
  );
}
