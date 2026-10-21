import { promises as fsp } from 'node:fs';
import path from 'node:path';
import type { CreateTodo, Todo, UpdateTodo } from 'shared';

/**
 * Seed todos written on first start (data file missing).
 * Content is frozen: `apps/web/e2e/home.spec.ts` expects exactly these 3 todos.
 */
export const SEED_TODOS: readonly Todo[] = [
  { id: 1, title: 'Learn TypeScript', done: true },
  { id: 2, title: 'Build an API', done: false },
  { id: 3, title: 'Write tests', done: false },
];

/** Raised when the persisted data file exists but cannot be interpreted (fail fast, no silent data loss). */
export class CorruptStoreError extends Error {
  readonly path: string;

  constructor(path: string, reason: string, options?: ErrorOptions) {
    super(`${reason} (${path})`, options);
    this.name = 'CorruptStoreError';
    this.path = path;
  }
}

/**
 * Persistence contract for todos.
 *
 * ID contract (guaranteed by every implementation):
 * - server-assigned (never taken from client input)
 * - unique among live todos
 * - monotonically increasing (allocated from the persisted high-water mark `maxId`)
 * - stable across restarts (same id always refers to the same entity)
 * - never reused (deleted ids are never handed out again)
 *
 * Concurrency contract:
 * - mutations are serialized: N concurrent `create()` calls produce N unique
 *   consecutive ids and persist every todo (no lost updates)
 */
export interface TodoStore {
  list(): Promise<Todo[]>;
  create(input: CreateTodo): Promise<Todo>;
  update(id: number, input: UpdateTodo): Promise<Todo | undefined>;
  remove(id: number): Promise<boolean>;
}

/**
 * Shared in-memory state, serialized mutation pipeline and id allocation for all
 * stores. Subclasses implement `persist()` to decide what survives a restart.
 */
abstract class BaseTodoStore implements TodoStore {
  protected todos: Todo[];
  protected maxId: number;
  private chain: Promise<void> = Promise.resolve();

  protected constructor(initial: readonly Todo[], initialMaxId: number) {
    this.todos = initial.map((todo) => ({ ...todo }));
    this.maxId = initialMaxId;
  }

  /** Persist the current state. Must be safe to call repeatedly. */
  protected abstract persist(): Promise<void>;

  /** Serialize an async mutation behind every previous mutation. */
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.chain.then(operation);
    this.chain = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  list(): Promise<Todo[]> {
    return Promise.resolve(this.todos.map((todo) => ({ ...todo })));
  }

  create(input: CreateTodo): Promise<Todo> {
    return this.enqueue(async () => {
      this.maxId += 1;
      const todo: Todo = { id: this.maxId, title: input.title, done: false };
      this.todos.push(todo);
      await this.persist();
      return { ...todo };
    });
  }

  update(id: number, input: UpdateTodo): Promise<Todo | undefined> {
    return this.enqueue(async () => {
      const todo = this.todos.find((candidate) => candidate.id === id);
      if (!todo) return undefined;
      if (input.title !== undefined) todo.title = input.title;
      if (input.done !== undefined) todo.done = input.done;
      await this.persist();
      return { ...todo };
    });
  }

  remove(id: number): Promise<boolean> {
    return this.enqueue(async () => {
      const index = this.todos.findIndex((todo) => todo.id === id);
      if (index === -1) return false;
      this.todos.splice(index, 1);
      await this.persist();
      return true;
    });
  }
}

/** Store that lives only in process memory (dev/tests). Nothing is written to disk. */
export class InMemoryTodoStore extends BaseTodoStore {
  constructor(initial: readonly Todo[] = SEED_TODOS, initialMaxId?: number) {
    const maxFromTodos = initial.reduce((max, todo) => Math.max(max, todo.id), 0);
    super(initial, initialMaxId ?? maxFromTodos);
  }

  protected persist(): Promise<void> {
    return Promise.resolve();
  }
}

/** Persisted document shape. `v` is the format version (see STORE_FORMAT_VERSION). */
interface StoreFile {
  v: number;
  maxId: number;
  todos: Todo[];
}

/** Bump (and add a migration) only when the persisted shape changes. */
const STORE_FORMAT_VERSION = 1;

/**
 * File-backed store. State survives restarts with stable ids.
 *
 * Semantics:
 * - file missing  -> seeds are loaded and written (first start)
 * - file present  -> it is canonical (even an empty list); invalid content
 *                   rejects `open()` with `CorruptStoreError` (fail fast, no
 *                   silent data loss, no auto repair)
 * - every mutation is written atomically (temp file + `rename`), so the file
 *   is always either the old or the new document, never torn
 */
export class FileTodoStore extends BaseTodoStore {
  private readonly filePath: string;
  private tmpCounter = 0;

  private constructor(filePath: string, initial: readonly Todo[], initialMaxId: number) {
    super(initial, initialMaxId);
    this.filePath = filePath;
  }

  static async open(filePath: string): Promise<FileTodoStore> {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });

    let raw: string;
    try {
      raw = await fsp.readFile(filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const store = new FileTodoStore(filePath, SEED_TODOS, maxIdOf(SEED_TODOS));
        await store.persist();
        return store;
      }
      throw error;
    }

    const { maxId, todos } = parseStoreFile(raw, filePath);
    return new FileTodoStore(filePath, todos, maxId);
  }

  protected async persist(): Promise<void> {
    this.tmpCounter += 1;
    const tmp = `${this.filePath}.tmp-${process.pid}-${this.tmpCounter}`;
    const document: StoreFile = { v: STORE_FORMAT_VERSION, maxId: this.maxId, todos: this.todos };
    try {
      // Recreate the parent directory if it disappeared from under us – the
      // store must keep working instead of failing with ENOENT on persist.
      await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
      const handle = await fsp.open(tmp, 'w');
      try {
        await handle.writeFile(JSON.stringify(document, null, 2));
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fsp.rename(tmp, this.filePath);
    } catch (error) {
      await fsp.rm(tmp, { force: true }).catch(() => undefined);
      throw error;
    }
  }
}

function maxIdOf(todos: readonly Todo[]): number {
  return todos.reduce((max, todo) => Math.max(max, todo.id), 0);
}

/** Validate a persisted document; rejects with `CorruptStoreError` on any contract violation. */
function parseStoreFile(raw: string, filePath: string): Pick<StoreFile, 'maxId' | 'todos'> {
  const { maxId, todos: rawTodos } = parseDocument(raw, filePath);

  const todos: Todo[] = [];
  const seen = new Set<number>();
  for (const entry of rawTodos) {
    const todo = parseTodoEntry(entry, filePath);
    if (seen.has(todo.id)) {
      throw new CorruptStoreError(filePath, `duplicate todo id ${todo.id}`);
    }
    seen.add(todo.id);
    todos.push(todo);
  }

  if (maxIdOf(todos) > maxId) {
    throw new CorruptStoreError(filePath, 'maxId is lower than a todo id (inconsistent file)');
  }

  return { maxId, todos };
}

function parseDocument(raw: string, filePath: string): { maxId: number; todos: unknown[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new CorruptStoreError(filePath, 'data file is not valid JSON', { cause: error });
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new CorruptStoreError(filePath, 'data file must be a JSON object');
  }
  const doc = parsed as { v?: unknown; maxId?: unknown; todos?: unknown };

  if (doc.v !== STORE_FORMAT_VERSION) {
    throw new CorruptStoreError(
      filePath,
      `unsupported format version (expected v: ${STORE_FORMAT_VERSION})`
    );
  }
  if (typeof doc.maxId !== 'number' || !Number.isInteger(doc.maxId) || doc.maxId < 0) {
    throw new CorruptStoreError(filePath, 'invalid maxId');
  }
  if (!Array.isArray(doc.todos)) {
    throw new CorruptStoreError(filePath, 'missing todos array');
  }

  return { maxId: doc.maxId, todos: doc.todos };
}

function parseTodoEntry(entry: unknown, filePath: string): Todo {
  if (typeof entry !== 'object' || entry === null) {
    throw new CorruptStoreError(filePath, 'todo entries must be objects');
  }
  const todo = entry as Todo;
  if (typeof todo.id !== 'number' || !Number.isInteger(todo.id) || todo.id <= 0) {
    throw new CorruptStoreError(filePath, 'todo id must be a positive integer');
  }
  if (typeof todo.title !== 'string') {
    throw new CorruptStoreError(filePath, 'todo title must be a string');
  }
  if (typeof todo.done !== 'boolean') {
    throw new CorruptStoreError(filePath, 'todo done must be a boolean');
  }
  return { id: todo.id, title: todo.title, done: todo.done };
}
