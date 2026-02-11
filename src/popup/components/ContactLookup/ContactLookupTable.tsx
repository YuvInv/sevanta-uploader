import { useMemo } from 'react';
import type { ContactLookupResult, MatchType } from '../../../lib/types';
import { StatusBadge } from '../shared/StatusBadge';
import { CrmLink } from '../shared/CrmLink';
import { exportContactResults } from '../../../lib/contactExport';

interface ContactLookupTableProps {
  results: ContactLookupResult[];
  strongCount: number;
  possibleCount: number;
  noneCount: number;
  onReset: () => void;
}

// Sort order: strong (1), possible (2), none (3)
const matchTypeOrder: Record<MatchType, number> = {
  strong: 1,
  possible: 2,
  none: 3,
};

export function ContactLookupTable({
  results,
  strongCount,
  possibleCount,
  noneCount,
  onReset,
}: ContactLookupTableProps) {
  // Sort results by match type: strong first, then possible, then none
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => matchTypeOrder[a.matchType] - matchTypeOrder[b.matchType]);
  }, [results]);

  const handleExport = () => {
    // Export sorted results
    exportContactResults(sortedResults);
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="px-4 py-2 text-warm-600 hover:text-warm-800 font-medium text-sm transition-colors"
        >
          Start Over
        </button>
      </div>

      {/* Results card */}
      <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
        {/* Results summary bar */}
        <div className="px-5 py-4 bg-warm-50 border-b border-warm-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success-500"></span>
              <span className="text-sm font-medium text-warm-700">{strongCount} strong</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-caution-500"></span>
              <span className="text-sm font-medium text-warm-700">{possibleCount} possible</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warm-300"></span>
              <span className="text-sm font-medium text-warm-700">{noneCount} not found</span>
            </span>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="
              flex items-center gap-2 px-4 py-2
              bg-white border border-warm-200
              rounded-lg text-sm font-medium text-warm-700
              hover:bg-warm-50 hover:border-warm-300
              transition-all duration-200
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-warm-100 border-b border-warm-200">
                <th className="px-5 py-3 text-left text-sm font-semibold text-warm-600">
                  Your Input
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-warm-600 w-32">
                  Match
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-warm-600">
                  CRM Contact
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-warm-600">
                  Company
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result) => (
                <tr
                  key={result.id}
                  className={`
                    border-b border-warm-100 last:border-0
                    transition-colors duration-150
                    ${result.matchType === 'strong' ? 'bg-success-50/50' : ''}
                    ${result.matchType === 'possible' ? 'bg-caution-50/50' : ''}
                    hover:bg-warm-50
                  `}
                >
                  {/* Input column */}
                  <td className="px-5 py-4">
                    <div className="font-medium text-warm-800">{result.input.name}</div>
                    {result.input.email && (
                      <div className="text-sm text-warm-500">{result.input.email}</div>
                    )}
                  </td>

                  {/* Match badge */}
                  <td className="px-5 py-4">
                    <StatusBadge status={result.matchType} />
                  </td>

                  {/* CRM Contact with link */}
                  <td className="px-5 py-4">
                    {result.bestMatch ? (
                      <CrmLink type="contact" id={result.bestMatch.contactId}>
                        {result.bestMatch.name}
                      </CrmLink>
                    ) : (
                      <span className="text-warm-400">-</span>
                    )}
                  </td>

                  {/* Company */}
                  <td className="px-5 py-4 text-warm-600">{result.bestMatch?.company || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
