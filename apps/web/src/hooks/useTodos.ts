/**
 * React hook that encapsulates all state and business logic for the task list.
 * Components consume this hook and only handle rendering.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Todo } from 'shared';
import { ConflictError } from '../lib/api';
import * as api from '../lib/api';

export interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  /** Re-fetch the todo list from the API. */
  reload: () => Promise<void>;
  /**
   * Adds a new item. Returns the created item on success, null on failure.
   * On failure the `error` state is set.
   */
  addTodo: (title: string) => Promise<Todo | null>;
  /**
   * Toggles the done-state of a todo with an optimistic update.
   * On 2xx the local entity is replaced by the canonical server response.
   * On 412 (stale rev) the list is reloaded and the conflict surfaced –
   * no silent rollback to the pre-click snapshot.
   */
  toggleTodo: (todo: Todo) => Promise<void>;
  /**
   * Deletes a todo. Returns true on success, false on failure.
   * On 412 (stale rev) the list is reloaded and the conflict surfaced.
   */
  deleteTodo: (todo: Todo) => Promise<boolean>;
}

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inflightToggles = useRef<Set<number>>(new Set());

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchTodos();
      setTodos(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addTodo = useCallback(async (title: string): Promise<Todo | null> => {
    const trimmed = title.trim();
    if (!trimmed) return null;
    try {
      const todo = await api.addTodo(trimmed);
      setTodos((prev) => [...prev, todo]);
      return todo;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, []);

  const toggleTodo = useCallback(
    async (todo: Todo): Promise<void> => {
      if (inflightToggles.current.has(todo.id)) return;
      const previous = todo.done;
      // Optimistic update
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !previous } : t)));
      inflightToggles.current.add(todo.id);
      try {
        const updated = await api.updateTodo(todo.id, todo.rev, { done: !previous });
        // Server response is canonical: replace the local entity (fresh rev,
        // trimmed title, ...) instead of only patching `done`.
        setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } catch (err) {
        if (err instanceof ConflictError) {
          // 412: the entity changed on the server. Reload the canonical list
          // and surface the conflict – no rollback to the stale snapshot.
          await reload();
          setError((err as Error).message);
        } else {
          // Other failures: the change was not applied – roll back.
          setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: previous } : t)));
          setError((err as Error).message);
        }
      } finally {
        inflightToggles.current.delete(todo.id);
      }
    },
    [reload]
  );

  const deleteTodo = useCallback(
    async (todo: Todo): Promise<boolean> => {
      try {
        await api.deleteTodo(todo.id, todo.rev);
        setTodos((prev) => prev.filter((t) => t.id !== todo.id));
        return true;
      } catch (err) {
        if (err instanceof ConflictError) {
          // 412: the entity changed on the server – reload instead of trusting
          // the local state, and surface the conflict.
          await reload();
        }
        setError((err as Error).message);
        return false;
      }
    },
    [reload]
  );

  return { todos, loading, error, reload, addTodo, toggleTodo, deleteTodo };
}
