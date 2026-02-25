/**
 * UI for when the company already exists in CRM.
 * Shows matched companies and lets the user pick which one to add the memo comment to.
 */

import { useState } from 'react';
import type { TimelessMemoData } from '../../../lib/timeless/types';
import type { TimelessDuplicateMatch as MatchType } from '../../hooks/useTimelessDuplicateCheck';

interface TimelessDuplicateMatchProps {
  data: TimelessMemoData;
  matches: MatchType[];
  onAddComment: (dealId: string) => void;
  onCreateNew: () => void;
  isUploading?: boolean;
}

export function TimelessDuplicateMatch({
  data,
  matches,
  onAddComment,
  onCreateNew,
  isUploading,
}: TimelessDuplicateMatchProps) {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(
    matches.length === 1 ? matches[0].id || null : null
  );
  const [showMemo, setShowMemo] = useState(false);

  const handleAddComment = () => {
    if (selectedDealId) {
      onAddComment(selectedDealId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-gradient-to-r from-caution-50 to-warm-100 border border-caution-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-caution-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              className="w-4 h-4 text-caution-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-caution-800 text-sm">
              &ldquo;{data.companyName}&rdquo; found in CRM
            </h3>
            <p className="text-caution-700 text-xs mt-0.5">
              Select a match below to add the meeting memo as a comment.
            </p>
          </div>
        </div>
      </div>

      {/* Match list */}
      <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-warm-200 bg-warm-50">
          <p className="text-sm font-medium text-warm-700">
            {matches.length} match{matches.length > 1 ? 'es' : ''} found
          </p>
        </div>

        <div className="divide-y divide-warm-100">
          {matches.map((match) => {
            const isSelected = selectedDealId === match.id;
            return (
              <button
                key={match.id || match.name}
                onClick={() => setSelectedDealId(match.id || null)}
                className={`w-full px-5 py-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-accent-50 border-l-2 border-accent-500'
                    : 'hover:bg-warm-50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-accent-700' : 'text-warm-800'}`}>
                      {match.name}
                    </p>
                    {match.id && (
                      <a
                        href={`https://run.mydealflow.com/inv/#/Company.php?CompanyID=${match.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View in CRM
                      </a>
                    )}
                  </div>
                  {isSelected && (
                    <svg
                      className="w-5 h-5 text-accent-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Memo preview */}
        <div className="px-5 py-3 border-t border-warm-200">
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
            Preview memo to be added
          </button>
          {showMemo && (
            <div className="mt-2 p-3 bg-warm-50 rounded-lg text-xs text-warm-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {data.fullMemoText}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-warm-50 border-t border-warm-200 space-y-2">
          <button
            onClick={handleAddComment}
            disabled={isUploading || !selectedDealId}
            className="w-full px-4 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 text-base"
          >
            {isUploading ? 'Adding Comment...' : 'Add Memo as Comment'}
          </button>
          <button
            onClick={onCreateNew}
            disabled={isUploading}
            className="w-full px-4 py-2 text-sm text-warm-500 hover:text-warm-700 font-medium transition-colors"
          >
            Create as New Company Instead
          </button>
        </div>
      </div>
    </div>
  );
}
