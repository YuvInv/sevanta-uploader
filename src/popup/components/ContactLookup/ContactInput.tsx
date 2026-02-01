import { useState, useCallback } from 'react';
import type { LookupContact } from '../../../lib/types';

interface ContactInputProps {
  onParse: (text: string) => LookupContact[];
  onLookup: () => void;
  parsedCount: number;
  disabled?: boolean;
}

export function ContactInput({ onParse, onLookup, parsedCount, disabled }: ContactInputProps) {
  const [text, setText] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setText(value);
      onParse(value);
    },
    [onParse]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Cmd/Ctrl + Enter to start lookup
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && parsedCount > 0 && !disabled) {
        e.preventDefault();
        onLookup();
      }
    },
    [onLookup, parsedCount, disabled]
  );

  return (
    <div className="space-y-4">
      {/* Header with icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-accent-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-warm-800 font-display">Paste Your Contacts</h2>
          <p className="text-sm text-warm-500">One contact per line - name and email</p>
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="
            w-full h-48 p-4
            bg-warm-50 border-2 border-warm-200
            rounded-xl text-base text-warm-700
            placeholder:text-warm-400
            focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10
            focus:outline-none
            transition-all duration-200
            resize-none
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          placeholder={`John Smith    john@acme.com
Jane Doe <jane@startup.io>
bob@corp.com`}
        />

        {/* Live counter - bottom right */}
        <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white rounded-full shadow-sm border border-warm-200">
          <span className="text-sm font-medium text-warm-600">
            {parsedCount} contact{parsedCount !== 1 ? 's' : ''} parsed
          </span>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-warm-500">
          Accepts: tab-separated, CSV, or Name &lt;email&gt; format
        </p>
        <button
          onClick={onLookup}
          disabled={parsedCount === 0 || disabled}
          className="
            px-6 py-3
            bg-accent-500 hover:bg-accent-600
            text-white font-semibold text-base
            rounded-xl shadow-sm
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm
          "
        >
          Look Up Contacts
        </button>
      </div>
    </div>
  );
}
