import type { Company, Schema } from '../../lib/types';
import { StatusBadge as SharedStatusBadge } from './shared/StatusBadge';

interface CompanyTableProps {
  companies: Company[];
  schema: Schema | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onToggleSkip: (id: string) => void;
  onOverrideDuplicate: (id: string) => void;
  overriddenDuplicates: Set<string>;
}

export function CompanyTable({
  companies,
  selectedId,
  onSelect,
  onToggleSkip,
  onOverrideDuplicate,
  overriddenDuplicates,
}: CompanyTableProps) {

  const getRowClass = (company: Company) => {
    if (company.skipped) return 'bg-warm-100 opacity-60';
    if (company.uploadStatus === 'success') return 'bg-success-50';
    if (company.uploadStatus === 'partial') return 'bg-caution-50';
    if (company.uploadStatus === 'error') return 'bg-danger-50';
    if (company.duplicate?.isDuplicate) return 'status-duplicate';
    if (!company.validation.valid) return 'status-error';
    if (company.validation.warnings.length > 0) return 'status-warning';
    return '';
  };

  const getCompanyStatus = (company: Company): Parameters<typeof SharedStatusBadge>[0]['status'] => {
    if (company.skipped) return 'skipped';
    if (company.uploadStatus === 'success') return 'success';
    if (company.uploadStatus === 'error') return 'error';
    if (company.uploadStatus === 'uploading') return 'uploading';
    if (company.uploadStatus === 'partial') return 'warning';
    if (company.duplicate?.isDuplicate) return 'duplicate';
    if (!company.validation.valid) return 'error';
    if (company.validation.warnings.length > 0) return 'warning';
    return 'valid';
  };

  const getContactCountBadge = (company: Company) => {
    const count = company.contacts?.length || 0;
    if (count === 0) return null;

    // Check upload statuses if available
    if (company.contactUploadStatuses && company.contactUploadStatuses.length > 0) {
      const successful = company.contactUploadStatuses.filter((s) => s.status === 'success').length;
      const total = company.contactUploadStatuses.length;
      if (successful < total) {
        return (
          <span className="px-1.5 py-0.5 bg-caution-100 text-caution-700 text-xs rounded-lg font-medium">
            {successful}/{total} contacts
          </span>
        );
      }
    }

    return (
      <span className="px-1.5 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-lg font-medium">
        {count} {count === 1 ? 'contact' : 'contacts'}
      </span>
    );
  };

  return (
    <div className="border border-warm-200 rounded-2xl overflow-auto max-h-80 bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-warm-100">
            <th className="px-3 py-3 text-left text-sm font-semibold text-warm-600 w-12"></th>
            <th className="px-3 py-3 text-left text-sm font-semibold text-warm-600">Company</th>
            <th className="px-3 py-3 text-left text-sm font-semibold text-warm-600 w-48">Status</th>
            <th className="px-3 py-3 text-right text-sm font-semibold text-warm-600 w-40">Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => {
            const isDuplicate = company.duplicate?.isDuplicate;
            const isOverridden = isDuplicate && overriddenDuplicates.has(company.id);
            const showDuplicateBanner = isDuplicate && !isOverridden && !company.skipped;

            return (
              <>
                <tr
                  key={company.id}
                  className={`${getRowClass(company)} ${
                    selectedId === company.id ? 'ring-2 ring-accent-500 ring-inset' : ''
                  }`}
                >
                  <td className="px-3 py-3 text-center">
                    <SharedStatusBadge status={getCompanyStatus(company)} iconOnly />
                  </td>

                  {/* Company info - spans full width */}
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-warm-800">{company.data.CompanyName || '(No name)'}</div>
                      <div className="flex items-center gap-3 text-sm text-warm-600">
                        {company.data.Website && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            {company.data.Website}
                          </span>
                        )}
                        {company.data.SectorID && (
                          <span className="px-2 py-0.5 bg-warm-100 text-warm-700 text-xs rounded-lg">
                            {company.data.SectorID}
                          </span>
                        )}
                        {company.data.StageID && (
                          <span className="px-2 py-0.5 bg-warm-100 text-warm-700 text-xs rounded-lg">
                            {company.data.StageID}
                          </span>
                        )}
                        {getContactCountBadge(company)}
                      </div>
                    </div>
                  </td>

                  {/* Status with explanation */}
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <SharedStatusBadge status={getCompanyStatus(company)} />
                      {!company.validation.valid && company.validation.errors.length > 0 && (
                        <div className="text-xs text-danger-600">
                          {company.validation.errors[0].message}
                        </div>
                      )}
                      {company.validation.warnings.length > 0 && (
                        <div className="text-xs text-caution-600">
                          {company.validation.warnings[0].message}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!company.skipped && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(company.id);
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-accent-50 text-accent-600 border border-accent-200 hover:bg-accent-100 font-medium transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSkip(company.id);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          company.skipped
                            ? 'bg-accent-50 text-accent-600 border-accent-200 hover:bg-accent-100'
                            : 'bg-white text-warm-600 border-warm-300 hover:bg-warm-50'
                        }`}
                      >
                        {company.skipped ? 'Restore' : 'Skip'}
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Duplicate Banner Row */}
                {showDuplicateBanner && company.duplicate?.existingDeal && (
                  <tr key={`${company.id}-duplicate-banner`}>
                    <td colSpan={7} className="px-0 py-0">
                      <div className="bg-caution-50 border-l-4 border-caution-500 px-4 py-3 mx-3 mb-2 rounded-r-lg">
                        <div className="flex items-start gap-3">
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
                          <div className="flex-1">
                            <p className="font-semibold text-caution-800 text-sm">
                              Already in CRM
                            </p>
                            <p className="text-sm text-caution-700 mt-0.5">
                              Matched: "{company.duplicate.existingDeal.CompanyName || company.duplicate.existingDeal.Website}"
                              {company.duplicate.existingDeal.id && ' • '}
                              {company.duplicate.existingDeal.id && (
                                <a
                                  href={`https://run.mydealflow.com/inv/#/Company.php?CompanyID=${company.duplicate.existingDeal.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent-600 hover:text-accent-700 underline decoration-accent-300 hover:decoration-accent-500 underline-offset-2 inline-flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View in CRM
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </a>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOverrideDuplicate(company.id);
                            }}
                            className="text-sm text-caution-700 hover:text-caution-800 font-medium underline whitespace-nowrap"
                          >
                            Upload Anyway
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

