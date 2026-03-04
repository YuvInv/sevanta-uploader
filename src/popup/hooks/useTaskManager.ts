import { useState, useCallback, useMemo, useEffect } from 'react';
import type { MessageResponse } from '../../lib/types';
import type { Deal } from '../../lib/types';
import type { SearchedContact } from '../../lib/api';
import type { CrmTask, CrmUser, TaskItem, TaskFilters } from '../../lib/tasks';
import { transformTask } from '../../lib/tasks';
import { OBJECT_NAME_BATCH_SIZE } from '../../lib/constants';

export type TaskStep = 'user-setup' | 'loading' | 'list' | 'error';

export function useTaskManager() {
  const [step, setStep] = useState<TaskStep>('loading');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [filters, setFilters] = useState<TaskFilters>({
    status: [0], // Pending by default
    assignee: null, // Will be set to current user after selection
    sortBy: 'deadline',
  });
  const [objectNames, setObjectNames] = useState<
    Record<number, { name: string; type: 'deal' | 'contact' }>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: check for saved user ID and load users
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        // Load users first
        const usersResp = (await chrome.runtime.sendMessage({
          type: 'LIST_USERS',
        })) as MessageResponse<CrmUser[]>;

        if (!mounted) return;

        if (!usersResp.success || !usersResp.data) {
          setError(usersResp.error || 'Failed to load users');
          setStep('error');
          return;
        }

        setUsers(usersResp.data);

        // Check for saved user
        const stored = await chrome.storage.local.get('taskUserId');
        if (!mounted) return;

        if (stored.taskUserId) {
          const user = usersResp.data.find((u) => u.id === stored.taskUserId);
          if (user) {
            setCurrentUserId(user.id);
            setCurrentUserName(user.name);
            setFilters((prev) => ({ ...prev, assignee: user.id }));
            setStep('loading');
            // Fetch tasks will be triggered by the effect below
            return;
          }
        }

        // No saved user — show picker
        setStep('user-setup');
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Initialization failed');
          setStep('error');
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch tasks when currentUserId or filters change
  useEffect(() => {
    if (!currentUserId) return;
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, filters.status, filters.assignee]);

  const resolveObjectNames = useCallback(async (taskList: TaskItem[]) => {
    // Collect unique non-zero ObjectIDs that we haven't resolved yet
    const uniqueIds = [...new Set(taskList.map((t) => t.objectId).filter((id) => id > 0))];
    if (uniqueIds.length === 0) return;

    // Process in batches
    for (let i = 0; i < uniqueIds.length; i += OBJECT_NAME_BATCH_SIZE) {
      const batch = uniqueIds.slice(i, i + OBJECT_NAME_BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (objectId) => {
          const idStr = objectId.toString();

          // Try deal first
          const dealResp = (await chrome.runtime.sendMessage({
            type: 'GET_DEAL_NAME',
            dealId: idStr,
          })) as MessageResponse<{ id: string; name: string } | null>;

          if (dealResp.success && dealResp.data?.name) {
            return { objectId, name: dealResp.data.name, type: 'deal' as const };
          }

          // Try contact
          const contactResp = (await chrome.runtime.sendMessage({
            type: 'GET_CONTACT_NAME',
            contactId: idStr,
          })) as MessageResponse<{ id: string; name: string } | null>;

          if (contactResp.success && contactResp.data?.name) {
            return { objectId, name: contactResp.data.name, type: 'contact' as const };
          }

          return { objectId, name: `#${idStr}`, type: 'deal' as const };
        })
      );

      // Progressive update
      setObjectNames((prev) => {
        const updated = { ...prev };
        for (const r of results) {
          updated[r.objectId] = { name: r.name, type: r.type };
        }
        return updated;
      });
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resp = (await chrome.runtime.sendMessage({
        type: 'LIST_TASKS',
        statusIds: filters.status,
        assignee: filters.assignee || undefined,
      })) as MessageResponse<CrmTask[]>;

      if (!resp.success || !resp.data) {
        setError(resp.error || 'Failed to load tasks');
        setStep('error');
        setLoading(false);
        return;
      }

      const transformed = resp.data.map((t) => transformTask(t, users));
      setTasks(transformed);
      setStep('list');
      setLoading(false);

      // Resolve object names
      resolveObjectNames(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      setStep('error');
      setLoading(false);
    }
  }, [filters.status, filters.assignee, users, resolveObjectNames]);

  const selectUser = useCallback(
    async (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      setCurrentUserId(userId);
      setCurrentUserName(user.name);
      setFilters((prev) => ({ ...prev, assignee: userId }));
      await chrome.storage.local.set({ taskUserId: userId });
      setStep('loading');
    },
    [users]
  );

  const changeUser = useCallback(() => {
    setStep('user-setup');
  }, []);

  const updateFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const toggleTaskStatus = useCallback(async (taskId: number, newStatusId: number) => {
    const resp = (await chrome.runtime.sendMessage({
      type: 'UPDATE_TASK',
      taskId,
      data: { TaskStatusID: newStatusId.toString() },
    })) as MessageResponse<{ success: boolean }>;

    if (resp.success) {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const statusLabel =
              newStatusId === 0 ? 'Pending' : newStatusId === 1 ? 'Completed' : 'Cancelled';
            return { ...t, statusId: newStatusId, status: statusLabel as TaskItem['status'] };
          }
          return t;
        })
      );
    }

    return resp.success;
  }, []);

  const updateTaskFull = useCallback(
    async (taskId: number, data: Record<string, string>) => {
      const resp = (await chrome.runtime.sendMessage({
        type: 'UPDATE_TASK',
        taskId,
        data,
      })) as MessageResponse<{ success: boolean }>;

      if (resp.success) {
        // Refresh tasks list
        await fetchTasks();
      }

      return resp.success;
    },
    [fetchTasks]
  );

  const createNewTask = useCallback(
    async (data: Record<string, string>) => {
      const resp = (await chrome.runtime.sendMessage({
        type: 'CREATE_TASK',
        data,
      })) as MessageResponse<{ taskId?: string }>;

      if (resp.success) {
        await fetchTasks();
      }

      return { success: resp.success, taskId: resp.data?.taskId, error: resp.error };
    },
    [fetchTasks]
  );

  const searchDealsForTypeahead = useCallback(async (text: string): Promise<Deal[]> => {
    const resp = (await chrome.runtime.sendMessage({
      type: 'SEARCH_DEALS_BY_TEXT',
      searchText: text,
    })) as MessageResponse<Deal[]>;

    return resp.success && resp.data ? resp.data : [];
  }, []);

  const searchContactsForTypeahead = useCallback(
    async (text: string): Promise<SearchedContact[]> => {
      const resp = (await chrome.runtime.sendMessage({
        type: 'SEARCH_CONTACTS',
        name: text,
      })) as MessageResponse<SearchedContact[]>;

      return resp.success && resp.data ? resp.data : [];
    },
    []
  );

  // Sorted/filtered task list
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    sorted.sort((a, b) => {
      if (filters.sortBy === 'deadline') {
        // Tasks without deadline go to the end
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.getTime() - b.deadline.getTime();
      }
      // Sort by created date (newest first)
      if (!a.dateCreated && !b.dateCreated) return 0;
      if (!a.dateCreated) return 1;
      if (!b.dateCreated) return -1;
      return b.dateCreated.getTime() - a.dateCreated.getTime();
    });
    return sorted;
  }, [tasks, filters.sortBy]);

  return {
    step,
    tasks: sortedTasks,
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
    updateTask: updateTaskFull,
    createTask: createNewTask,
    searchDealsForTypeahead,
    searchContactsForTypeahead,
  };
}
