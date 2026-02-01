import { useState } from 'react';
import type { Company } from '../../lib/types';

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
        <h2 className="text-base font-semibold text-warm-800">Upload Preview (Dry-Run Mode)</h2>
        <button
          onClick={onCancel}
          className="text-warm-500 hover:text-warm-700 text-sm font-medium"
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
                  <br />
                  <span className="text-accent-700">
                    <strong>{totalContacts}</strong> contact
                    {totalContacts !== 1 ? 's' : ''} will be created across{' '}
                    <strong>{companiesWithContacts.length}</strong> compan
                    {companiesWithContacts.length !== 1 ? 'ies' : 'y'}.
                  </span>
                </>
              )}
              <br />
              Please review the data below carefully before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* API Endpoint Info */}
      <div className="bg-warm-50 border border-warm-200 rounded-xl p-3 text-xs font-mono">
        <div className="text-warm-500 mb-1">Endpoints:</div>
        <div className="text-warm-700">POST https://run.mydealflow.com/inv/api/deal/add</div>
        {totalContacts > 0 && (
          <div className="text-accent-600">
            POST https://run.mydealflow.com/inv/api/contact/add ({totalContacts}x)
          </div>
        )}
      </div>

      {/* Companies to Upload */}
      <div>
        <h3 className="font-semibold text-sm text-warm-800 mb-2">
          Payloads to Send ({validCompanies.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {validCompanies.map((company, index) => (
            <div key={company.id} className="border border-warm-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-warm-50 text-left transition-colors"
              >
                <span className="text-sm flex items-center gap-2">
                  <span className="text-warm-500">#{index + 1}</span>
                  <strong className="text-warm-800">
                    {company.data.CompanyName || '(no name)'}
                  </strong>
                  {company.contacts && company.contacts.length > 0 && (
                    <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-lg font-medium">
                      {company.contacts.length}{' '}
                      {company.contacts.length === 1 ? 'contact' : 'contacts'}
                    </span>
                  )}
                </span>
                <span className="text-warm-400">{expandedId === company.id ? '▼' : '▶'}</span>
              </button>

              {expandedId === company.id && (
                <div className="border-t border-warm-200 bg-warm-800 p-3 text-xs font-mono overflow-x-auto space-y-2">
                  <div>
                    <div className="text-warm-400 mb-1">Deal Data:</div>
                    <pre className="text-success-400">{JSON.stringify(company.data, null, 2)}</pre>
                  </div>
                  {company.contacts && company.contacts.length > 0 ? (
                    <div>
                      <div className="text-warm-400 mb-1">
                        Contacts ({company.contacts.length}) - will be linked to deal:
                      </div>
                      {company.contacts.map((contact, contactIndex) => (
                        <div key={contactIndex} className="mb-2">
                          <div className="text-accent-300 text-xs mb-1">
                            Contact {contactIndex + 1}:
                          </div>
                          <pre className="text-accent-400 ml-2">
                            {JSON.stringify(contact.data, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-warm-500 italic">No contacts</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skipped Companies */}
      {companies.length > validCompanies.length && (
        <div className="text-sm text-warm-500">
          <strong>{companies.length - validCompanies.length}</strong> companies will be skipped
          (invalid or duplicates)
        </div>
      )}

      {/* Confirmation Checkbox */}
      <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 text-danger-600 rounded border-warm-300 focus:ring-danger-500"
          />
          <div>
            <span className="font-semibold text-danger-800">
              I have reviewed the data above and understand that:
            </span>
            <ul className="text-sm text-danger-700 mt-1 list-disc list-inside">
              <li>This will create {validCompanies.length} new records in my production CRM</li>
              <li>This action cannot be easily undone</li>
              <li>I will need to manually delete test records afterward</li>
            </ul>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-warm-700 hover:text-warm-900 bg-white border border-warm-200 rounded-xl font-medium hover:bg-warm-50 transition-colors"
        >
          Go Back (Safe)
        </button>
        <button
          onClick={onConfirm}
          disabled={!confirmed}
          className="px-5 py-2.5 bg-danger-500 text-white rounded-xl font-medium hover:bg-danger-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {confirmed ? `Upload ${validCompanies.length} Companies` : 'Confirm Above to Enable'}
        </button>
      </div>
    </div>
  );
}
