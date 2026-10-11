/**
 * Unit tests for the pure API fetch functions in lib/api.ts.
 * All tests mock globalThis.fetch.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchTodos, addTodo, updateTodo, deleteTodo } from '../lib/api';

function ok(body: unknown, status = 200) {
  return { ok: true, status, json: () => Promise.resolve(body) };
}

function error(body: unknown, status: number) {
  return { ok: false, status, json: () => Promise.resolve(body) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTodos', () => {
  it('returns the todo array on success', async () => {
    const todos = [
      { id: 1, title: 'A', done: false },
      { id: 2, title: 'B', done: true },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ data: todos })));

    const result = await fetchTodos();

    expect(result).toEqual(todos);
    expect(fetch).toHaveBeenCalledWith('/api/todos');
  });

  it('throws with the API error message on ApiError response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(error({ error: { message: 'Internal error' } }, 500))
    );

    await expect(fetchTodos()).rejects.toThrow('Internal error');
  });

  it('throws a status-based error when response is not ok and body is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve({}) })
    );

    await expect(fetchTodos()).rejects.toThrow('Request failed with status 503');
  });
});

describe('addTodo', () => {
  it('sends a POST with the title and returns the created todo', async () => {
    const created = { id: 3, title: 'New', done: false };
    const fetchMock = vi.fn().mockResolvedValue(ok({ data: created }, 201));
    vi.stubGlobal('fetch', fetchMock);

    const result = await addTodo('New');

    expect(result).toEqual(created);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/todos',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New' }),
      })
    );
  });

  it('throws with the API error message on ApiError response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(error({ error: { message: 'Title darf nicht leer sein.' } }, 400))
    );

    await expect(addTodo('')).rejects.toThrow('Title darf nicht leer sein.');
  });

  it('throws a status-based error on non-OK without ApiError body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
    );

    await expect(addTodo('X')).rejects.toThrow('Request failed with status 500');
  });
});

describe('updateTodo', () => {
  it('sends a PATCH with the payload and returns the updated todo', async () => {
    const updated = { id: 1, title: 'A', done: true };
    const fetchMock = vi.fn().mockResolvedValue(ok({ data: updated }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await updateTodo(1, { done: true });

    expect(result).toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/todos/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: true }),
      })
    );
  });

  it('throws with the API error message on ApiError response', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(error({ error: { message: 'Done muss ein boolean Wert sein.' } }, 400))
    );

    await expect(updateTodo(1, { done: 'yes' as unknown as boolean })).rejects.toThrow(
      'Done muss ein boolean Wert sein.'
    );
  });

  it('throws a status-based error on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(error({ error: { message: 'Not found' } }, 404))
    );

    await expect(updateTodo(999, { done: true })).rejects.toThrow('Not found');
  });
});

describe('deleteTodo', () => {
  it('sends a DELETE and resolves on 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteTodo(1)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith('/api/todos/1', { method: 'DELETE' });
  });

  it('throws a status-based error on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(deleteTodo(999)).rejects.toThrow('Request failed with status 404');
  });

  it('throws a status-based error on 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(deleteTodo(1)).rejects.toThrow('Request failed with status 500');
  });
});
