import TodoList from './components/TodoList';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Todo App</h1>
        <p>Interaktiver Click-Dummy · TypeScript + React + Bootstrap Material Design</p>
      </header>

      <section className="card todo-card" aria-label="Todos">
        <div className="card-body">
          <TodoList />
        </div>
      </section>

      <footer className="app-footer">
        Boilerplate · Express-API + React 19 · Unit- &amp; E2E-getestet
      </footer>
    </div>
  );
}
