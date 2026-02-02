export type AppMode = 'upload' | 'lookup';

interface TabNavProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function TabNav({ mode, onModeChange }: TabNavProps) {
  return (
    <nav className="flex gap-1 p-1 bg-warm-100 rounded-xl">
      <button
        onClick={() => onModeChange('upload')}
        className={`
          flex-1 px-4 py-2.5 rounded-lg text-base font-medium
          transition-all duration-200
          ${
            mode === 'upload'
              ? 'bg-white text-warm-800 shadow-sm'
              : 'text-warm-500 hover:text-warm-700 hover:bg-warm-50'
          }
        `}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload Companies
        </span>
      </button>
      <button
        onClick={() => onModeChange('lookup')}
        className={`
          flex-1 px-4 py-2.5 rounded-lg text-base font-medium
          transition-all duration-200
          ${
            mode === 'lookup'
              ? 'bg-white text-warm-800 shadow-sm'
              : 'text-warm-500 hover:text-warm-700 hover:bg-warm-50'
          }
        `}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Contact Lookup
        </span>
      </button>
    </nav>
  );
}
