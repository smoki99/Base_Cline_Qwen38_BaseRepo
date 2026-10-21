/** Todo domain logic – input validation and delegation to an injected `TodoStore`. */
import type { CreateTodo, Todo, UpdateTodo } from 'shared';
import type { TodoStore } from './todoStore';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TodoService {
  private readonly store: TodoStore;

  constructor(store: TodoStore) {
    this.store = store;
  }

  async getTodos(): Promise<Todo[]> {
    return this.store.list();
  }

  async createTodo(input: CreateTodo): Promise<Todo> {
    if (typeof input.title !== 'string' || input.title.trim() === '') {
      throw new ValidationError('Title darf nicht leer sein.');
    }
    return this.store.create({ title: input.title.trim() });
  }

  async updateTodo(id: number, expectedRev: number, input: UpdateTodo): Promise<Todo | undefined> {
    // Validate all fields before any mutation (all-or-nothing)
    if (input.title !== undefined) {
      if (typeof input.title !== 'string' || input.title.trim() === '') {
        throw new ValidationError('Title darf nicht leer sein.');
      }
    }
    if (input.done !== undefined && typeof input.done !== 'boolean') {
      throw new ValidationError('Done muss ein boolean Wert sein.');
    }

    const patch: UpdateTodo = {};
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.done !== undefined) patch.done = input.done;
    return this.store.update(id, expectedRev, patch);
  }

  async deleteTodo(id: number, expectedRev: number): Promise<boolean> {
    return this.store.remove(id, expectedRev);
  }
}
