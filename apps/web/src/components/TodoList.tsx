import { useRef, useState } from 'react';
import { useTodos } from '../hooks/useTodos';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function TodoList() {
  const { todos, loading, error, reload, addTodo, toggleTodo, deleteTodo } = useTodos();
  const [title, setTitle] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: Toast['type']) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  async function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const result = await addTodo(trimmed);
    if (result) {
      setTitle('');
      showToast('Todo hinzugefügt', 'success');
    }
  }

  async function handleDelete(todo: Parameters<typeof deleteTodo>[0]) {
    const success = await deleteTodo(todo);
    if (success) {
      showToast('Todo gelöscht', 'success');
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
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void reload()}>
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
            onClick={() => void reload()}
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
                onChange={() => void toggleTodo(todo)}
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
