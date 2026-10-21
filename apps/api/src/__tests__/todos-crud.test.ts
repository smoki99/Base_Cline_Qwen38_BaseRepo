import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp } from './helpers';

const app = createTestApp();

function json<T = unknown>(res: request.Response): T {
  return res.body as T;
}

/** Create a todo via the API and return it. */
async function createTodo(title: string) {
  const res = await request(app).post('/api/todos').send({ title });
  if (res.status !== 201) throw new Error(`create failed: ${res.status}`);
  return json<{ data: { id: number; title: string; done: boolean } }>(res).data;
}

describe('todo CRUD (POST / PATCH / DELETE)', () => {
  // Each test creates its own resource, so the suite stays order-independent
  // (Vitest isolates each test file's in-memory store).

  describe('POST /api/todos', () => {
    it('creates a todo and returns it with 201', async () => {
      const res = await request(app).post('/api/todos').send({ title: 'Ship it' });
      expect(res.status).toBe(201);
      const todo = json<{ data: { id: number; title: string; done: boolean } }>(res).data;
      expect(todo.id).toBeGreaterThan(3);
      expect(todo.title).toBe('Ship it');
      expect(todo.done).toBe(false);
    });

    it('returns 400 for an empty title', async () => {
      const res = await request(app).post('/api/todos').send({ title: '   ' });
      expect(res.status).toBe(400);
      expect(json<{ error: { message: string } }>(res).error.message).toBe(
        'Title darf nicht leer sein.'
      );
    });

    it('returns 400 for a missing body', async () => {
      const res = await request(app).post('/api/todos').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('toggles done and returns the updated todo', async () => {
      const created = await createTodo('Toggle me');
      const on = await request(app).patch(`/api/todos/${created.id}`).send({ done: true });
      expect(on.status).toBe(200);
      expect(json<{ data: { done: boolean } }>(on).data.done).toBe(true);

      const off = await request(app).patch(`/api/todos/${created.id}`).send({ done: false });
      expect(off.status).toBe(200);
      expect(json<{ data: { done: boolean } }>(off).data.done).toBe(false);
    });

    it('renames a todo', async () => {
      const created = await createTodo('Before');
      const res = await request(app).patch(`/api/todos/${created.id}`).send({ title: 'After' });
      expect(res.status).toBe(200);
      expect(json<{ data: { title: string } }>(res).data.title).toBe('After');
    });

    it('returns 400 for an empty patch body', async () => {
      const created = await createTodo('Patch target');
      const res = await request(app).patch(`/api/todos/${created.id}`).send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 for a whitespace-only title', async () => {
      const created = await createTodo('Patch title');
      const res = await request(app).patch(`/api/todos/${created.id}`).send({ title: '   ' });
      expect(res.status).toBe(400);
      expect(json<{ error: { message: string } }>(res).error.message).toBe(
        'Title darf nicht leer sein.'
      );
      // Verify no mutation occurred (all-or-nothing guarantee)
      const list = await request(app).get('/api/todos');
      const todo = json<{ data: { id: number; title: string; done: boolean }[] }>(list).data.find(
        (t) => t.id === created.id
      )!;
      expect(todo.title).toBe('Patch title');
      expect(todo.done).toBe(false);
    });

    it('returns 400 for a non-boolean done value', async () => {
      const created = await createTodo('Patch done');
      const res = await request(app).patch(`/api/todos/${created.id}`).send({ done: 'yes' });
      expect(res.status).toBe(400);
      expect(json<{ error: { message: string } }>(res).error.message).toBe(
        'Done muss ein boolean Wert sein.'
      );
      // Verify no mutation occurred (all-or-nothing guarantee)
      const list = await request(app).get('/api/todos');
      const todo = json<{ data: { id: number; title: string; done: boolean }[] }>(list).data.find(
        (t) => t.id === created.id
      )!;
      expect(todo.done).toBe(false);
    });

    it('returns 400 for a non-string title on PATCH', async () => {
      const created = await createTodo('Patch type');
      const res = await request(app).patch(`/api/todos/${created.id}`).send({ title: 123 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for a non-string title on POST', async () => {
      const res = await request(app).post('/api/todos').send({ title: 123 });
      expect(res.status).toBe(400);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).patch('/api/todos/999999').send({ done: true });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('deletes a todo and returns 204', async () => {
      const created = await createTodo('Delete me');
      const del = await request(app).delete(`/api/todos/${created.id}`);
      expect(del.status).toBe(204);

      const list = await request(app).get('/api/todos');
      const ids = json<{ data: { id: number }[] }>(list).data.map((t) => t.id);
      expect(ids).not.toContain(created.id);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).delete('/api/todos/999999');
      expect(res.status).toBe(404);
    });

    it('is idempotent-safe: second delete returns 404', async () => {
      const created = await createTodo('Double delete');
      expect((await request(app).delete(`/api/todos/${created.id}`)).status).toBe(204);
      expect((await request(app).delete(`/api/todos/${created.id}`)).status).toBe(404);
    });
  });
});
