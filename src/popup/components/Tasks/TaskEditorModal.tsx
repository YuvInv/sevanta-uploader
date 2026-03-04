import { useState, useMemo } from 'react';
import type { TaskItem, CrmUser } from '../../../lib/tasks';
import { formatCrmDate, parseCrmDate } from '../../../lib/tasks';

interface TaskEditorModalProps {
  task: TaskItem;
  users: CrmUser[];
  objectNames: Record<number, { name: string; type: 'deal' | 'contact' }>;
  onSave: (taskId: number, data: Record<string, string>) => Promise<void>;
  onClose: () => void;
}

export function TaskEditorModal({
  task,
  users,
  objectNames,
  onSave,
  onClose,
}: TaskEditorModalProps) {
  const [description, setDescription] = useState(task.description);
  const [statusId, setStatusId] = useState(task.statusId.toString());
  const [typeId, setTypeId] = useState(
    task.type === 'Normal' ? '0' : task.type === 'Urgent' ? '1' : '2'
  );
  const [assignee, setAssignee] = useState(task.assigneeId);
  const [deadline, setDeadline] = useState(() => {
    if (task.deadlineRaw) {
      const d = parseCrmDate(task.deadlineRaw);
      if (d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    return '';
  });
  const [reminder, setReminder] = useState(() => {
    if (task.reminder) {
      const d = parseCrmDate(task.reminder);
      if (d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    return '';
  });
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    if (description !== task.description) return true;
    if (statusId !== task.statusId.toString()) return true;
    const origTypeId = task.type === 'Normal' ? '0' : task.type === 'Urgent' ? '1' : '2';
    if (typeId !== origTypeId) return true;
    if (assignee !== task.assigneeId) return true;
    // Compare deadlines
    const origDeadline = task.deadlineRaw
      ? (() => {
          const d = parseCrmDate(task.deadlineRaw);
          if (d) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
          return '';
        })()
      : '';
    if (deadline !== origDeadline) return true;
    const origReminder = task.reminder
      ? (() => {
          const d = parseCrmDate(task.reminder);
          if (d) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
          return '';
        })()
      : '';
    if (reminder !== origReminder) return true;
    return false;
  }, [description, statusId, typeId, assignee, deadline, reminder, task]);

  const handleSave = async () => {
    setSaving(true);
    const data: Record<string, string> = {};
    data.TaskDescription = description;
    data.TaskStatusID = statusId;
    data.TaskTypeID = typeId;
    if (assignee) data.AssignedUserID = assignee;
    if (deadline) {
      const d = new Date(deadline);
      data.DateDeadline = formatCrmDate(d);
    }
    if (reminder) {
      const d = new Date(reminder);
      data.DateReminder = formatCrmDate(d);
    }
    await onSave(task.id, data);
    setSaving(false);
  };

  const obj = task.objectId > 0 ? objectNames[task.objectId] : null;
  const getCrmLink = (objectId: number, type: 'deal' | 'contact') => {
    if (type === 'contact') {
      return `https://run.mydealflow.com/inv/#/Contact.php?ContactID=${objectId}`;
    }
    return `https://run.mydealflow.com/inv/#/Company.php?CompanyID=${objectId}`;
  };

  const inputClass =
    'w-full border-2 border-warm-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all duration-200';

  return (
    <div className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-800">Edit Task</h2>
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
          {/* Linked object (read-only) */}
          {obj && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-warm-700">
                Linked {obj.type === 'contact' ? 'Contact' : 'Deal'}
              </label>
              <a
                href={getCrmLink(task.objectId, obj.type)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent-600 hover:text-accent-700 hover:underline"
              >
                {obj.name}
              </a>
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
            />
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
            onClick={handleSave}
            disabled={!hasChanges || saving || !description.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-accent-500 rounded-xl hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
