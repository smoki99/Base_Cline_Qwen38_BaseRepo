/** API entry point – starts the HTTP server. */
import app from './app';

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
