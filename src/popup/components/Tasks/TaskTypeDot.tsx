import type { TaskType } from '../../../lib/tasks';

const TYPE_COLORS: Record<TaskType, string> = {
  Normal: 'bg-warm-400',
  Urgent: 'bg-danger-500',
  Meeting: 'bg-accent-500',
};

interface TaskTypeDotProps {
  type: TaskType;
}

export function TaskTypeDot({ type }: TaskTypeDotProps) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${TYPE_COLORS[type] || 'bg-warm-400'}`}
      title={type}
    />
  );
}
