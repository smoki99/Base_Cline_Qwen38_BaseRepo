/** Test factory: Express app wired with a fresh in-memory store (no FS, isolated state). */
import { createApp } from '../app';
import { TodoService } from '../services/todoService';
import { InMemoryTodoStore } from '../services/todoStore';

export function createTestApp() {
  return createApp(new TodoService(new InMemoryTodoStore()));
}
