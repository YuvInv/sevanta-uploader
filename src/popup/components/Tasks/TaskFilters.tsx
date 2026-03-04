import type { CrmUser, TaskFilters as TaskFiltersType } from '../../../lib/tasks';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  users: CrmUser[];
  currentUserId: string | null;
  onChange: (filters: Partial<TaskFiltersType>) => void;
}

const STATUS_OPTIONS = [
  { id: 0, label: 'Pending' },
  { id: 1, label: 'Completed' },
  { id: 2, label: 'Cancelled' },
];

export function TaskFilters({ filters, users, currentUserId, onChange }: TaskFiltersProps) {
  const toggleStatus = (statusId: number) => {
    const current = filters.status;
    if (current.includes(statusId)) {
      // Don't allow empty selection
      if (current.length <= 1) return;
      onChange({ status: current.filter((s) => s !== statusId) });
    } else {
      onChange({ status: [...current, statusId] });
    }
  };

  return (
    <div className="space-y-2">
      {/* Status toggles */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-warm-500 w-12 shrink-0">Status</span>
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => toggleStatus(opt.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                filters.status.includes(opt.id)
                  ? opt.id === 0
                    ? 'bg-accent-100 text-accent-700 ring-1 ring-accent-300'
                    : opt.id === 1
                      ? 'bg-success-100 text-success-700 ring-1 ring-success-300'
                      : 'bg-warm-200 text-warm-600 ring-1 ring-warm-300'
                  : 'bg-warm-100 text-warm-400 hover:bg-warm-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignee + Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-warm-500 w-12 shrink-0">Filter</span>
        <select
          value={filters.assignee || ''}
          onChange={(e) => onChange({ assignee: e.target.value || null })}
          className="flex-1 border border-warm-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-all"
        >
          <option value="">All users</option>
          {currentUserId && <option value={currentUserId}>My tasks</option>}
          {users
            .filter((u) => u.id !== currentUserId)
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value as 'deadline' | 'created' })}
          className="border border-warm-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-all"
        >
          <option value="deadline">Sort: Deadline</option>
          <option value="created">Sort: Created</option>
        </select>
      </div>
    </div>
  );
}
