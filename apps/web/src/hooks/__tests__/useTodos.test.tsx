/**
 * Unit tests for the useTodos hook (Story-0019 contract):
 * - 2xx  -> local entity is replaced by the canonical server response
 * - 412  -> list is reloaded, conflict error is surfaced, no snapshot rollback
 * - 500  -> optimistic update is rolled back (unchanged behavior)
 * All tests mock globalThis.fetch.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Todo } from 'shared';
import { useTodos } from '../useTodos';

function ok(body: unknown, status = 200) {
  return { ok: true, status, json: () => Promise.resolve(body) };
}

function apiError(body: unknown, status: number) {
  return { ok: false, status, json: () => Promise.resolve(body) };
}

/** Flush pending microtasks/timers so the initial GET has settled. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

/** The hook must have loaded exactly one todo by now. */
function firstTodo(result: { current: { todos: Todo[] } }): Todo {
  const todo = result.current.todos[0];
  if (!todo) throw new Error('expected the initial todo to be loaded');
  return todo;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useTodos', () => {
  it('replaces the local entity with the canonical server response on 2xx', async () => {
    const serverTodo = { id: 1, title: 'A', done: true, rev: 2 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ data: [{ id: 1, title: 'A', done: false, rev: 1 }] }))
      .mockResolvedValueOnce(ok({ data: serverTodo }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTodos());
    await settle();

    await act(async () => {
      await result.current.toggleTodo(firstTodo(result));
    });

    // Canonical server response wins (fresh rev), not a local `done` patch
    expect(result.current.todos).toEqual([serverTodo]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/todos/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ 'If-Match': '1' }),
      })
    );
  });

  it('on 412: reloads the list, surfaces the conflict, and does not roll back to the snapshot', async () => {
    const serverTruth = { id: 1, title: 'A', done: true, rev: 3 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ data: [{ id: 1, title: 'A', done: false, rev: 2 }] }))
      .mockResolvedValueOnce(
        apiError({ error: { message: 'Precondition failed: version mismatch' } }, 412)
      )
      .mockResolvedValueOnce(ok({ data: [serverTruth] }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTodos());
    await settle();

    await act(async () => {
      await result.current.toggleTodo(firstTodo(result));
    });

    // GET (initial) + PATCH (412) + GET (reload)
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.current.error).toBe('Precondition failed: version mismatch');
    // State is the reloaded server truth – not the pre-click snapshot
    expect(result.current.todos).toEqual([serverTruth]);
  });

  it('on 412 delete: reloads, surfaces the conflict, and keeps the todo in the list', async () => {
    const serverTruth = { id: 1, title: 'A', done: false, rev: 3 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ data: [{ id: 1, title: 'A', done: false, rev: 2 }] }))
      .mockResolvedValueOnce(
        apiError({ error: { message: 'Precondition failed: version mismatch' } }, 412)
      )
      .mockResolvedValueOnce(ok({ data: [serverTruth] }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTodos());
    await settle();

    let deleted: boolean | undefined;
    await act(async () => {
      deleted = await result.current.deleteTodo(firstTodo(result));
    });

    expect(deleted).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/todos/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ 'If-Match': '2' }),
      })
    );
    expect(result.current.error).toBe('Precondition failed: version mismatch');
    // Todo was NOT removed locally – the reloaded list still contains it
    expect(result.current.todos).toEqual([serverTruth]);
  });

  it('rolls back the optimistic update and sets the error on non-conflict failures (500)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ data: [{ id: 1, title: 'A', done: false, rev: 1 }] }))
      .mockResolvedValueOnce(apiError({ error: { message: 'Server error' } }, 500));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTodos());
    await settle();

    await act(async () => {
      await result.current.toggleTodo(firstTodo(result));
    });

    expect(firstTodo(result)).toEqual({ id: 1, title: 'A', done: false, rev: 1 });
    expect(result.current.error).toBe('Server error');
    expect(fetchMock).toHaveBeenCalledTimes(2); // no reload for a plain 500
  });
});
