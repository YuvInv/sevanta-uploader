import type { MatchType } from '../../../lib/types';

interface MatchBadgeProps {
  type: MatchType;
}

const badges: Record<
  MatchType,
  {
    bg: string;
    text: string;
    icon: JSX.Element;
    label: string;
  }
> = {
  strong: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    label: 'Strong',
  },
  possible: {
    bg: 'bg-caution-100',
    text: 'text-caution-700',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    label: 'Possible',
  },
  none: {
    bg: 'bg-warm-100',
    text: 'text-warm-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    label: 'None',
  },
};

export function MatchBadge({ type }: MatchBadgeProps) {
  const badge = badges[type];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1.5 rounded-lg
        text-sm font-medium
        ${badge.bg} ${badge.text}
      `}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}
