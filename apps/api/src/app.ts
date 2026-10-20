/** Express application instance – exported for testing. */
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health';
import { todoRouter } from './routes/todos';

const app = express();
app.disable('x-powered-by');

// Security headers (X-Content-Type-Options, Referrer-Policy, X-Frame-Options, …)
app.use(helmet({ referrerPolicy: { policy: 'no-referrer' } }));

// CORS – allowed origins from CORS_ORIGIN (comma-separated, see .env.example).
// Dev convenience: empty/unset = allow all origins.
// Fail-closed: in production (NODE_ENV=production) an empty allowlist denies
// cross-origin requests instead of silently allowing them.
app.use(
  cors({
    origin(origin, callback) {
      const allowed = (process.env.CORS_ORIGIN ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const allowAllInDev = allowed.length === 0 && process.env.NODE_ENV !== 'production';
      if (origin === undefined || origin === '' || allowed.includes(origin) || allowAllInDev) {
        callback(null, true);
      } else {
        callback(Object.assign(new Error('Not allowed by CORS'), { status: 403 }));
      }
    },
  })
);

// Body-size limit – protects against oversized/malformed payloads.
app.use(express.json({ limit: '5mb' }));
app.use(healthRouter);
app.use(todoRouter);

// 404 – unknown route returns ApiError shape
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

// Central error handler (4-arg = Express error middleware)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = (err as { status?: number }).status ?? 500;
  const statusMessages: Record<number, string> = { 400: 'Invalid request body', 403: 'Forbidden' };
  const message = statusMessages[status] ?? 'Internal server error';
  res.status(status).json({ error: { message } });
});

export default app;
