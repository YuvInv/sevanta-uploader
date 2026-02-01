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

  const companiesWithContacts = validCompanies.filter((c) => c.contactData && c.contactData.Name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Upload Preview (Dry-Run Mode)</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-sm">
          Cancel
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-600 text-xl">&#9888;</span>
          <div>
            <h3 className="font-medium text-yellow-800">Review Before Upload</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This will create <strong>{validCompanies.length}</strong> new deal
              {validCompanies.length !== 1 ? 's' : ''} in your CRM.
              {companiesWithContacts.length > 0 && (
                <>
                  <br />
                  <span className="text-purple-700">
                    <strong>{companiesWithContacts.length}</strong> contact
                    {companiesWithContacts.length !== 1 ? 's' : ''} will be created and linked to
                    deal{companiesWithContacts.length !== 1 ? 's' : ''}.
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
      <div className="bg-gray-50 border rounded p-3 text-xs font-mono">
        <div className="text-gray-500 mb-1">Endpoints:</div>
        <div>POST https://run.mydealflow.com/inv/api/deal/add</div>
        {companiesWithContacts.length > 0 && (
          <div className="text-purple-600">POST https://run.mydealflow.com/inv/api/contact/add</div>
        )}
      </div>

      {/* Companies to Upload */}
      <div>
        <h3 className="font-medium text-sm mb-2">Payloads to Send ({validCompanies.length})</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {validCompanies.map((company, index) => (
            <div key={company.id} className="border rounded">
              <button
                onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-left"
              >
                <span className="text-sm flex items-center gap-2">
                  <span className="text-gray-500">#{index + 1}</span>
                  <strong>{company.data.CompanyName || '(no name)'}</strong>
                  {company.contactData && company.contactData.Name && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                      +contact
                    </span>
                  )}
                </span>
                <span className="text-gray-400">{expandedId === company.id ? '▼' : '▶'}</span>
              </button>

              {expandedId === company.id && (
                <div className="border-t bg-gray-900 p-3 text-xs font-mono overflow-x-auto space-y-2">
                  <div>
                    <div className="text-gray-400 mb-1">Deal Data:</div>
                    <pre className="text-green-400">{JSON.stringify(company.data, null, 2)}</pre>
                  </div>
                  {company.contactData && Object.keys(company.contactData).length > 0 ? (
                    <div>
                      <div className="text-gray-400 mb-1">
                        Contact Data (will be linked to deal):
                      </div>
                      <pre className="text-purple-400">
                        {JSON.stringify(company.contactData, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No contact data mapped</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skipped Companies */}
      {companies.length > validCompanies.length && (
        <div className="text-sm text-gray-500">
          <strong>{companies.length - validCompanies.length}</strong> companies will be skipped
          (invalid or duplicates)
        </div>
      )}

      {/* Confirmation Checkbox */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 text-red-600 rounded border-gray-300"
          />
          <div>
            <span className="font-medium text-red-800">
              I have reviewed the data above and understand that:
            </span>
            <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
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
          className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded"
        >
          Go Back (Safe)
        </button>
        <button
          onClick={onConfirm}
          disabled={!confirmed}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirmed ? `Upload ${validCompanies.length} Companies` : 'Confirm Above to Enable'}
        </button>
      </div>
    </div>
  );
}
