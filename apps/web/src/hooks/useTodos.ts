/**
 * React hook that encapsulates all state and business logic for the task list.
 * Components consume this hook and only handle rendering.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Todo } from 'shared';
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
   * Rolls back automatically if the PATCH fails.
   */
  toggleTodo: (todo: Todo) => Promise<void>;
  /**
   * Deletes a todo. Returns true on success, false on failure.
   * On failure the `error` state is set.
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

  const toggleTodo = useCallback(async (todo: Todo): Promise<void> => {
    if (inflightToggles.current.has(todo.id)) return;
    const previous = todo.done;
    // Optimistic update
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !previous } : t)));
    inflightToggles.current.add(todo.id);
    try {
      await api.updateTodo(todo.id, { done: !previous });
    } catch (err) {
      // Rollback
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: previous } : t)));
      setError((err as Error).message);
    } finally {
      inflightToggles.current.delete(todo.id);
    }
  }, []);

  const deleteTodo = useCallback(async (todo: Todo): Promise<boolean> => {
    try {
      await api.deleteTodo(todo.id);
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, []);

  return { todos, loading, error, reload, addTodo, toggleTodo, deleteTodo };
}
