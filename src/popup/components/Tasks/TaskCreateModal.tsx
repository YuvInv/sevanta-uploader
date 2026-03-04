import { useState, useCallback, useRef, useEffect } from 'react';
import type { CrmUser } from '../../../lib/tasks';
import { formatCrmDate } from '../../../lib/tasks';
import type { Deal } from '../../../lib/types';
import type { SearchedContact } from '../../../lib/api';
import { TASK_TYPEAHEAD_DEBOUNCE_MS } from '../../../lib/constants';

interface TaskCreateModalProps {
  users: CrmUser[];
  currentUserId: string | null;
  onCreate: (data: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  searchDeals: (text: string) => Promise<Deal[]>;
  searchContacts: (text: string) => Promise<SearchedContact[]>;
}

type LinkType = 'none' | 'deal' | 'contact';

interface SelectedLink {
  id: string;
  name: string;
  type: LinkType;
}

export function TaskCreateModal({
  users,
  currentUserId,
  onCreate,
  onClose,
  searchDeals,
  searchContacts,
}: TaskCreateModalProps) {
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState('0');
  const [typeId, setTypeId] = useState('0');
  const [assignee, setAssignee] = useState(currentUserId || '');
  const [deadline, setDeadline] = useState('');
  const [reminder, setReminder] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('none');
  const [selectedLink, setSelectedLink] = useState<SelectedLink | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  const handleSearchInput = useCallback(
    (text: string) => {
      setSearchText(text);
      setSearchResults([]);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.length < 2) return;

      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          if (linkType === 'deal') {
            const deals = await searchDeals(text);
            setSearchResults(deals.map((d) => ({ id: d.id || '', name: d.CompanyName })));
          } else if (linkType === 'contact') {
            const contacts = await searchContacts(text);
            setSearchResults(contacts.map((c) => ({ id: c.contactId, name: c.name })));
          }
        } catch {
          // Ignore search errors
        }
        setSearching(false);
      }, TASK_TYPEAHEAD_DEBOUNCE_MS);
    },
    [linkType, searchDeals, searchContacts]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleLinkTypeChange = (newType: LinkType) => {
    setLinkType(newType);
    setSelectedLink(null);
    setSearchText('');
    setSearchResults([]);
  };

  const handleSelectResult = (result: { id: string; name: string }) => {
    setSelectedLink({ id: result.id, name: result.name, type: linkType });
    setSearchText('');
    setSearchResults([]);
  };

  const handleCreate = async () => {
    if (!description.trim()) return;

    setCreating(true);
    setError(null);

    const data: Record<string, string> = {};
    data.TaskDescription = description.trim();
    data.TaskStatusID = statusId;
    data.TaskTypeID = typeId;
    if (assignee) data.AssignedUserID = assignee;
    if (deadline) {
      data.DateDeadline = formatCrmDate(new Date(deadline));
    }
    if (reminder) {
      data.DateReminder = formatCrmDate(new Date(reminder));
    }
    if (selectedLink) {
      if (selectedLink.type === 'deal') {
        data.CompanyID = selectedLink.id;
      } else if (selectedLink.type === 'contact') {
        data.ContactID = selectedLink.id;
      }
    }

    const result = await onCreate(data);
    if (!result.success) {
      setError(result.error || 'Failed to create task');
    }
    setCreating(false);
  };

  const inputClass =
    'w-full border-2 border-warm-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all duration-200';

  return (
    <div className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-800">New Task</h2>
          <button
            onClick={onClose}
            className="text-warm-400 hover:text-warm-600 p-1 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-xl p-3 text-sm text-danger-700">
              {error}
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-warm-700">
              Task Description <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          {/* Link to */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-warm-700">Link to</label>
            <div className="flex gap-2">
              {(['none', 'deal', 'contact'] as LinkType[]).map((lt) => (
                <button
                  key={lt}
                  onClick={() => handleLinkTypeChange(lt)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    linkType === lt
                      ? 'bg-accent-100 text-accent-700 ring-1 ring-accent-300'
                      : 'bg-warm-100 text-warm-500 hover:bg-warm-200'
                  }`}
                >
                  {lt === 'none' ? 'None' : lt === 'deal' ? 'Deal' : 'Contact'}
                </button>
              ))}
            </div>

            {/* Type-ahead search */}
            {linkType !== 'none' && !selectedLink && (
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className={inputClass}
                  placeholder={`Search ${linkType === 'deal' ? 'deals' : 'contacts'}...`}
                />
                {searching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="w-4 h-4 border-2 border-warm-300 border-t-accent-500 rounded-full animate-spin" />
                  </div>
                )}

                {/* Dropdown results */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-warm-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectResult(r)}
                        className="w-full text-left px-3 py-2 text-sm text-warm-700 hover:bg-accent-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {r.name}
                        <span className="text-warm-400 text-xs ml-1">#{r.id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selected link display */}
            {selectedLink && (
              <div className="flex items-center gap-2 bg-accent-50 border border-accent-200 rounded-xl px-3 py-2">
                <span className="text-sm text-accent-700 flex-1">{selectedLink.name}</span>
                <button
                  onClick={() => {
                    setSelectedLink(null);
                    setSearchText('');
                  }}
                  className="text-accent-400 hover:text-accent-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-warm-700">Status</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className={inputClass}
              >
                <option value="0">Pending</option>
                <option value="1">Completed</option>
                <option value="2">Cancelled</option>
              </select>
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-warm-700">Type</label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className={inputClass}
              >
                <option value="0">Normal</option>
                <option value="1">Urgent</option>
                <option value="2">Meeting</option>
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-warm-700">Assigned To</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Select --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Deadline */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-warm-700">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Reminder */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-warm-700">Reminder</label>
              <input
                type="date"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-warm-200 bg-warm-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-warm-700 bg-white border border-warm-200 rounded-xl hover:bg-warm-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!description.trim() || creating}
            className="px-5 py-2.5 text-sm font-medium text-white bg-accent-500 rounded-xl hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
