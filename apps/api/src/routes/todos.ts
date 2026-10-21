import { Router } from 'express';
import type { CreateTodo, UpdateTodo } from 'shared';
import { RevisionConflictError } from '../services/todoStore';
import { ValidationError, type TodoService } from '../services/todoService';

/** Parse the `If-Match` header into a positive integer revision (accepts quoted form). */
function parseIfMatch(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const rev = Number(value.trim().replace(/^"(.*)"$/, '$1'));
  if (!Number.isInteger(rev) || rev < 1) return null;
  return rev;
}

/** Build the /api/todos router around an injected TodoService. */
export function createTodoRouter(todoService: TodoService) {
  const router = Router();

  /** GET /api/todos – list all todos. */
  router.get('/api/todos', async (_req, res) => {
    res.json({ data: await todoService.getTodos() });
  });

  /** POST /api/todos – create a todo. */
  router.post('/api/todos', async (req, res) => {
    const body = req.body as CreateTodo | undefined;
    if (!body) {
      res.status(400).json({ error: { message: 'Title darf nicht leer sein.' } });
      return;
    }
    try {
      const todo = await todoService.createTodo(body);
      res.status(201).json({ data: todo });
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: { message: err.message } });
        return;
      }
      throw err;
    }
  });

  /** PATCH /api/todos/:id – update a todo (toggle / rename). Requires `If-Match: <rev>`. */
  router.patch('/api/todos/:id', async (req, res) => {
    const ifMatch = parseIfMatch(req.headers['if-match']);
    if (ifMatch === null) {
      res.status(400).json({ error: { message: 'If-Match required' } });
      return;
    }
    const id = Number(req.params.id);
    const body = (req.body ?? {}) as UpdateTodo;
    const hasChange = body.title !== undefined || body.done !== undefined;
    if (!Number.isInteger(id) || !hasChange) {
      res.status(400).json({ error: { message: 'Invalid request body' } });
      return;
    }
    try {
      const todo = await todoService.updateTodo(id, ifMatch, body);
      if (!todo) {
        res.status(404).json({ error: { message: 'Not found' } });
        return;
      }
      res.json({ data: todo });
    } catch (err) {
      if (err instanceof RevisionConflictError) {
        res.status(412).json({ error: { message: 'Precondition failed: version mismatch' } });
        return;
      }
      if (err instanceof ValidationError) {
        res.status(400).json({ error: { message: err.message } });
        return;
      }
      throw err;
    }
  });

  /** DELETE /api/todos/:id – delete a todo. Requires `If-Match: <rev>`. */
  router.delete('/api/todos/:id', async (req, res) => {
    const ifMatch = parseIfMatch(req.headers['if-match']);
    if (ifMatch === null) {
      res.status(400).json({ error: { message: 'If-Match required' } });
      return;
    }
    const id = Number(req.params.id);
    try {
      if (!Number.isInteger(id) || !(await todoService.deleteTodo(id, ifMatch))) {
        res.status(404).json({ error: { message: 'Not found' } });
        return;
      }
      res.status(204).send();
    } catch (err) {
      if (err instanceof RevisionConflictError) {
        res.status(412).json({ error: { message: 'Precondition failed: version mismatch' } });
        return;
      }
      throw err;
    }
  });

  return router;
}
