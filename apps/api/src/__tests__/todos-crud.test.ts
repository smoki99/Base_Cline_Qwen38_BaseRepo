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
  return json<{ data: { id: number; title: string; done: boolean; rev: number } }>(res).data;
}

describe('todo CRUD (POST / PATCH / DELETE)', () => {
  // Each test creates its own resource, so the suite stays order-independent
  // (Vitest isolates each test file's in-memory store).

  describe('POST /api/todos', () => {
    it('creates a todo and returns it with 201 (rev starts at 1)', async () => {
      const res = await request(app).post('/api/todos').send({ title: 'Ship it' });
      expect(res.status).toBe(201);
      const todo = json<{ data: { id: number; title: string; done: boolean; rev: number } }>(
        res
      ).data;
      expect(todo.id).toBeGreaterThan(3);
      expect(todo.title).toBe('Ship it');
      expect(todo.done).toBe(false);
      expect(todo.rev).toBe(1);
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
    it('toggles done, bumps rev, and returns the updated todo', async () => {
      const created = await createTodo('Toggle me');
      const on = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '1')
        .send({ done: true });
      expect(on.status).toBe(200);
      const onTodo = json<{ data: { done: boolean; rev: number } }>(on).data;
      expect(onTodo.done).toBe(true);
      expect(onTodo.rev).toBe(2);

      const off = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '2')
        .send({ done: false });
      expect(off.status).toBe(200);
      expect(json<{ data: { done: boolean; rev: number } }>(off).data.done).toBe(false);
    });

    it('accepts a quoted If-Match value (ETag-style)', async () => {
      const created = await createTodo('Quoted');
      const res = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '"1"')
        .send({ done: true });
      expect(res.status).toBe(200);
    });

    it('renames a todo', async () => {
      const created = await createTodo('Before');
      const res = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '1')
        .send({ title: 'After' });
      expect(res.status).toBe(200);
      expect(json<{ data: { title: string } }>(res).data.title).toBe('After');
    });

    it('returns 400 for an empty patch body', async () => {
      const created = await createTodo('Patch target');
      const res = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '1')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 for a whitespace-only title', async () => {
      const created = await createTodo('Patch title');
      const res = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '1')
        .send({ title: '   ' });
      expect(res.status).toBe(400);
      expect(json<{ error: { message: string } }>(res).error.message).toBe(
        'Title darf nicht leer sein.'
      );
      // Verify no mutation occurred (all-or-nothing guarantee)
      const list = await request(app).get('/api/todos');
      const todo = json<{ data: { id: number; title: string; done: boolean; rev: number }[] }>(
        list
      ).data.find((t) => t.id === created.id)!;
      expect(todo.title).toBe('Patch title');
      expect(todo.done).toBe(false);
      expect(todo.rev).toBe(1);
    });

    it('returns 400 for a non-boolean done value', async () => {
      const created = await createTodo('Patch done');
      const res = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '1')
        .send({ done: 'yes' });
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
      const res = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '1')
        .send({ title: 123 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for a non-string title on POST', async () => {
      const res = await request(app).post('/api/todos').send({ title: 123 });
      expect(res.status).toBe(400);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .patch('/api/todos/999999')
        .set('If-Match', '1')
        .send({ done: true });
      expect(res.status).toBe(404);
    });
  });

  describe('If-Match contract on PATCH', () => {
    it('returns 400 "If-Match required" when the header is missing', async () => {
      const created = await createTodo('No header');
      const res = await request(app).patch(`/api/todos/${created.id}`).send({ done: true });
      expect(res.status).toBe(400);
      expect(json<{ error: { message: string } }>(res).error.message).toBe('If-Match required');
    });

    it('returns 400 for a non-numeric If-Match value', async () => {
      const created = await createTodo('Bad header');
      const res = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', 'abc')
        .send({ done: true });
      expect(res.status).toBe(400);
    });

    it('returns 412 with the error envelope for a stale rev and leaves the todo untouched', async () => {
      const created = await createTodo('Conflict');
      await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '1')
        .send({ done: true }); // rev 1 -> 2

      const res = await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '1')
        .send({ done: false });
      expect(res.status).toBe(412);
      expect(json<{ error: { message: string } }>(res).error.message).toBe(
        'Precondition failed: version mismatch'
      );

      const list = await request(app).get('/api/todos');
      const todo = json<{ data: { id: number; done: boolean; rev: number }[] }>(list).data.find(
        (t) => t.id === created.id
      )!;
      expect(todo.done).toBe(true);
      expect(todo.rev).toBe(2);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('deletes a todo and returns 204', async () => {
      const created = await createTodo('Delete me');
      const del = await request(app).delete(`/api/todos/${created.id}`).set('If-Match', '1');
      expect(del.status).toBe(204);

      const list = await request(app).get('/api/todos');
      const ids = json<{ data: { id: number }[] }>(list).data.map((t) => t.id);
      expect(ids).not.toContain(created.id);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).delete('/api/todos/999999').set('If-Match', '1');
      expect(res.status).toBe(404);
    });

    it('is idempotent-safe: second delete returns 404', async () => {
      const created = await createTodo('Double delete');
      expect(
        (await request(app).delete(`/api/todos/${created.id}`).set('If-Match', '1')).status
      ).toBe(204);
      expect(
        (await request(app).delete(`/api/todos/${created.id}`).set('If-Match', '1')).status
      ).toBe(404);
    });
  });

  describe('If-Match contract on DELETE', () => {
    it('returns 400 "If-Match required" when the header is missing', async () => {
      const created = await createTodo('No header');
      const res = await request(app).delete(`/api/todos/${created.id}`);
      expect(res.status).toBe(400);
      expect(json<{ error: { message: string } }>(res).error.message).toBe('If-Match required');
    });

    it('returns 412 for a stale rev and keeps the todo', async () => {
      const created = await createTodo('Conflict delete');
      await request(app)
        .patch(`/api/todos/${created.id}`)
        .set('If-Match', '1')
        .send({ done: true }); // rev 1 -> 2

      const res = await request(app).delete(`/api/todos/${created.id}`).set('If-Match', '1');
      expect(res.status).toBe(412);

      const list = await request(app).get('/api/todos');
      const ids = json<{ data: { id: number }[] }>(list).data.map((t) => t.id);
      expect(ids).toContain(created.id);
    });
  });
});
