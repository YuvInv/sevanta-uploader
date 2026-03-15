/**
 * Preview card showing extracted IVC company data aligned with CRM fields
 */

import { useCallback, useRef, useState } from 'react';
import type { IvcCompanyData, IvcStakeholder } from '../../../lib/ivc/types';
import { parseTotalCapital, mapSector, mapStage } from '../../../lib/ivc/transformers';
import type { DuplicateCheckResult } from '../../hooks/useQuickUploadDuplicateCheck';
import { DuplicateCheckBanner } from '../DealigenceQuickUpload/DuplicateCheckBanner';

interface IvcPreviewProps {
  data: IvcCompanyData;
  effectiveCompanyName: string;
  onCompanyNameChange: (name: string | null) => void;
  onUpload: () => void;
  isUploading?: boolean;
  duplicateCheck: DuplicateCheckResult;
  canUpload: boolean;
  onDuplicateOverride: () => void;
}

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

function PersonBadge({ person }: { person: IvcStakeholder }) {
  return (
    <div className="flex items-center gap-2 bg-warm-50 rounded-lg px-3 py-2">
      <div className="w-7 h-7 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-accent-700 font-medium text-xs">
          {person.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
      </div>
      <div className="text-left min-w-0">
        <p className="font-medium text-warm-800 text-sm truncate">{person.name}</p>
        {person.title && <p className="text-xs text-warm-500 truncate">{person.title}</p>}
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

export function IvcPreview({
  data,
  effectiveCompanyName,
  onCompanyNameChange,
  onUpload,
  isUploading,
  duplicateCheck,
  canUpload,
  onDuplicateOverride,
}: IvcPreviewProps) {
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameDraft, setEditNameDraft] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startEditingName = useCallback(() => {
    setEditNameDraft(effectiveCompanyName);
    setIsEditingName(true);
    // Focus after render
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [effectiveCompanyName]);

  const commitNameEdit = useCallback(() => {
    const trimmed = editNameDraft.trim();
    if (trimmed && trimmed !== data.companyName) {
      onCompanyNameChange(trimmed);
    } else {
      // Edited back to original → clear override
      onCompanyNameChange(null);
    }
    setIsEditingName(false);
  }, [editNameDraft, data.companyName, onCompanyNameChange]);

  const cancelNameEdit = useCallback(() => {
    setIsEditingName(false);
  }, []);

  // Compute CRM values for display
  const capitalAmount = parseTotalCapital(data.totalCapital);
  const lifeStageId = mapStage(data.stage);
  const industryId = mapSector(data.sector);

  const pastInvestmentDisplay = capitalAmount !== undefined ? `$${capitalAmount}M` : undefined;
  const roundLabel = lifeStageId ? LIFE_STAGE_LABELS[lifeStageId] || lifeStageId : undefined;
  const industryLabel = industryId ? INDUSTRY_LABELS[industryId] || industryId : undefined;

  return (
    <div className="space-y-4">
      {/* Duplicate check status */}
      <DuplicateCheckBanner
        step={duplicateCheck.step}
        matches={duplicateCheck.matches}
        onOverride={onDuplicateOverride}
      />

      {/* Main card */}
      <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-50 to-warm-50 px-5 py-4 border-b border-warm-200">
          <div className="flex items-center justify-between">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={editNameDraft}
                onChange={(e) => setEditNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitNameEdit();
                  if (e.key === 'Escape') cancelNameEdit();
                }}
                onBlur={commitNameEdit}
                className="text-xl font-semibold text-warm-800 bg-transparent border-b-2 border-accent-400 outline-none flex-1 mr-2"
              />
            ) : (
              <button
                onClick={startEditingName}
                className="group flex items-center gap-1.5 text-left"
                title="Click to edit company name"
              >
                <h2 className="text-xl font-semibold text-warm-800">{effectiveCompanyName}</h2>
                <svg
                  className="w-4 h-4 text-warm-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            <span className="text-xs font-medium text-warm-500 bg-warm-100 px-2 py-0.5 rounded-full flex-shrink-0">
              IVC
            </span>
          </div>
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

          {/* IVC-specific extra fields */}
          {(data.technology || data.targetMarkets || data.businessModel || data.established) && (
            <div className="bg-warm-50 rounded-xl p-4">
              <p className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-2">
                Additional Info
              </p>
              <div className="divide-y divide-warm-200">
                {data.established && <FieldRow label="Established" value={data.established} />}
                {data.employees && <FieldRow label="Employees" value={data.employees} />}
                {data.technology && <FieldRow label="Technology" value={data.technology} />}
                {data.targetMarkets && (
                  <FieldRow label="Target Markets" value={data.targetMarkets} />
                )}
                {data.businessModel && (
                  <FieldRow label="Business Model" value={data.businessModel} />
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-accent-50 text-accent-700 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

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

          {/* Management Contacts */}
          {data.management.length > 0 && (
            <div className="pt-3 border-t border-warm-200">
              <p className="text-sm font-medium text-warm-700 mb-2">
                Will create {data.management.length} contact{data.management.length > 1 ? 's' : ''}{' '}
                <span className="text-warm-400 font-normal">(Management)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {data.management.map((person, i) => (
                  <PersonBadge key={i} person={person} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-warm-50 border-t border-warm-200">
          <button
            onClick={onUpload}
            disabled={isUploading || !canUpload}
            className="w-full px-4 py-3 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 text-base"
          >
            {isUploading
              ? 'Uploading...'
              : duplicateCheck.step === 'checking'
                ? 'Checking...'
                : 'Upload to CRM'}
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
          IVC
        </a>
      </p>
    </div>
  );
}
