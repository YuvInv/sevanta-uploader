/**
 * Unified status badge component used across all tabs
 * Replaces:
 * - Emoji icons in Bulk Upload (✓, ✗, ⚠)
 * - MatchBadge in Contact Lookup
 * - Inline badges in Quick Upload
 */

type StatusType =
  // Bulk Upload statuses
  | 'valid'
  | 'warning'
  | 'error'
  | 'duplicate'
  | 'uploading'
  | 'success'
  | 'skipped'
  // Contact Lookup match types
  | 'strong'
  | 'possible'
  | 'none';

interface StatusBadgeProps {
  status: StatusType;
  text?: string; // Optional label (e.g., "Strong", "Uploaded")
  showIcon?: boolean; // Default true
  iconOnly?: boolean; // Show only icon, no text
  className?: string; // Additional classes
}

// SVG Icons
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const MinusCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const HelpCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const statusConfig: Record<
  StatusType,
  {
    bg: string;
    text: string;
    icon: ({ className }: { className?: string }) => JSX.Element;
    defaultText: string;
  }
> = {
  // Success states (green)
  valid: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    icon: CheckCircleIcon,
    defaultText: 'Valid',
  },
  success: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    icon: CheckCircleIcon,
    defaultText: 'Success',
  },
  strong: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    icon: CheckCircleIcon,
    defaultText: 'Strong',
  },

  // Warning/Caution states (amber)
  warning: {
    bg: 'bg-caution-100',
    text: 'text-caution-700',
    icon: AlertTriangleIcon,
    defaultText: 'Warning',
  },
  duplicate: {
    bg: 'bg-caution-100',
    text: 'text-caution-700',
    icon: CopyIcon,
    defaultText: 'Duplicate',
  },
  possible: {
    bg: 'bg-caution-100',
    text: 'text-caution-700',
    icon: HelpCircleIcon,
    defaultText: 'Possible',
  },

  // Error states (red)
  error: {
    bg: 'bg-danger-100',
    text: 'text-danger-700',
    icon: XCircleIcon,
    defaultText: 'Error',
  },

  // Neutral/None states (gray)
  skipped: {
    bg: 'bg-warm-100',
    text: 'text-warm-500',
    icon: MinusCircleIcon,
    defaultText: 'Skipped',
  },
  none: {
    bg: 'bg-warm-100',
    text: 'text-warm-500',
    icon: MinusCircleIcon,
    defaultText: 'None',
  },

  // Processing states (accent/blue)
  uploading: {
    bg: 'bg-accent-100',
    text: 'text-accent-700',
    icon: LoaderIcon,
    defaultText: 'Uploading...',
  },
};

export function StatusBadge({
  status,
  text,
  showIcon = true,
  iconOnly = false,
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayText = text || config.defaultText;

  // Icon-only variant (for compact tables)
  if (iconOnly) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        aria-label={displayText}
        title={displayText}
      >
        <Icon
          className={`w-4 h-4 ${config.text} ${
            status === 'uploading' ? 'animate-spin' : ''
          }`}
        />
      </span>
    );
  }

  // Full badge with optional icon and text
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${config.bg} ${config.text} ${className}`}
      aria-label={displayText}
    >
      {showIcon && (
        <Icon
          className={`w-4 h-4 ${status === 'uploading' ? 'animate-spin' : ''}`}
        />
      )}
      <span>{displayText}</span>
    </span>
  );
}
