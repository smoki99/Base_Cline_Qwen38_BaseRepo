import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CorruptStoreError,
  FileTodoStore,
  InMemoryTodoStore,
  RevisionConflictError,
  SEED_TODOS,
} from '../services/todoStore';

describe('InMemoryTodoStore', () => {
  it('starts with the frozen seed todos (ids 1-3)', async () => {
    const store = new InMemoryTodoStore();
    await expect(store.list()).resolves.toEqual(SEED_TODOS);
  });

  it('creates a todo with the next id after the high-water mark (rev starts at 1)', async () => {
    const store = new InMemoryTodoStore();
    await expect(store.create({ title: 'Ship it' })).resolves.toEqual({
      id: 4,
      title: 'Ship it',
      done: false,
      rev: 1,
    });
  });

  it('allocates unique sequential ids for concurrent creates (no lost updates)', async () => {
    const store = new InMemoryTodoStore();
    const [a, b, c] = await Promise.all([
      store.create({ title: 'a' }),
      store.create({ title: 'b' }),
      store.create({ title: 'c' }),
    ]);
    expect(new Set([a.id, b.id, c.id]).size).toBe(3);
    expect([a.id, b.id, c.id].sort((x, y) => x - y)).toEqual([4, 5, 6]);
    await expect(store.list()).resolves.toHaveLength(6);
  });

  it('updates an existing todo (bumps rev) and returns undefined for unknown ids', async () => {
    const store = new InMemoryTodoStore();
    const updated = await store.update(2, 1, { done: true, title: 'Ship the API' });
    expect(updated).toEqual({ id: 2, title: 'Ship the API', done: true, rev: 2 });
    await expect(store.update(99, 1, { done: true })).resolves.toBeUndefined();
  });

  it('removes an existing todo and returns false for unknown ids', async () => {
    const store = new InMemoryTodoStore();
    await expect(store.remove(3, 1)).resolves.toBe(true);
    await expect(store.list()).resolves.toHaveLength(2);
    await expect(store.remove(99, 1)).resolves.toBe(false);
  });

  it('rejects an update with a stale revision (RevisionConflictError, no mutation)', async () => {
    const store = new InMemoryTodoStore();
    await store.update(1, 1, { done: false }); // rev 1 -> 2
    await expect(store.update(1, 1, { done: true })).rejects.toThrow(RevisionConflictError);
    const list = await store.list();
    expect(list.find((todo) => todo.id === 1)).toEqual({
      id: 1,
      title: 'Learn TypeScript',
      done: false,
      rev: 2,
    });
  });

  it('rejects a removal with a stale revision (RevisionConflictError, todo stays)', async () => {
    const store = new InMemoryTodoStore();
    await store.update(3, 1, { done: true }); // rev 1 -> 2
    await expect(store.remove(3, 1)).rejects.toThrow(RevisionConflictError);
    await expect(store.list()).resolves.toHaveLength(3);
  });

  it('never reuses a deleted id', async () => {
    const store = new InMemoryTodoStore();
    await store.remove(3, 1);
    await store.remove(2, 1);
    await store.remove(1, 1);
    const created = await store.create({ title: 'fresh' });
    expect(created.id).toBeGreaterThan(3);
  });

  it('supports custom initial state with an explicit high-water mark', async () => {
    const store = new InMemoryTodoStore([{ id: 10, title: 'x', done: false, rev: 1 }], 10);
    await expect(store.create({ title: 'y' })).resolves.toEqual({
      id: 11,
      title: 'y',
      done: false,
      rev: 1,
    });
  });

  it('returns defensive copies from list()', async () => {
    const store = new InMemoryTodoStore();
    const first = await store.list();
    first.push({ id: 999, title: 'ghost', done: false, rev: 1 });
    if (first[0]) first[0].title = 'mutated';
    await expect(store.list()).resolves.toEqual(SEED_TODOS);
  });
});

describe('FileTodoStore', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'todostore-'));
    file = path.join(dir, 'todos.json');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('seeds the data file on first start (file missing)', async () => {
    const store = await FileTodoStore.open(file);
    await expect(store.list()).resolves.toEqual(SEED_TODOS);
    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    expect(onDisk).toEqual({ v: 2, maxId: 3, todos: SEED_TODOS });
  });

  it('keeps an existing file canonical (empty list stays empty)', async () => {
    writeFileSync(file, JSON.stringify({ v: 2, maxId: 3, todos: [] }));
    const store = await FileTodoStore.open(file);
    await expect(store.list()).resolves.toEqual([]);
    const created = await store.create({ title: 'first' });
    expect(created.id).toBe(4);
    expect(created.rev).toBe(1);
  });

  it('persists mutations and survives a restart with the same ids and revs', async () => {
    const first = await FileTodoStore.open(file);
    const created = await first.create({ title: 'persist me' });
    await first.update(created.id, 1, { done: true });

    const second = await FileTodoStore.open(file);
    const list = await second.list();
    expect(list).toContainEqual({ id: created.id, title: 'persist me', done: true, rev: 2 });

    const next = await second.create({ title: 'after restart' });
    expect(next.id).toBeGreaterThan(created.id);
  });

  it('never reuses a deleted id across restarts', async () => {
    const first = await FileTodoStore.open(file);
    const created = await first.create({ title: 'temp' });
    await first.remove(created.id, 1);

    const second = await FileTodoStore.open(file);
    const next = await second.create({ title: 'next' });
    expect(next.id).toBeGreaterThan(created.id);
  });

  it('migrates a legacy v:1 document (no rev) and re-persists it as v:2', async () => {
    writeFileSync(
      file,
      JSON.stringify({
        v: 1,
        maxId: 5,
        todos: [
          { id: 1, title: 'old one', done: true },
          { id: 4, title: 'old two', done: false },
        ],
      })
    );
    const store = await FileTodoStore.open(file);
    const list = await store.list();
    expect(list).toEqual([
      { id: 1, title: 'old one', done: true, rev: 1 },
      { id: 4, title: 'old two', done: false, rev: 1 },
    ]);
    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as {
      v: number;
      todos: { rev: number }[];
    };
    expect(onDisk.v).toBe(2);
    expect(onDisk.todos.map((todo) => todo.rev)).toEqual([1, 1]);
  });

  it('rejects a v:2 document whose todos lack a valid rev', async () => {
    const badDocuments = [
      { v: 2, maxId: 3, todos: [{ id: 1, title: 'a', done: false }] },
      { v: 2, maxId: 3, todos: [{ id: 1, title: 'a', done: false, rev: 0 }] },
      { v: 2, maxId: 3, todos: [{ id: 1, title: 'a', done: false, rev: '1' }] },
    ];
    for (const [index, document] of badDocuments.entries()) {
      writeFileSync(file, JSON.stringify(document));
      await expect(FileTodoStore.open(file), `case ${index}`).rejects.toThrow(CorruptStoreError);
    }
  });

  it('allocates unique sequential ids for concurrent creates (no lost updates)', async () => {
    const store = await FileTodoStore.open(file);
    const [a, b, c] = await Promise.all([
      store.create({ title: 'a' }),
      store.create({ title: 'b' }),
      store.create({ title: 'c' }),
    ]);
    expect([a.id, b.id, c.id].sort((x, y) => x - y)).toEqual([4, 5, 6]);
    await expect(store.list()).resolves.toHaveLength(6);
    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as { todos: unknown[] };
    expect(onDisk.todos).toHaveLength(6);
  });

  it('writes atomically via rename and leaves a valid file after every mutation', async () => {
    const store = await FileTodoStore.open(file);
    const renameSpy = vi.spyOn(fsPromises, 'rename');
    await store.create({ title: 'atomic' });
    await store.remove(1, 1);
    expect(renameSpy).toHaveBeenCalledTimes(2);
    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as { todos: unknown[] };
    expect(Array.isArray(onDisk.todos)).toBe(true);
    renameSpy.mockRestore();
  });

  it('rejects with CorruptStoreError for invalid JSON', async () => {
    writeFileSync(file, 'not json');
    await expect(FileTodoStore.open(file)).rejects.toThrow(CorruptStoreError);
  });

  it('rejects with CorruptStoreError for an empty file', async () => {
    writeFileSync(file, '');
    await expect(FileTodoStore.open(file)).rejects.toThrow(CorruptStoreError);
  });

  it('rejects with CorruptStoreError for an unknown format version', async () => {
    writeFileSync(file, JSON.stringify({ v: 3, maxId: 3, todos: [] }));
    await expect(FileTodoStore.open(file)).rejects.toThrow(CorruptStoreError);
  });

  it('rejects with CorruptStoreError for invalid todo entries', async () => {
    const badDocuments = [
      { v: 1, maxId: 3, todos: [{ id: 1, title: 42, done: false }] },
      { v: 1, maxId: 3, todos: [{ id: 1, title: 'a', done: 'yes' }] },
      { v: 1, maxId: 3, todos: [{ id: -5, title: 'a', done: false }] },
      {
        v: 1,
        maxId: 3,
        todos: [
          { id: 1, title: 'a', done: false },
          { id: 1, title: 'b', done: false },
        ],
      },
      { v: 1, maxId: 2, todos: [{ id: 5, title: 'a', done: false }] },
    ];
    for (const [index, document] of badDocuments.entries()) {
      writeFileSync(file, JSON.stringify(document));
      await expect(FileTodoStore.open(file), `case ${index}`).rejects.toThrow(CorruptStoreError);
    }
  });

  it('creates the parent directory if it does not exist', async () => {
    const nested = path.join(dir, 'nested', 'deep', 'todos.json');
    const store = await FileTodoStore.open(nested);
    await expect(store.list()).resolves.toEqual(SEED_TODOS);
  });

  it('keeps working if the parent directory is deleted at runtime', async () => {
    const store = await FileTodoStore.open(file);
    rmSync(dir, { recursive: true, force: true });
    const created = await store.create({ title: 'resilient' });
    expect(created.title).toBe('resilient');
    const onDisk = JSON.parse(readFileSync(file, 'utf8')) as { todos: unknown[] };
    expect(onDisk.todos).toHaveLength(4);
  });
});
