/**
 * UI for when the Dealigence company already exists in CRM.
 * Shows matched companies and lets the user:
 * - Add extracted contacts to an existing match (with per-contact edit/remove)
 * - Add extracted data as a comment to an existing match
 * - Create as a new company anyway
 */

import { useState } from 'react';
import type { DealigenceCompanyData, DealigenceStakeholder } from '../../../lib/dealigence/types';
import type { DuplicateCheckMatch } from '../../hooks/useDealigenceDuplicateCheck';
import { useContactCheck, namesMatch } from '../../hooks/useContactCheck';

interface DealigenceDuplicateMatchProps {
  data: DealigenceCompanyData;
  matches: DuplicateCheckMatch[];
  onAddContacts: (dealId: string, newFounders: DealigenceStakeholder[]) => void;
  onAddComment: (dealId: string) => void;
  onCreateNew: () => void;
  isUploading?: boolean;
}

// ─── Editable contact list ────────────────────────────────────────────────────

interface EditableContactListProps {
  initialContacts: DealigenceStakeholder[];
  existingCount: number;
  totalCount: number;
  isUploading: boolean;
  onUpload: (contacts: DealigenceStakeholder[]) => void;
}

function EditableContactList({
  initialContacts,
  existingCount,
  totalCount,
  isUploading,
  onUpload,
}: EditableContactListProps) {
  const [contacts, setContacts] = useState<DealigenceStakeholder[]>(initialContacts);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<DealigenceStakeholder>({ name: '' });

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditDraft({ ...contacts[idx] });
  };

  const saveEdit = () => {
    if (editingIdx !== null) {
      setContacts((prev) => prev.map((c, i) => (i === editingIdx ? editDraft : c)));
    }
    setEditingIdx(null);
  };

  const cancelEdit = () => setEditingIdx(null);

  const removeContact = (idx: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  return (
    <div className="px-5 py-4 space-y-3 border-t border-warm-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-warm-600 uppercase tracking-wide">
          Contacts to add
        </p>
        <p className="text-xs text-warm-400">
          {contacts.length} new
          {existingCount > 0 && ` · ${existingCount} of ${totalCount} already in CRM`}
        </p>
      </div>

      {/* Contact cards */}
      <div className="space-y-2">
        {contacts.map((contact, idx) =>
          editingIdx === idx ? (
            // ── Edit mode ──────────────────────────────────────────────────
            <div key={idx} className="bg-accent-50 border border-accent-200 rounded-xl p-3 space-y-2">
              <div className="space-y-1.5">
                <input
                  className="w-full text-sm px-2.5 py-1.5 border border-warm-300 rounded-lg focus:outline-none focus:border-accent-400 bg-white"
                  placeholder="Name"
                  value={editDraft.name}
                  onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                />
                <input
                  className="w-full text-sm px-2.5 py-1.5 border border-warm-300 rounded-lg focus:outline-none focus:border-accent-400 bg-white"
                  placeholder="Title (optional)"
                  value={editDraft.title ?? ''}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, title: e.target.value || undefined }))
                  }
                />
                <input
                  className="w-full text-sm px-2.5 py-1.5 border border-warm-300 rounded-lg focus:outline-none focus:border-accent-400 bg-white"
                  placeholder="LinkedIn URL (optional)"
                  value={editDraft.linkedinUrl ?? ''}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, linkedinUrl: e.target.value || undefined }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={!editDraft.name.trim()}
                  className="flex-1 px-3 py-1.5 bg-accent-500 text-white rounded-lg text-xs font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-3 py-1.5 bg-warm-100 text-warm-700 rounded-lg text-xs font-medium hover:bg-warm-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // ── View mode ──────────────────────────────────────────────────
            <div
              key={idx}
              className="flex items-start gap-2.5 bg-warm-50 border border-warm-200 rounded-xl px-3 py-2.5 group"
            >
              {/* Avatar */}
              <div className="w-7 h-7 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-accent-700 font-medium text-xs">
                  {contact.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-warm-800 truncate">{contact.name}</p>
                {contact.title && (
                  <p className="text-xs text-warm-500 truncate">{contact.title}</p>
                )}
                {contact.linkedinUrl && (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent-500 hover:underline truncate block"
                  >
                    {contact.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(idx)}
                  title="Edit contact"
                  className="p-1 text-warm-400 hover:text-accent-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => removeContact(idx)}
                  title="Remove contact"
                  className="p-1 text-warm-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={() => onUpload(contacts)}
        disabled={isUploading || contacts.length === 0 || editingIdx !== null}
        className="w-full px-4 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 text-base"
      >
        {isUploading
          ? 'Adding...'
          : contacts.length === 0
            ? 'No contacts to add'
            : `Add ${contacts.length} contact${contacts.length > 1 ? 's' : ''} to CRM`}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DealigenceDuplicateMatch({
  data,
  matches,
  onAddContacts,
  onAddComment,
  onCreateNew,
  isUploading,
}: DealigenceDuplicateMatchProps) {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(
    matches.length === 1 ? (matches[0].id ?? null) : null
  );

  const { existingNames, isChecking: isCheckingContacts } = useContactCheck(
    selectedDealId ?? undefined
  );

  const hasFounders = data.founders.length > 0;
  const newFounders = hasFounders
    ? data.founders.filter((f) => !existingNames.some((n) => namesMatch(f.name, n)))
    : [];

  const handleAddComment = () => {
    if (selectedDealId) onAddComment(selectedDealId);
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
              Select a match to update it, or create as a new company.
            </p>
          </div>
        </div>
      </div>

      {/* Match list + actions */}
      <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Match list header */}
        <div className="px-5 py-3 border-b border-warm-200 bg-warm-50">
          <p className="text-sm font-medium text-warm-700">
            {matches.length} match{matches.length > 1 ? 'es' : ''} found
          </p>
        </div>

        {/* Matches */}
        <div className="divide-y divide-warm-100">
          {matches.map((match) => {
            const isSelected = selectedDealId === match.id;
            return (
              <button
                key={match.id ?? match.name}
                onClick={() => setSelectedDealId(match.id ?? null)}
                className={`w-full px-5 py-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-accent-50 border-l-2 border-accent-500'
                    : 'hover:bg-warm-50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${isSelected ? 'text-accent-700' : 'text-warm-800'}`}
                    >
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

        {/* Contacts section (shown when a match is selected and founders exist) */}
        {selectedDealId && hasFounders && (
          <>
            {isCheckingContacts ? (
              <div className="px-5 py-3 border-t border-warm-100 bg-warm-50">
                <p className="text-xs text-warm-500">Checking existing contacts...</p>
              </div>
            ) : newFounders.length === 0 ? (
              <div className="px-5 py-3 border-t border-warm-100 bg-warm-50">
                <p className="text-xs text-success-600">
                  All {data.founders.length} contact
                  {data.founders.length > 1 ? 's' : ''} already in CRM
                </p>
              </div>
            ) : (
              // key=selectedDealId resets state when the selected match changes
              <EditableContactList
                key={selectedDealId}
                initialContacts={newFounders}
                existingCount={existingNames.length}
                totalCount={data.founders.length}
                isUploading={!!isUploading}
                onUpload={(edited) => onAddContacts(selectedDealId, edited)}
              />
            )}
          </>
        )}

        {/* Actions */}
        <div className="px-5 py-4 bg-warm-50 border-t border-warm-200 space-y-2">
          {/* Add as comment */}
          <button
            onClick={handleAddComment}
            disabled={isUploading || !selectedDealId}
            className="w-full px-4 py-3 bg-warm-200 text-warm-800 rounded-xl font-medium hover:bg-warm-300 transition-colors disabled:opacity-50 text-base"
          >
            {isUploading ? 'Adding...' : 'Add Data as Comment'}
          </button>

          {/* Create new */}
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
