import { useState } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { UserPicker } from './UserPicker';
import { TaskFilters } from './TaskFilters';
import { TaskTable } from './TaskTable';
import { TaskEditorModal } from './TaskEditorModal';
import { TaskCreateModal } from './TaskCreateModal';
import type { TaskItem } from '../../../lib/tasks';

interface TasksProps {
  connected: boolean;
}

export function Tasks({ connected }: TasksProps) {
  const {
    step,
    tasks,
    users,
    currentUserId,
    currentUserName,
    filters,
    objectNames,
    loading,
    error,
    selectUser,
    changeUser,
    fetchTasks,
    updateFilters,
    toggleTaskStatus,
    updateTask,
    createTask,
    searchDealsForTypeahead,
    searchContactsForTypeahead,
  } = useTaskManager();

  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!connected) {
    return (
      <div className="bg-gradient-to-r from-caution-50 to-warm-100 border border-caution-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-caution-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-caution-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-caution-800 mb-1">Not Connected</h3>
            <p className="text-caution-700 text-sm">
              Please log into{' '}
              <a
                href="https://run.mydealflow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-caution-900"
              >
                Sevanta Dealflow
              </a>{' '}
              first to manage tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User setup step
  if (step === 'user-setup') {
    return <UserPicker users={users} onSelect={selectUser} />;
  }

  // Error step
  if (step === 'error') {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-danger-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-danger-800 mb-1">Error</h3>
            <p className="text-danger-700 text-sm mb-3">{error || 'Something went wrong'}</p>
            <button
              onClick={fetchTasks}
              className="px-4 py-2 text-sm font-medium text-white bg-danger-500 rounded-xl hover:bg-danger-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading spinner
  if (step === 'loading' || (loading && tasks.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-accent-200 border-t-accent-500 rounded-full animate-spin mb-3" />
        <p className="text-base text-warm-500">Loading tasks...</p>
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-semibold text-warm-700">
            {currentUserName}
          </span>
          <button
            onClick={changeUser}
            className="text-xs text-accent-500 hover:text-accent-600 transition-colors"
          >
            (change)
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-1.5 text-warm-400 hover:text-warm-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-500 rounded-xl hover:bg-accent-600 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        users={users}
        currentUserId={currentUserId}
        onChange={updateFilters}
      />

      {/* Task Table */}
      <TaskTable
        tasks={tasks}
        objectNames={objectNames}
        onToggleStatus={toggleTaskStatus}
        onSelectTask={setEditingTask}
      />

      {/* Edit Modal */}
      {editingTask && (
        <TaskEditorModal
          task={editingTask}
          users={users}
          objectNames={objectNames}
          onSave={async (taskId, data) => {
            await updateTask(taskId, data);
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <TaskCreateModal
          users={users}
          currentUserId={currentUserId}
          onCreate={async (data) => {
            const result = await createTask(data);
            if (result.success) {
              setShowCreateModal(false);
            }
            return result;
          }}
          onClose={() => setShowCreateModal(false)}
          searchDeals={searchDealsForTypeahead}
          searchContacts={searchContactsForTypeahead}
        />
      )}
    </div>
  );
}
