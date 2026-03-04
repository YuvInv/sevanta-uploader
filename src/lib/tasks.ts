// Task types and utilities for CRM task management

export type TaskStatus = 'Pending' | 'Completed' | 'Cancelled';
export type TaskType = 'Normal' | 'Urgent' | 'Meeting';

export interface CrmUser {
  id: string;
  name: string;
}

// Raw API response shape (labels as keys)
export interface CrmTask {
  TaskID: number;
  For: string;
  Assignees: string;
  'Created By': string;
  ObjectID: number;
  'Date Created': string;
  'Date Last Modified': string;
  'Last Modified By': string;
  Task: string;
  Status: string;
  Type: string;
  Deadline: string;
  Reminder: string;
  record_link: string;
}

// Enriched task for UI display
export interface TaskItem {
  id: number;
  description: string;
  status: TaskStatus;
  statusId: number;
  type: TaskType;
  assignee: string;
  assigneeId: string;
  createdBy: string;
  objectId: number;
  objectName?: string;
  objectType?: 'deal' | 'contact';
  deadline?: Date;
  deadlineRaw?: string;
  reminder?: string;
  dateCreated?: Date;
  dateCreatedRaw?: string;
  recordLink: string;
}

export interface TaskFilters {
  status: number[];
  assignee: string | null;
  sortBy: 'deadline' | 'created';
}

export interface TaskFormData {
  TaskDescription: string;
  TaskStatusID?: string;
  TaskTypeID?: string;
  AssignedUserID?: string;
  DateDeadline?: string;
  DateReminder?: string;
  CompanyID?: string;
  ContactID?: string;
}

// Status ID mappings
export const STATUS_ID_MAP: Record<TaskStatus, number> = {
  Pending: 0,
  Completed: 1,
  Cancelled: 2,
};

export const STATUS_LABEL_MAP: Record<number, TaskStatus> = {
  0: 'Pending',
  1: 'Completed',
  2: 'Cancelled',
};

// Type ID mappings
export const TYPE_ID_MAP: Record<string, string> = {
  Normal: '0',
  Urgent: '1',
  Meeting: '2',
};

export const TYPE_LABEL_MAP: Record<string, TaskType> = {
  Normal: 'Normal',
  Urgent: 'Urgent',
  Meeting: 'Meeting',
};

// Parse CRM date format "dd-mm-yyyy" to Date
export function parseCrmDate(str: string): Date | undefined {
  if (!str) return undefined;
  // Handle "dd-mm-yyyy" or "dd-mm-yyyy hh:mm"
  const parts = str.split(/[-/ ]/);
  if (parts.length < 3) return undefined;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
  return new Date(year, month, day);
}

// Format Date to CRM format "dd-mm-yyyy"
export function formatCrmDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Get relative deadline display with color
export function getDeadlineDisplay(str: string): { text: string; color: string } | null {
  if (!str) return null;
  const date = parseCrmDate(str);
  if (!date) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = deadlineDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-danger-600' };
  }
  if (diffDays === 0) {
    return { text: 'Today', color: 'text-caution-600' };
  }
  if (diffDays <= 7) {
    return { text: `${diffDays}d`, color: 'text-caution-600' };
  }
  if (diffDays <= 30) {
    return { text: `${diffDays}d`, color: 'text-warm-600' };
  }
  return { text: `${diffDays}d`, color: 'text-warm-500' };
}

// Transform raw CRM task to enriched TaskItem
export function transformTask(raw: CrmTask, users: CrmUser[]): TaskItem {
  const statusMap: Record<string, TaskStatus> = {
    Pending: 'Pending',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
  };

  const typeMap: Record<string, TaskType> = {
    Normal: 'Normal',
    Urgent: 'Urgent',
    Meeting: 'Meeting',
  };

  // Find assignee user ID from the "For" field (display name)
  const assigneeUser = users.find((u) => u.name === raw.For);
  const statusId = raw.Status === 'Completed' ? 1 : raw.Status === 'Cancelled' ? 2 : 0;

  return {
    id: raw.TaskID,
    description: raw.Task || '',
    status: statusMap[raw.Status] || 'Pending',
    statusId,
    type: typeMap[raw.Type] || 'Normal',
    assignee: raw.For || '',
    assigneeId: assigneeUser?.id || '',
    createdBy: raw['Created By'] || '',
    objectId: raw.ObjectID || 0,
    deadline: parseCrmDate(raw.Deadline),
    deadlineRaw: raw.Deadline || undefined,
    reminder: raw.Reminder || undefined,
    dateCreated: parseCrmDate(raw['Date Created']),
    dateCreatedRaw: raw['Date Created'] || undefined,
    recordLink: raw.record_link || '',
  };
}
