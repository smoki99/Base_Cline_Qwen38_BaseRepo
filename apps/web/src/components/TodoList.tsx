import { useCallback, useEffect, useRef, useState } from 'react';
import { isApiError } from 'shared';
import type { ApiResult, CreateTodo, Todo, UpdateTodo } from 'shared';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function TodoList() {
  const apiBase = import.meta.env.VITE_API_URL ?? '';
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightToggles = useRef<Set<number>>(new Set());

  function showToast(message: string, type: Toast['type']) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/todos`);
      const json = (await res.json()) as ApiResult<Todo[]>;
      if (isApiError(json)) throw new Error(json.error.message);
      if (!res.ok || !Array.isArray(json.data))
        throw new Error(`Request failed with status ${res.status}`);
      setTodos(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void load();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [load]);

  async function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const body: CreateTodo = { title: trimmed };
      const res = await fetch(`${apiBase}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ApiResult<Todo>;
      if (isApiError(json)) throw new Error(json.error.message);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      setTodos((prev) => [...prev, json.data]);
      setTitle('');
      showToast('Todo hinzugefügt', 'success');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleToggle(todo: Todo) {
    if (inflightToggles.current.has(todo.id)) return;
    const previous = todo.done;
    const payload: UpdateTodo = { done: !previous };
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !previous } : t)));
    inflightToggles.current.add(todo.id);
    try {
      const res = await fetch(`${apiBase}/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    } catch (err) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: previous } : t)));
      setError((err as Error).message);
    } finally {
      inflightToggles.current.delete(todo.id);
    }
  }

  async function handleDelete(todo: Todo) {
    try {
      const res = await fetch(`${apiBase}/api/todos/${todo.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
      showToast('Todo gelöscht', 'success');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // --- Loading Skeleton ---
  if (loading) {
    return (
      <div
        className="skeleton-container"
        data-testid="skeleton"
        aria-busy="true"
        aria-label="Lädt…"
      >
        <div className="skeleton-bar" style={{ width: '60%' }} />
        <div className="skeleton-bar" style={{ width: '80%' }} />
        <div className="skeleton-bar" style={{ width: '45%' }} />
      </div>
    );
  }

  // --- Error State with Retry ---
  if (error && todos.length === 0) {
    return (
      <div className="error-state text-center" data-testid="error-state" role="alert">
        <div className="error-icon">⚠️</div>
        <p className="mb-2">{error}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void load()}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`toast-md toast-${toast.type}`} role="status" data-testid="toast">
          <span className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      {error && todos.length > 0 && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          {error}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      )}

      <form
        className="todo-add d-flex gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          void handleAdd();
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="New todo…"
          aria-label="New todo title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={title.trim() === ''}>
          Add
        </button>
      </form>

      {todos.length === 0 ? (
        <div className="empty-state text-center" data-testid="empty-state">
          <div className="empty-icon">📝</div>
          <p className="mb-0">Keine Todos – füge eine hinzu!</p>
        </div>
      ) : (
        <ul className="list-group" data-testid="todo-list">
          {todos.map((todo) => (
            <li
              key={todo.id}
              data-testid={`todo-${todo.id}`}
              className={`list-group-item d-flex align-items-center gap-2 ${todo.done ? 'is-done' : ''}`}
            >
              <input
                type="checkbox"
                className="form-check-input"
                checked={todo.done}
                aria-label={`Toggle ${todo.title}`}
                onChange={() => void handleToggle(todo)}
              />
              <span className={todo.done ? 'todo-title done' : 'todo-title'}>{todo.title}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-auto"
                aria-label={`Delete ${todo.title}`}
                onClick={() => void handleDelete(todo)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
