import { useState } from 'react';
import type { CrmUser } from '../../../lib/tasks';

interface UserPickerProps {
  users: CrmUser[];
  onSelect: (userId: string) => void;
}

export function UserPicker({ users, onSelect }: UserPickerProps) {
  const [selectedId, setSelectedId] = useState('');

  return (
    <div className="bg-white rounded-2xl border border-warm-200 p-6 shadow-sm">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-accent-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-warm-800">Who are you?</h3>
        <p className="text-sm text-warm-500 mt-1">Select your name to see your tasks</p>
      </div>

      <div className="space-y-3">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border-2 border-warm-200 rounded-xl px-4 py-3 text-base bg-white focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all duration-200"
        >
          <option value="">-- Select your name --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.id})
            </option>
          ))}
        </select>

        <button
          onClick={() => selectedId && onSelect(selectedId)}
          disabled={!selectedId}
          className="w-full px-5 py-3 text-base font-medium text-white bg-accent-500 rounded-xl hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
