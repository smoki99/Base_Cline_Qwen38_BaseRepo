import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers';

const app = createTestApp();

describe('Security headers (helmet)', () => {
  it('responds with X-Content-Type-Options: nosniff on GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('responds with Referrer-Policy: no-referrer on GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  it('responds with X-Frame-Options: SAMEORIGIN on GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('does not expose X-Powered-By on GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('responds with security headers on GET /api/todos', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });
});
