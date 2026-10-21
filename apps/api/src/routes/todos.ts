import { Router } from 'express';
import type { CreateTodo, UpdateTodo } from 'shared';
import { ValidationError, type TodoService } from '../services/todoService';

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

  /** PATCH /api/todos/:id – update a todo (toggle / rename). */
  router.patch('/api/todos/:id', async (req, res) => {
    const id = Number(req.params.id);
    const body = (req.body ?? {}) as UpdateTodo;
    const hasChange = body.title !== undefined || body.done !== undefined;
    if (!Number.isInteger(id) || !hasChange) {
      res.status(400).json({ error: { message: 'Invalid request body' } });
      return;
    }
    try {
      const todo = await todoService.updateTodo(id, body);
      if (!todo) {
        res.status(404).json({ error: { message: 'Not found' } });
        return;
      }
      res.json({ data: todo });
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(400).json({ error: { message: err.message } });
        return;
      }
      throw err;
    }
  });

  /** DELETE /api/todos/:id – delete a todo. */
  router.delete('/api/todos/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || !(await todoService.deleteTodo(id))) {
      res.status(404).json({ error: { message: 'Not found' } });
      return;
    }
    res.status(204).send();
  });

  return router;
}
