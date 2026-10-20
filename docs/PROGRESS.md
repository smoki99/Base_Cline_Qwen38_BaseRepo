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

### 2026-10-11 — Full-Chain grün (typecheck + lint + test + e2e)

- `apps/server`: `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅
  (2 Test-Suiten, 8 Tests)
- `apps/web`: `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅
  (1 Test-Suite, 7 Tests)
- `playwright/todos.spec.ts`: 6 Tests ✅ (add, toggle, delete, health, ui)
- `npm run build` (web + server) ✅
- Root `npm run lint` ✅ (alle Workspaces)

### 2026-10-11 — E2E-Tests (Playwright) grün

- `playwright.config.ts`: `webServer` startet Vite-Dev-Server auf Port 5173
- `playwright/todos.spec.ts`:
  - `GET /` rendert „Todos“ + „Add a new todo“
  - `POST /api/todos` via UI (Add) → Todo erscheint
  - Toggle via Checkbox → `completed` wechselt
  - Delete via Button → Todo verschwindet
  - `GET /api/health` → `{ "status": "ok" }`
  - UI-Elemente: Input, Button, Liste sind vorhanden
- `npx playwright install chromium` ✅ (Headless Shell)

### 2026-10-11 — Unit-Tests (Vitest + React Testing Library) grün

- `apps/web/src/App.test.tsx`:
  - rendert Überschrift und Input
  - Add-Button ist disabled bei leerem Input
  - Add via UI → Todo erscheint (mocked fetch)
  - Toggle via Checkbox → `completed` wechselt (mocked fetch)
  - Delete via Button → Todo verschwindet (mocked fetch)
  - Health-Check wird beim Mount aufgerufen
  - Input-Value bleibt nach Add leer
- `apps/server/test/api.test.ts`:
  - `GET /api/health` → 200 `{ "status": "ok" }`
  - `GET /api/todos` → 200 Array
  - `POST /api/todos` mit gültigem Body → 201, Todo erstellt
  - `POST /api/todos` mit ungültigem Body → 400
  - `PATCH /api/todos/:id` → 200, `completed` wechselt
  - `PATCH /api/todos/:id` (nicht gefunden) → 404
  - `DELETE /api/todos/:id` → 204, Todo gelöscht
  - `DELETE /api/todos/:id` (nicht gefunden) → 404

### 2026-10-11 — ESLint + Prettier + TypeScript (strikt)

- Root `eslint.config.js`: `typescript-eslint` + `react-hooks` + `import`
- `apps/server`: `@eslint/js` + `typescript-eslint` + `eslint-plugin-import`
- `apps/web`: `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks`
- Prettier: `.prettierrc.json` (root), `.prettierignore`
- TypeScript: `strict: true` in allen `tsconfig.json`

### 2026-10-11 — CI (GitHub Actions)

- `.github/workflows/ci.yml`: `npm ci` → `npm run build` → `npm run lint` →
  `npm test` (alle Workspaces)
- `npm run check` (root): `turbo run typecheck lint test build`

### 2026-10-11 — Agenten-Regeln + Doku

- `.clinerules`: Cline-spezifische Regeln (Projektstruktur, DoD, Guardrails)
- `CLAUDE.md`: Claude-Code-Regeln (Projektübersicht, Commands, Conventions)
- `README.md`: Quick-Start, Architektur, API-Referenz, Tests, CI
- `PROGRESS.md`: Diese Datei (Plan + Changelog)

### 2026-10-11 — Bootstrap + Material Design UI

- `apps/web/src/index.css`: Material-Design-Design-Tokens (Farben,
  Schatten, Typo, `skeleton-pulse`, `toast-in` Keyframes)
- Bootstrap 5.3.3 via CDN in `index.html` (keine Build-Abhängigkeit)
- `App.tsx`: Material-Design-Karten, Elevated-Buttons, Ripples (visuell
  über CSS), Toast-Komponente

### 2026-10-11 — React-Frontend (Vite + React 19)

- `apps/web`: Vite 7 + React 19 + TypeScript 5.8
- `src/main.tsx`, `src/App.tsx`, `src/index.css`
- `index.html`: Bootstrap CDN, Material Icons CDN

### 2026-10-11 — Express-Backend (CRUD-API)

- `apps/server`: Express 4.21 + TypeScript 5.8
- `src/index.ts`: `cors()`, `express.json()`, Health-Endpoint, Error-Handler
- `apps/api/src/routes/todos.ts`: CRUD (`GET/POST /api/todos`, `PATCH/DELETE
/api/todos/:id`), In-Memory-Store
- `src/store.ts`: `TodoStore` (Array + `Map`-Index)
- `npm run dev`: `tsx watch` (Hot-Reload)

### 2026-10-11 — Monorepo-Grundgerüst

- `package.json` (root): npm workspaces (`apps/*`, `packages/*`)
- `turbo.json`: Pipelines für `typecheck`, `lint`, `test`, `build`
- `packages/shared`: Typen (`Todo`, `TodoCreate`, `TodosResponse`),
  `tsconfig.json`, `npm run build` → `dist/`
- `.gitignore`, `.prettierignore`, `.env.example` (root)
