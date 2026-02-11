import { useState } from 'react';
import type { Company } from '../../lib/types';
import { FieldRow, SectionCard } from './shared/FieldDisplay';
import { StatusBadge } from './shared/StatusBadge';

interface UploadPreviewProps {
  companies: Company[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function UploadPreview({ companies, onConfirm, onCancel }: UploadPreviewProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const validCompanies = companies.filter(
    (c) =>
      c.validation.valid && !c.duplicate?.isDuplicate && c.uploadStatus === 'pending' && !c.skipped
  );

  // Count total contacts across all companies
  const totalContacts = validCompanies.reduce((sum, c) => sum + (c.contacts?.length || 0), 0);
  const companiesWithContacts = validCompanies.filter((c) => c.contacts && c.contacts.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-warm-800">Upload Preview</h2>
        <button
          onClick={onCancel}
          className="text-warm-500 hover:text-warm-700 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-caution-50 border border-caution-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-caution-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-caution-600"
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
          </div>
          <div>
            <h3 className="font-semibold text-caution-800">Review Before Upload</h3>
            <p className="text-sm text-caution-700 mt-1">
              This will create <strong>{validCompanies.length}</strong> new deal
              {validCompanies.length !== 1 ? 's' : ''} in your CRM.
              {totalContacts > 0 && (
                <>
                  {' '}
                  <strong>{totalContacts}</strong> contact
                  {totalContacts !== 1 ? 's' : ''} will be created across{' '}
                  <strong>{companiesWithContacts.length}</strong> compan
                  {companiesWithContacts.length !== 1 ? 'ies' : 'y'}.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Companies to Upload - Formatted Display */}
      <div>
        <h3 className="font-semibold text-sm text-warm-800 mb-2">
          Companies to Upload ({validCompanies.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {validCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden"
            >
              {/* Company Header */}
              <button
                onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-warm-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status="valid" iconOnly />
                  <span className="font-semibold text-warm-800">
                    {company.data.CompanyName || '(No name)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {company.contacts && company.contacts.length > 0 && (
                    <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-lg font-medium">
                      {company.contacts.length} contact{company.contacts.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-warm-400 transition-transform ${
                      expandedId === company.id ? 'rotate-90' : ''
                    }`}
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
                </div>
              </button>

              {/* Expanded Content - Formatted Fields */}
              {expandedId === company.id && (
                <div className="border-t border-warm-200 p-5 space-y-4 bg-warm-25">
                  {/* Basic Info */}
                  <SectionCard title="Company Information">
                    <FieldRow label="Company Name" value={company.data.CompanyName} />
                    <FieldRow label="Website" value={company.data.Website} type="url" />
                    <FieldRow label="Description" value={company.data.Description} />
                  </SectionCard>

                  {/* Classification */}
                  {(company.data.SectorID || company.data.StageID) && (
                    <SectionCard title="Classification">
                      <FieldRow label="Sector" value={company.data.SectorID} />
                      <FieldRow label="Stage" value={company.data.StageID} />
                    </SectionCard>
                  )}

                  {/* Source Info */}
                  {(company.data.SourceTypeID ||
                    company.data.SourceNotes ||
                    company.data.PastInvestments) && (
                    <SectionCard title="Source Information">
                      <FieldRow label="Source Type" value={company.data.SourceTypeID} />
                      <FieldRow label="Source Notes" value={company.data.SourceNotes} />
                      <FieldRow
                        label="Past Investments"
                        value={company.data.PastInvestments}
                        type="currency"
                      />
                    </SectionCard>
                  )}

                  {/* Contacts */}
                  {company.contacts && company.contacts.length > 0 && (
                    <SectionCard
                      title={`Contacts (${company.contacts.length})`}
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      }
                    >
                      <div className="space-y-3">
                        {company.contacts.map((contact, idx) => (
                          <div
                            key={idx}
                            className="bg-accent-50 border border-accent-200 rounded-xl p-3 space-y-1"
                          >
                            <FieldRow label="Name" value={contact.data.Name} />
                            <FieldRow label="Email" value={contact.data.Email} type="email" />
                            {contact.data.Phone && (
                              <FieldRow label="Phone" value={contact.data.Phone} />
                            )}
                            {contact.data.Title && (
                              <FieldRow label="Title" value={contact.data.Title} />
                            )}
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skipped Companies */}
      {companies.length > validCompanies.length && (
        <div className="text-sm text-warm-600">
          <strong>{companies.length - validCompanies.length}</strong> companies will be skipped
          (invalid or duplicates)
        </div>
      )}

      {/* Confirmation Checkbox */}
      <div className="bg-caution-50 border border-caution-200 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 text-accent-600 rounded border-warm-300 focus:ring-accent-500 focus:ring-4 focus:ring-accent-500/20"
          />
          <div>
            <span className="font-semibold text-caution-800">
              I understand this will create {validCompanies.length} new records in my production
              CRM
            </span>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-warm-700 hover:text-warm-900 bg-white border border-warm-200 rounded-xl font-medium hover:bg-warm-50 transition-colors"
        >
          Go Back
        </button>
        <button
          onClick={onConfirm}
          disabled={!confirmed}
          className="px-5 py-2.5 bg-accent-500 text-white rounded-xl font-semibold hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {confirmed ? `Upload ${validCompanies.length} Companies` : 'Check Box to Enable'}
        </button>
      </div>
    </div>
  );
}
