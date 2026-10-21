/**
 * Pure fetch functions for the REST API.
 * No React dependencies – fully unit-testable in isolation.
 */
import { isApiError } from 'shared';
import type { ApiResult, CreateTodo, Todo, UpdateTodo } from 'shared';

const apiBase = import.meta.env.VITE_API_URL ?? '';

/** Thrown when the server responds with 412 Precondition Failed (stale rev / If-Match). */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/** Map a failed API response to a typed error (412 → ConflictError). */
async function toApiError(res: { status: number; json?: () => Promise<unknown> }): Promise<never> {
  let message = `Request failed with status ${res.status}`;
  if (typeof res.json === 'function') {
    try {
      const json = (await res.json()) as ApiResult<unknown>;
      if (isApiError(json)) message = json.error.message;
    } catch {
      /* response without a readable JSON body */
    }
  }
  if (res.status === 412) throw new ConflictError(message);
  throw new Error(message);
}

/** GET /api/todos – returns the full list of todos. */
export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${apiBase}/api/todos`);
  if (!res.ok) throw await toApiError(res);
  const json = (await res.json()) as ApiResult<Todo[]>;
  if (isApiError(json) || !Array.isArray(json.data)) {
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
  if (!res.ok) throw await toApiError(res);
  const json = (await res.json()) as ApiResult<Todo>;
  if (isApiError(json)) throw new Error(json.error.message);
  return json.data;
}

/**
 * PATCH /api/todos/:id – updates a todo and returns the updated (canonical) entity.
 * `rev` is sent as the `If-Match` header (optimistic locking); 412 → ConflictError.
 */
export async function updateTodo(id: number, rev: number, payload: UpdateTodo): Promise<Todo> {
  const res = await fetch(`${apiBase}/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'If-Match': String(rev) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  const json = (await res.json()) as ApiResult<Todo>;
  if (isApiError(json)) throw new Error(json.error.message);
  return json.data;
}

/**
 * DELETE /api/todos/:id – deletes a todo (204, no body).
 * `rev` is sent as the `If-Match` header (optimistic locking); 412 → ConflictError.
 */
export async function deleteTodo(id: number, rev: number): Promise<void> {
  const res = await fetch(`${apiBase}/api/todos/${id}`, {
    method: 'DELETE',
    headers: { 'If-Match': String(rev) },
  });
  if (!res.ok) throw await toApiError(res);
}
