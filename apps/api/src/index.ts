/** API entry point – opens the todo store (fail fast on corruption) and starts the HTTP server. */
import path from 'node:path';
import { createApp } from './app';
import { TodoService } from './services/todoService';
import { CorruptStoreError, FileTodoStore } from './services/todoStore';

/** Env var that overrides the data file path with an absolute one (see .env.example). */
const DATA_FILE_ENV_VAR = 'TODO_DATA_FILE';

/**
 * Resolves the data file: env override (absolute path) or the default
 * `<api-package>/data/todos.json` – module-relative, so identical for `src/`
 * and `dist/` and independent of the working directory.
 */
function resolveDataFile(): string {
  const override = process.env[DATA_FILE_ENV_VAR]?.trim();
  if (override) {
    return path.resolve(override);
  }
  return path.join(import.meta.dirname, '..', 'data', 'todos.json');
}

const dataFile = resolveDataFile();

let store: FileTodoStore;
try {
  store = await FileTodoStore.open(dataFile);
} catch (error) {
  if (error instanceof CorruptStoreError) {
    console.error(`Todo-Store konnte nicht geöffnet werden: ${error.message}`);
    console.error(`Datei prüfen oder löschen, um mit Seed-Daten neu zu starten: ${error.path}`);
    process.exit(1);
  }
  throw error;
}

const app = createApp(new TodoService(store));

// Bind address – default loopback-only (local-first project);
// set HOST=0.0.0.0 for LAN/Docker.
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT) || 4001;

const server = app.listen(port, host, () => {
  console.log(`API running on http://${host}:${port}`);
});

// Graceful shutdown – close the HTTP server (preparation for connection
// pools: close them here before exiting).
function shutdown() {
  server.close(() => process.exit(0));
  // Force-exit if open connections prevent the close.
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
