import { ReactNode } from 'react';

// SVG Icon
const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

/**
 * Standardized external CRM link component
 * Ensures consistent styling and behavior for all CRM record references
 */

interface CrmLinkProps {
  type: 'contact' | 'company' | 'task';
  id: string | number;
  children: ReactNode;
  className?: string;
}

const CRM_BASE_URL = 'https://run.mydealflow.com/inv/#';

const crmUrls: Record<string, string> = {
  contact: `${CRM_BASE_URL}/Contact.php?ContactID=`,
  company: `${CRM_BASE_URL}/Company.php?CompanyID=`,
  task: `${CRM_BASE_URL}/Task.php?TaskID=`,
};

export function CrmLink({ type, id, children, className = '' }: CrmLinkProps) {
  const url = `${crmUrls[type]}${id}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        text-accent-600 hover:text-accent-700
        underline decoration-accent-300 hover:decoration-accent-500 underline-offset-2
        inline-flex items-center gap-1 transition-colors
        ${className}
      `}
    >
      {children}
      <ExternalLinkIcon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
