import type { TaskItem } from '../../../lib/tasks';
import { getDeadlineDisplay } from '../../../lib/tasks';
import { TaskTypeDot } from './TaskTypeDot';

interface TaskTableProps {
  tasks: TaskItem[];
  objectNames: Record<number, { name: string; type: 'deal' | 'contact' }>;
  onToggleStatus: (taskId: number, newStatusId: number) => void;
  onSelectTask: (task: TaskItem) => void;
}

export function TaskTable({ tasks, objectNames, onToggleStatus, onSelectTask }: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-warm-500">
        <svg
          className="w-14 h-14 mx-auto mb-3 text-warm-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-sm">No tasks match your filters</p>
      </div>
    );
  }

  const getCrmLink = (objectId: number, type: 'deal' | 'contact') => {
    if (type === 'contact') {
      return `https://run.mydealflow.com/inv/#/Contact.php?ContactID=${objectId}`;
    }
    return `https://run.mydealflow.com/inv/#/Company.php?CompanyID=${objectId}`;
  };

  return (
    <div>
      <p className="text-sm text-warm-500 mb-2">
        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-warm-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-50 border-b border-warm-200">
              <th className="w-8 px-2 py-3"></th>
              <th className="text-left px-4 py-3 font-semibold text-warm-600">Object</th>
              <th className="text-left px-4 py-3 font-semibold text-warm-600">Task</th>
              <th className="w-8 px-2 py-3"></th>
              <th className="text-left px-4 py-3 font-semibold text-warm-600">For</th>
              <th className="text-left px-4 py-3 font-semibold text-warm-600">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const deadlineDisplay = task.deadlineRaw
                ? getDeadlineDisplay(task.deadlineRaw)
                : null;
              const obj = task.objectId > 0 ? objectNames[task.objectId] : null;
              const isCompleted = task.statusId === 1;

              return (
                <tr
                  key={task.id}
                  className={`border-b border-warm-100 hover:bg-warm-50 cursor-pointer transition-colors ${isCompleted ? 'opacity-60' : ''}`}
                  onClick={() => onSelectTask(task)}
                >
                  {/* Status checkbox */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(task.id, isCompleted ? 0 : 1);
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-success-500 border-success-500 text-white'
                          : 'border-warm-300 hover:border-accent-400'
                      }`}
                      title={isCompleted ? 'Mark pending' : 'Mark complete'}
                    >
                      {isCompleted && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  </td>

                  {/* Object name + CRM link */}
                  <td className="px-4 py-3">
                    {task.objectId > 0 ? (
                      obj ? (
                        <a
                          href={getCrmLink(task.objectId, obj.type)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-accent-600 hover:text-accent-700 hover:underline text-sm font-medium truncate block max-w-[120px]"
                          title={obj.name}
                        >
                          {obj.name}
                        </a>
                      ) : (
                        <span className="inline-block w-16 h-3 bg-warm-200 rounded animate-pulse" />
                      )
                    ) : (
                      <span className="text-warm-400 text-sm">--</span>
                    )}
                  </td>

                  {/* Task description */}
                  <td className="px-4 py-3">
                    <span
                      className={`text-warm-800 text-sm block truncate max-w-[200px] ${isCompleted ? 'line-through' : ''}`}
                      title={task.description}
                    >
                      {task.description}
                    </span>
                  </td>

                  {/* Type dot */}
                  <td className="px-2 py-3 text-center">
                    <TaskTypeDot type={task.type} />
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3">
                    <span
                      className="text-warm-600 text-sm truncate block max-w-[80px]"
                      title={task.assignee}
                    >
                      {task.assignee}
                    </span>
                  </td>

                  {/* Deadline */}
                  <td className="px-4 py-3">
                    {deadlineDisplay ? (
                      <span className={`text-sm font-medium ${deadlineDisplay.color}`}>
                        {deadlineDisplay.text}
                      </span>
                    ) : (
                      <span className="text-warm-400 text-sm">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
