import { Router } from 'express';

const router = Router();

/** GET /health – liveness probe. */
router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', uptime: process.uptime() } });
});

export { router as healthRouter };
