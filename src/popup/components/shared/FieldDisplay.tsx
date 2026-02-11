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
 * Reusable field display components for consistent formatting across all tabs
 * Matches Quick Upload's clean field display pattern
 */

interface FieldRowProps {
  label: string;
  value: string | number | null | undefined;
  type?: 'text' | 'url' | 'email' | 'currency';
  muted?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function FieldRow({
  label,
  value,
  type = 'text',
  muted = false,
  icon,
  className = '',
}: FieldRowProps) {
  // Handle empty/null values
  if (value === null || value === undefined || value === '') {
    return (
      <div className={`flex justify-between items-baseline gap-2 py-1.5 ${className}`}>
        <span className="text-sm text-warm-500">{label}</span>
        <span className="text-sm text-warm-400 italic">Not provided</span>
      </div>
    );
  }

  // Format value based on type
  let formattedValue: ReactNode = value;

  switch (type) {
    case 'url':
      if (typeof value === 'string' && value) {
        formattedValue = (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-600 hover:text-accent-700 underline decoration-accent-300 hover:decoration-accent-500 underline-offset-2 inline-flex items-center gap-1 transition-colors"
          >
            {value}
            <ExternalLinkIcon className="w-3 h-3 opacity-70" />
          </a>
        );
      }
      break;

    case 'email':
      if (typeof value === 'string' && value) {
        formattedValue = (
          <a
            href={`mailto:${value}`}
            className="text-accent-600 hover:text-accent-700 underline decoration-accent-300 hover:decoration-accent-500 underline-offset-2 transition-colors"
          >
            {value}
          </a>
        );
      }
      break;

    case 'currency':
      if (typeof value === 'number') {
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      } else if (typeof value === 'string') {
        // Try to parse as number
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) {
          formattedValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(num);
        }
      }
      break;

    case 'text':
    default:
      formattedValue = value.toString();
      break;
  }

  return (
    <div className={`flex justify-between items-baseline gap-2 py-1.5 ${className}`}>
      <span className="text-sm text-warm-500 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span
        className={`text-sm ${
          muted ? 'text-warm-400' : 'text-warm-800'
        } truncate max-w-[60%] text-right`}
        title={typeof formattedValue === 'string' ? formattedValue : value.toString()}
      >
        {formattedValue}
      </span>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  children,
  icon,
  className = '',
}: SectionCardProps) {
  return (
    <div className={`bg-warm-50 border border-warm-200 rounded-xl p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-warm-700 mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
