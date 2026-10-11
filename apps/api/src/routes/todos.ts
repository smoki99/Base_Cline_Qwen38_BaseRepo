import { Router } from 'express';
import type { CreateTodo, UpdateTodo } from 'shared';
import * as todoService from '../services/todoService';

const router = Router();

/** GET /api/todos – list all todos. */
router.get('/api/todos', (_req, res) => {
  res.json({ data: todoService.getTodos() });
});

/** POST /api/todos – create a todo. */
router.post('/api/todos', (req, res) => {
  const body = req.body as CreateTodo | undefined;
  if (!body) {
    res.status(400).json({ error: { message: 'Title darf nicht leer sein.' } });
    return;
  }
  try {
    const todo = todoService.createTodo(body);
    res.status(201).json({ data: todo });
  } catch (err) {
    if (err instanceof todoService.ValidationError) {
      res.status(400).json({ error: { message: err.message } });
      return;
    }
    throw err;
  }
});

/** PATCH /api/todos/:id – update a todo (toggle / rename). */
router.patch('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = (req.body ?? {}) as UpdateTodo;
  const hasChange = body.title !== undefined || body.done !== undefined;
  if (!Number.isInteger(id) || !hasChange) {
    res.status(400).json({ error: { message: 'Invalid request body' } });
    return;
  }
  try {
    const todo = todoService.updateTodo(id, body);
    if (!todo) {
      res.status(404).json({ error: { message: 'Not found' } });
      return;
    }
    res.json({ data: todo });
  } catch (err) {
    if (err instanceof todoService.ValidationError) {
      res.status(400).json({ error: { message: err.message } });
      return;
    }
    throw err;
  }
});

/** DELETE /api/todos/:id – delete a todo. */
router.delete('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !todoService.deleteTodo(id)) {
    res.status(404).json({ error: { message: 'Not found' } });
    return;
  }
  res.status(204).send();
});

export { router as todoRouter };
