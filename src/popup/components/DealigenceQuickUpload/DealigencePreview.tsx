/**
 * Preview card showing extracted company data aligned with CRM fields
 * Shows what will be uploaded to the CRM before upload
 */

import { useState } from 'react';
import type { DealigenceCompanyData, DealigenceStakeholder } from '../../../lib/dealigence/types';
import {
  parseFundingAmount,
  mapFundingStatus,
  mapCategory,
} from '../../../lib/dealigence/transformers';

interface DealigencePreviewProps {
  data: DealigenceCompanyData;
  onUpload: () => void;
  isUploading?: boolean;
  duplicateWarning?: string;
}

// Human-readable labels for CRM field values
const LIFE_STAGE_LABELS: Record<string, string> = {
  '0': 'Seed',
  PS: 'Post-Seed',
  A: 'Series A',
  B: 'Series B',
  C: 'Series C',
  D: 'Series D',
  O: 'Other',
};

const INDUSTRY_LABELS: Record<string, string> = {
  Health: 'Healthcare',
  HCD: 'Health Diagnostics',
  Assi: 'Medical Devices',
  IT: 'IT/Software',
  Fintech: 'Fintech',
  IND4: 'Industry 4.0',
  IOT: 'IoT/Hardware',
  Cyber: 'Cybersecurity',
  AgFo: 'AgTech/FoodTech',
  Clean: 'CleanTech',
};

function FounderBadge({ founder }: { founder: DealigenceStakeholder }) {
  return (
    <div className="flex items-center gap-2 bg-warm-50 rounded-lg px-3 py-2">
      {/* Avatar */}
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
    </div>
  );
}

function FieldRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-2 py-1.5">
      <span className="text-sm text-warm-500 flex-shrink-0">{label}</span>
      <span className={`text-sm text-right truncate ${muted ? 'text-warm-400' : 'text-warm-800'}`}>
        {value}
      </span>
    </div>
  );
}

export function DealigencePreview({
  data,
  onUpload,
  isUploading,
  duplicateWarning,
}: DealigencePreviewProps) {
  const [showSourceDetails, setShowSourceDetails] = useState(false);

  // Compute CRM values for display
  const fundingAmount = parseFundingAmount(data.totalFunding);
  const lifeStageId = mapFundingStatus(data.fundingStatus);
  const industryId = mapCategory(data.categories);

  // Format past investment for display
  const pastInvestmentDisplay = fundingAmount !== undefined ? `$${fundingAmount}M` : undefined;

  // Get human-readable labels
  const roundLabel = lifeStageId ? LIFE_STAGE_LABELS[lifeStageId] || lifeStageId : undefined;
  const industryLabel = industryId ? INDUSTRY_LABELS[industryId] || industryId : undefined;

  return (
    <div className="space-y-4">
      {/* Duplicate warning */}
      {duplicateWarning && (
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
            <p className="text-sm font-medium text-caution-800">Possible Duplicate</p>
            <p className="text-sm text-caution-700">{duplicateWarning}</p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-50 to-warm-50 px-5 py-4 border-b border-warm-200">
          <h2 className="text-xl font-semibold text-warm-800">{data.companyName}</h2>
          {data.website && (
            <a
              href={data.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-600 hover:text-accent-700 hover:underline"
            >
              {data.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          )}
        </div>

        {/* Deal Fields Section */}
        <div className="p-5 space-y-4">
          {/* Description */}
          {data.description && (
            <div>
              <p className="text-sm font-medium text-warm-500 mb-1">Description</p>
              <p className="text-warm-700 text-sm leading-relaxed line-clamp-3">
                {data.description}
              </p>
            </div>
          )}

          {/* CRM Fields */}
          <div className="bg-warm-50 rounded-xl p-4">
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-2">
              CRM Fields
            </p>
            <div className="divide-y divide-warm-200">
              {data.website && (
                <FieldRow
                  label="Website"
                  value={data.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                />
              )}
              {pastInvestmentDisplay && (
                <FieldRow label="Past Investment" value={pastInvestmentDisplay} />
              )}
              {roundLabel && <FieldRow label="Round" value={roundLabel} />}
              {industryLabel && <FieldRow label="Industry" value={industryLabel} />}
            </div>
          </div>

          {/* Source Notes (collapsible) */}
          <div>
            <button
              onClick={() => setShowSourceDetails(!showSourceDetails)}
              className="flex items-center gap-2 text-sm text-warm-500 hover:text-warm-700 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showSourceDetails ? 'rotate-90' : ''}`}
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
              Source Notes
            </button>
            {showSourceDetails && (
              <div className="mt-2 p-3 bg-warm-50 rounded-lg text-xs text-warm-600">
                <p>Uploaded through Sevanta uploader extension</p>
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-500 hover:underline"
                >
                  {data.sourceUrl}
                </a>
              </div>
            )}
          </div>

          {/* Contacts Section */}
          {data.founders.length > 0 && (
            <div className="pt-3 border-t border-warm-200">
              <p className="text-sm font-medium text-warm-700 mb-2">
                Will create {data.founders.length} contact{data.founders.length > 1 ? 's' : ''}{' '}
                <span className="text-warm-400 font-normal">(Management)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {data.founders.map((founder, i) => (
                  <FounderBadge key={i} founder={founder} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-warm-50 border-t border-warm-200">
          <button
            onClick={onUpload}
            disabled={isUploading}
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
          Dealigence
        </a>
      </p>
    </div>
  );
}
