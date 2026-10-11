# Progress

> Plan & Fortschritt, chronologisch. Neueste Einträge zuerst.
> Status: ✅ fertig · 🔄 in Arbeit · ⬜ offen · ⛔ blockiert

## Ziel

Interaktiver „Click-Dummy“ als TypeScript + React-Boilerplate:
Todo-App mit **komplettem CRUD** (Add / Toggle / Delete), **Bootstrap +
Material Design** Styling und einer schönen Startseite. Vollständig
getestet (Unit + E2E) und CI- grün.

## Plan (Etappen)

| #   | Etappe                                                        | Status |
| --- | ------------------------------------------------------------- | ------ |
| 1   | Progress-Datei anlegen                                        | ✅     |
| 2   | Bootstrap (v5) im Web-Workspace installieren                  | ✅     |
| 3   | Shared-DTOs (`CreateTodo` / `UpdateTodo`)                     | ✅     |
| 4   | API: CRUD-Endpunkte (POST / PATCH / DELETE)                   | ✅     |
| 5   | API-Tests (Vitest + Supertest)                                | ✅     |
| 6   | Web: Bootstrap-Import + Material-Design-CSS                   | ✅     |
| 7   | Web: interaktive `TodoList` (Add / Toggle / Delete)           | ✅     |
| 8   | Web-Unit-Tests (RTL)                                          | ✅     |
| 9   | E2E: Baseline (Playwright) – Interaktionen per RTL-Tests      | ✅     |
| 10  | Docs: README + DECISIONS + `.vscode` aufräumen                | ✅     |
| 11  | Full-Chain (typecheck/lint/test/e2e) + Commit                 | ✅     |
| 12  | UX: Skeleton-Loading, Empty-State, Error-State mit Retry      | ✅     |
| 13  | UX: Material-Toast (Erfolg/Fehler)                            | ✅     |
| 14  | Web-Tests: neue States (Skeleton, Empty, Error, Toast, Retry) | ✅     |
| 15  | Full-Chain final (typecheck/lint/test/e2e)                    | ✅     |

## Changelog

### 2026-10-11 — UX-States (Skeleton, Empty, Error+Retry, Toast)

- **Skeleton Loading**: Animierter Lade-State (3 pulsierende Bars) mit
  `aria-busy="true"` und `aria-label="Lädt…"`.
- **Error-State**: Vollbild-Fehleransicht mit Icon, Fehlermeldung und
  „Erneut versuchen“-Button. Bei partiellen Fehlern (Liste geladen,
  aber Mutation gescheitert) zusätzlich Alert mit Retry-Button.
- **Empty-State**: Freundlicher Hinweis mit Icon, wenn keine Todos vorhanden.
- **Material Toast**: Slide-in-Toast (2,5 s Auto-Dismiss) mit `toast-success`
  / `toast-error` Varianten und Material-Elevation.
- **CSS**: Skeleton-Pulse, Toast-Animation, Empty-/Error-States in
  `index.css` als Material-3-Styles.
- **Tests (neu)**:
  - Skeleton sichtbar solange Fetch offen ist, verschwindet nach Response
  - Empty-State bei leerer Liste
  - Error-State mit Retry-Button, Retry ruft Fetch erneut auf
  - Success-Toast nach Add und Delete
  - Alle 11 Web-Tests grün

### 2026-10-11 — Interaktivität + Bootstrap Material Design

- Bootstrap v5 (CSS) im Web-Workspace installiert, Material-3-Styling
  (Roboto, Elevation, Primary-Farbe) via `src/index.css`.
- `packages/shared`: DTOs `CreateTodo` / `UpdateTodo` ergänzt.
- API (in-memory CRUD):
  - `POST /api/todos` → 201 `{ data: Todo }` (Validierung: `title` non-empty)
  - `PATCH /api/todos/:id` → 200 `{ data: Todo }` (Toggle / Umbenennen)
  - `DELETE /api/todos/:id` → 204 (Unknown-ID → 404 ApiError)
- Web: `TodoList` interaktiv (Add-Form, Checkbox-Toggle, Delete-Button),
  Start-Page als Material-Card.
- Tests: API-CRUD (Unit) + Web-Interaktion (RTL) + E2E (Add/Toggle/Delete).
- Docs: README + DECISIONS aktualisiert, `.vscode/extensions.json`
  Tailwind-Empfehlung entfernt.
