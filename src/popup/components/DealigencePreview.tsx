/**
 * Preview card for extracted Dealigence company data
 */

import type { DealigenceCompanyData, ValidationResult } from '../../lib/types';

interface DealigencePreviewProps {
  data: DealigenceCompanyData;
  dealData: Record<string, string>;
  validation: ValidationResult;
  extractionWarnings: string[];
  onEdit: () => void;
  onProceed: () => void;
  isValid: boolean;
}

export function DealigencePreview({
  data,
  dealData,
  validation,
  extractionWarnings,
  onEdit,
  onProceed,
  isValid,
}: DealigencePreviewProps) {
  return (
    <div className="space-y-4">
      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-danger-800 mb-2">Validation Errors</h4>
          <ul className="text-sm text-danger-700 space-y-1">
            {validation.errors.map((error, i) => (
              <li key={i}>• {error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Extraction Warnings */}
      {extractionWarnings.length > 0 && (
        <div className="bg-caution-50 border border-caution-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-caution-800 mb-2">Extraction Notes</h4>
          <ul className="text-sm text-caution-700 space-y-1">
            {extractionWarnings.map((warning, i) => (
              <li key={i}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Company Card */}
      <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 px-5 py-4 border-b border-warm-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-warm-900">{data.companyName}</h3>
              {data.website && (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent-600 hover:text-accent-700 hover:underline"
                >
                  {data.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
            {data.linkedinUrl && (
              <a
                href={data.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-600 hover:text-accent-700"
                title="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="px-5 py-4 border-b border-warm-100">
            <p className="text-sm text-warm-700 leading-relaxed">{data.description}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="px-5 py-4 border-b border-warm-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.employees && (
              <div>
                <dt className="text-xs font-medium text-warm-500 uppercase tracking-wider">
                  Employees
                </dt>
                <dd className="mt-1 text-sm font-semibold text-warm-900">{data.employees}</dd>
              </div>
            )}
            {data.fundingStatus && (
              <div>
                <dt className="text-xs font-medium text-warm-500 uppercase tracking-wider">
                  Funding Status
                </dt>
                <dd className="mt-1 text-sm font-semibold text-warm-900">{data.fundingStatus}</dd>
              </div>
            )}
            {data.established && (
              <div>
                <dt className="text-xs font-medium text-warm-500 uppercase tracking-wider">
                  Established
                </dt>
                <dd className="mt-1 text-sm font-semibold text-warm-900">
                  {formatEstablished(data.established)}
                </dd>
              </div>
            )}
            {data.totalFunding && (
              <div>
                <dt className="text-xs font-medium text-warm-500 uppercase tracking-wider">
                  Total Funding
                </dt>
                <dd className="mt-1 text-sm font-semibold text-warm-900">{data.totalFunding}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Categories */}
        {data.categories.length > 0 && (
          <div className="px-5 py-4 border-b border-warm-100">
            <dt className="text-xs font-medium text-warm-500 uppercase tracking-wider mb-2">
              Categories
            </dt>
            <div className="flex flex-wrap gap-2">
              {data.categories.map((cat, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-800"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Founders */}
        {data.founders.length > 0 && (
          <div className="px-5 py-4 border-b border-warm-100">
            <dt className="text-xs font-medium text-warm-500 uppercase tracking-wider mb-2">
              Founders ({data.founders.length} will be imported)
            </dt>
            <div className="space-y-2">
              {data.founders.map((founder, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-accent-700">
                      {founder.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-warm-900">{founder.name}</span>
                    {founder.linkedinUrl && (
                      <a
                        href={founder.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-accent-600 hover:text-accent-700"
                        title="LinkedIn"
                      >
                        <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stakeholders */}
        {data.stakeholders.length > 0 && (
          <div className="px-5 py-4 border-b border-warm-100">
            <dt className="text-xs font-medium text-warm-500 uppercase tracking-wider mb-2">
              Stakeholders & Advisors
            </dt>
            <div className="space-y-1">
              {data.stakeholders.map((stakeholder, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-warm-900">{stakeholder.name}</span>
                  <span className="text-warm-500"> - {stakeholder.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CRM Field Preview */}
        <div className="px-5 py-4 bg-warm-50">
          <dt className="text-xs font-medium text-warm-500 uppercase tracking-wider mb-2">
            CRM Field Mapping
          </dt>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-warm-500">Deal Name: </span>
              <span className="text-warm-900">{dealData.CompanyName || '—'}</span>
            </div>
            <div>
              <span className="text-warm-500">Industry: </span>
              <span className="text-warm-900">{dealData.IndustryID || '—'}</span>
            </div>
            <div>
              <span className="text-warm-500">Round: </span>
              <span className="text-warm-900">{dealData.LifeStageID || '—'}</span>
            </div>
            <div>
              <span className="text-warm-500">Past Investment: </span>
              <span className="text-warm-900">{dealData.Num01 ? `$${dealData.Num01}M` : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Source Link */}
      <div className="text-center">
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-warm-500 hover:text-warm-700"
        >
          Source: {data.sourceUrl}
        </a>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onEdit}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-warm-700 bg-white border border-warm-200 rounded-xl hover:bg-warm-50 transition-colors"
        >
          Edit Fields
        </button>
        <button
          onClick={onProceed}
          disabled={!isValid}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-accent-500 rounded-xl hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Check & Upload
        </button>
      </div>
    </div>
  );
}

function formatEstablished(date: string): string {
  // If it's an ISO date, extract just the year
  if (date.match(/^\d{4}-\d{2}-\d{2}/)) {
    return date.substring(0, 4);
  }
  return date;
}
