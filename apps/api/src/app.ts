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

// CORS – allowed origins from CORS_ORIGIN (comma-separated).
// Empty/unset = allow all (dev convenience). Evaluated per request.
app.use(
  cors({
    origin(origin, callback) {
      const allowed = (process.env.CORS_ORIGIN ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (
        origin === undefined ||
        origin === '' ||
        allowed.length === 0 ||
        allowed.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(Object.assign(new Error('Not allowed by CORS'), { status: 403 }));
      }
    },
  })
);

app.use(express.json());
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
