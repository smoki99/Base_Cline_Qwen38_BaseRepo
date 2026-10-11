/**
 * Pure fetch functions for the REST API.
 * No React dependencies – fully unit-testable in isolation.
 */
import { isApiError } from 'shared';
import type { ApiResult, CreateTodo, Todo, UpdateTodo } from 'shared';

const apiBase = import.meta.env.VITE_API_URL ?? '';

/** GET /api/todos – returns the full list of todos. */
export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${apiBase}/api/todos`);
  const json = (await res.json()) as ApiResult<Todo[]>;
  if (isApiError(json)) throw new Error(json.error.message);
  if (!res.ok || !Array.isArray(json.data)) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return json.data;
}

/** POST /api/todos – creates a new todo and returns it. */
export async function addTodo(title: string): Promise<Todo> {
  const body: CreateTodo = { title };
  const res = await fetch(`${apiBase}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResult<Todo>;
  if (isApiError(json)) throw new Error(json.error.message);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return json.data;
}

/** PATCH /api/todos/:id – updates a todo and returns the updated entity. */
export async function updateTodo(id: number, payload: UpdateTodo): Promise<Todo> {
  const res = await fetch(`${apiBase}/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as ApiResult<Todo>;
  if (isApiError(json)) throw new Error(json.error.message);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return json.data;
}

/** DELETE /api/todos/:id – deletes a todo (204, no body). */
export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${apiBase}/api/todos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
}
