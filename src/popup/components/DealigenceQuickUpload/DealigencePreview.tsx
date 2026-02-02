/**
 * Preview card showing extracted company data
 */

import type { DealigenceCompanyData, DealigenceStakeholder } from '../../../lib/dealigence/types';

interface DealigencePreviewProps {
  data: DealigenceCompanyData;
  onUpload: () => void;
  onEdit: () => void;
  isUploading?: boolean;
  duplicateWarning?: string;
}

function FounderBadge({ founder }: { founder: DealigenceStakeholder }) {
  return (
    <div className="inline-flex items-center gap-2 bg-warm-100 rounded-lg px-3 py-2">
      {/* Avatar placeholder */}
      <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
        <span className="text-accent-700 font-medium text-sm">
          {founder.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
      </div>
      <div className="text-left">
        <p className="font-medium text-warm-800 text-sm">{founder.name}</p>
        {founder.title && <p className="text-xs text-warm-500">{founder.title}</p>}
      </div>
      {founder.linkedinUrl && (
        <a
          href={founder.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-600 hover:text-accent-700"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
      )}
    </div>
  );
}

export function DealigencePreview({
  data,
  onUpload,
  onEdit,
  isUploading,
  duplicateWarning,
}: DealigencePreviewProps) {
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

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Description */}
          {data.description && (
            <div>
              <p className="text-sm font-medium text-warm-500 mb-1">Description</p>
              <p className="text-warm-700 text-base leading-relaxed line-clamp-3">
                {data.description}
              </p>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Funding */}
            {data.totalFunding && (
              <div>
                <p className="text-sm font-medium text-warm-500 mb-1">Total Funding</p>
                <p className="text-warm-800 font-semibold">{data.totalFunding}</p>
              </div>
            )}

            {/* Stage */}
            {data.fundingStatus && (
              <div>
                <p className="text-sm font-medium text-warm-500 mb-1">Stage</p>
                <p className="text-warm-800 font-semibold">{data.fundingStatus}</p>
              </div>
            )}

            {/* Location */}
            {data.headquarters && (
              <div>
                <p className="text-sm font-medium text-warm-500 mb-1">Location</p>
                <p className="text-warm-800">{data.headquarters}</p>
              </div>
            )}

            {/* Founded */}
            {data.founded && (
              <div>
                <p className="text-sm font-medium text-warm-500 mb-1">Founded</p>
                <p className="text-warm-800">{data.founded}</p>
              </div>
            )}

            {/* Employees */}
            {data.employees && (
              <div>
                <p className="text-sm font-medium text-warm-500 mb-1">Employees</p>
                <p className="text-warm-800">{data.employees}</p>
              </div>
            )}
          </div>

          {/* Categories */}
          {data.categories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-warm-500 mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {data.categories.map((cat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-warm-100 text-warm-700 rounded-full text-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Founders */}
          {data.founders.length > 0 && (
            <div>
              <p className="text-sm font-medium text-warm-500 mb-2">Founders</p>
              <div className="flex flex-wrap gap-2">
                {data.founders.map((founder, i) => (
                  <FounderBadge key={i} founder={founder} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-warm-50 border-t border-warm-200 flex gap-3">
          <button
            onClick={onEdit}
            disabled={isUploading}
            className="flex-1 px-4 py-2.5 border border-warm-300 text-warm-700 rounded-xl font-medium hover:bg-warm-100 transition-colors disabled:opacity-50 text-base"
          >
            Edit Before Upload
          </button>
          <button
            onClick={onUpload}
            disabled={isUploading}
            className="flex-1 px-4 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 text-base"
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
          {data.sourceUrl}
        </a>
      </p>
    </div>
  );
}
