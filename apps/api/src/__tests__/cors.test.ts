import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../app';

const ALLOWED = 'http://allowed.test';

describe('CORS', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('adds Access-Control-Allow-Origin for an allowed origin', async () => {
    vi.stubEnv('CORS_ORIGIN', ALLOWED);
    const res = await request(app).get('/api/todos').set('Origin', ALLOWED);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  it('handles a preflight OPTIONS request for an allowed origin', async () => {
    vi.stubEnv('CORS_ORIGIN', ALLOWED);
    const res = await request(app)
      .options('/api/todos')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'GET');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
    expect(res.headers['access-control-allow-methods']).toBeDefined();
  });

  it('blocks an origin that is not in the allowlist', async () => {
    vi.stubEnv('CORS_ORIGIN', ALLOWED);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const res = await request(app).get('/api/todos').set('Origin', 'http://evil.test');
      expect(res.status).toBe(403);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      expect(res.body.error.message).toBe('Forbidden');
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('blocks a POST request for a disallowed origin', async () => {
    vi.stubEnv('CORS_ORIGIN', ALLOWED);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const res = await request(app)
        .post('/api/todos')
        .set('Origin', 'http://evil.test')
        .send({ title: 'Test' });
      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe('Forbidden');
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('blocks a preflight OPTIONS request for a disallowed origin', async () => {
    vi.stubEnv('CORS_ORIGIN', ALLOWED);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const res = await request(app)
        .options('/api/todos')
        .set('Origin', 'http://evil.test')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.status).toBe(403);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      expect(res.body.error.message).toBe('Forbidden');
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('allows any origin when CORS_ORIGIN is empty (dev convenience)', async () => {
    vi.stubEnv('CORS_ORIGIN', '');
    const res = await request(app).get('/api/todos').set('Origin', 'http://random.test');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://random.test');
  });
});
