import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('GET /api/todos', () => {
  it('returns 200 with a non-empty todos array', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('each todo has id, title, done', async () => {
    const res = await request(app).get('/api/todos');
    const first: { id: number; title: string; done: boolean } = res.body.data[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('done');
  });
});

describe('error handling', () => {
  it('returns 404 with ApiError shape for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error.message).toBe('Not found');
  });

  it('does not leak a data field on error responses', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.body).not.toHaveProperty('data');
  });

  it('returns 400 with ApiError shape for an invalid JSON body', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const res = await request(app)
        .post('/api/todos')
        .set('Content-Type', 'application/json')
        .send('{invalid json');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('message');
      expect(res.body.error.message).toBe('Invalid request body');
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
