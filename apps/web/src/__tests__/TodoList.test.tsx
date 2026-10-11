import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoList from '../components/TodoList';

const mockTodos = [
  { id: 1, title: 'Learn TypeScript', done: true },
  { id: 2, title: 'Build an API', done: false },
];

function ok(body: unknown, status = 200) {
  return { ok: true, status, json: () => Promise.resolve(body) };
}

describe('TodoList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('renders the todo list with fetched items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ data: mockTodos })));

    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByTestId('todo-list')).toBeInTheDocument();
    });

    expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Build an API')).toBeInTheDocument();
    expect(screen.getByTestId('todo-1')).toBeInTheDocument();
    expect(screen.getByTestId('todo-2')).toBeInTheDocument();
  });

  it('shows the API error state with retry button when the response is an ApiError (regression)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Something went wrong' } }),
      })
    );

    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /erneut versuchen/i })).toBeInTheDocument();
    expect(screen.queryByTestId('todo-list')).not.toBeInTheDocument();
  });

  it('shows a status-based error state with retry button when response is not ok (regression)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve({}) })
    );

    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/503/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /erneut versuchen/i })).toBeInTheDocument();
    expect(screen.queryByTestId('todo-list')).not.toBeInTheDocument();
  });

  it('shows a skeleton while loading', async () => {
    let resolveFetch!: (value: unknown) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
      )
    );

    const { container } = render(<TodoList />);

    // Skeleton is visible while fetch is pending
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton-bar')).toHaveLength(3);

    // Resolve fetch to finish loading
    resolveFetch({ ok: true, status: 200, json: () => Promise.resolve({ data: mockTodos }) });
    await screen.findByTestId('todo-list');
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no todos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ data: [] })));

    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/keine todos/i)).toBeInTheDocument();
    expect(screen.queryByTestId('todo-list')).not.toBeInTheDocument();
  });

  it('shows a success toast after adding a todo', async () => {
    const created = { id: 99, title: 'Ship it', done: false };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        if (init?.method === 'POST') return ok({ data: created }, 201);
        return ok({ data: mockTodos });
      })
    );

    render(<TodoList />);
    await screen.findByTestId('todo-list');

    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /new todo/i }), 'Ship it');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await screen.findByTestId('toast');
    expect(screen.getByTestId('toast')).toHaveTextContent(/hinzugefügt/i);
    expect(screen.getByTestId('toast')).toHaveClass('toast-success');
  });

  it('shows a success toast after deleting a todo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        if (init?.method === 'DELETE')
          return { ok: true, status: 204, json: () => Promise.resolve({}) };
        return ok({ data: mockTodos });
      })
    );

    render(<TodoList />);
    await screen.findByTestId('todo-list');

    const user = userEvent.setup();
    await user.click(within(screen.getByTestId('todo-2')).getByRole('button', { name: /delete/i }));

    await screen.findByTestId('toast');
    expect(screen.getByTestId('toast')).toHaveTextContent(/gelöscht/i);
  });

  it('calls fetch again when retry button is clicked in error state', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server down' } }),
      })
      .mockResolvedValueOnce(ok({ data: mockTodos }));
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoList />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    // Click retry
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /erneut versuchen/i }));

    // Should now show the list
    await screen.findByTestId('todo-list');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('adds a new todo via POST and shows it in the list', async () => {
    const created = { id: 99, title: 'Ship it', done: false };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        if (init?.method === 'POST') return ok({ data: created }, 201);
        return ok({ data: mockTodos });
      })
    );

    render(<TodoList />);
    await screen.findByTestId('todo-list');

    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /new todo/i }), 'Ship it');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await screen.findByText('Ship it');
    expect(screen.getByRole('textbox', { name: /new todo/i })).toHaveValue('');
  });

  it('toggles a todo via PATCH and reflects the state', async () => {
    const item = { id: 2, title: 'Build an API', done: false };
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      if (init?.method === 'PATCH') return ok({ data: { ...item, done: true } });
      return ok({ data: [item] });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoList />);
    const checkbox = await screen.findByRole('checkbox', { name: /build an api/i });

    const user = userEvent.setup();
    await user.click(checkbox);

    await waitFor(() => expect(checkbox).toBeChecked());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/todos/2'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('ignores a second toggle while the first PATCH is still in-flight', async () => {
    const item = { id: 1, title: 'Test', done: false };
    let resolvePatch!: (value: unknown) => void;
    const fetchMock = vi.fn(((_input: unknown, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return new Promise((resolve) => {
          resolvePatch = resolve;
        });
      }
      return Promise.resolve(ok({ data: [item] }));
    }) as unknown as typeof fetch);
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoList />);
    const checkbox = await screen.findByRole('checkbox', { name: /test/i });
    const user = userEvent.setup();

    await user.click(checkbox); // first toggle – starts PATCH
    await user.click(checkbox); // second toggle – should be ignored

    const patchCalls = fetchMock.mock.calls.filter((c) => c[1]?.method === 'PATCH');
    expect(patchCalls).toHaveLength(1);

    resolvePatch(ok({ data: item }));
  });

  it('rolls back to original state when the in-flight PATCH fails', async () => {
    const item = { id: 1, title: 'Test', done: false };
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return {
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: { message: 'Server error' } }),
        };
      }
      return ok({ data: [item] });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoList />);
    const checkbox = await screen.findByRole('checkbox', { name: /test/i });
    const user = userEvent.setup();

    await user.click(checkbox);

    // State should be rolled back to original (unchecked)
    await waitFor(() => expect(checkbox).not.toBeChecked());
  });

  it('allows toggling again after the in-flight PATCH completes', async () => {
    const item = { id: 1, title: 'Test', done: false };
    let resolvePatch!: (value: unknown) => void;
    const fetchMock = vi.fn(((_input: unknown, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return new Promise((resolve) => {
          resolvePatch = resolve;
        });
      }
      return Promise.resolve(ok({ data: [item] }));
    }) as unknown as typeof fetch);
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoList />);
    const checkbox = await screen.findByRole('checkbox', { name: /test/i });
    const user = userEvent.setup();

    await user.click(checkbox); // first toggle – starts PATCH
    await user.click(checkbox); // second toggle – ignored (in-flight)

    resolvePatch(ok({ data: { ...item, done: true } }));
    await Promise.resolve(); // let the microtask queue flush

    await user.click(checkbox); // third toggle – should work (lock released)

    const patchCalls = fetchMock.mock.calls.filter((c) => c[1]?.method === 'PATCH');
    expect(patchCalls).toHaveLength(2);
  });

  it('allows toggling different todos in parallel', async () => {
    const todos = [
      { id: 1, title: 'First', done: false },
      { id: 2, title: 'Second', done: false },
    ];
    let patchCount = 0;
    const resolvers: Array<(value: unknown) => void> = [];
    const fetchMock = vi.fn(((_input: unknown, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        patchCount++;
        return new Promise((resolve) => {
          resolvers.push(resolve);
        });
      }
      return Promise.resolve(ok({ data: todos }));
    }) as unknown as typeof fetch);
    vi.stubGlobal('fetch', fetchMock);

    render(<TodoList />);
    const cb1 = await screen.findByRole('checkbox', { name: /first/i });
    const cb2 = screen.findByRole('checkbox', { name: /second/i });
    const user = userEvent.setup();

    await user.click(cb1);
    await user.click(await cb2);

    expect(patchCount).toBe(2); // both PATCHes sent in parallel

    resolvers.forEach((r) => r(ok({ data: todos[0] })));
  });

  it('deletes a todo via DELETE and removes it from the list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        if (init?.method === 'DELETE')
          return { ok: true, status: 204, json: () => Promise.resolve({}) };
        return ok({ data: mockTodos });
      })
    );

    render(<TodoList />);
    await screen.findByTestId('todo-list');

    const user = userEvent.setup();
    await user.click(within(screen.getByTestId('todo-2')).getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(screen.queryByTestId('todo-2')).not.toBeInTheDocument());
    expect(screen.getByTestId('todo-1')).toBeInTheDocument();
  });
});
