# Progress

> Projekt-Historie. Offene Aufgaben: [GitHub Issues mit Label `story`](https://github.com/smoki99/Base_Cline_Qwen38_BaseRepo/issues?q=is%3Aissue+label%3Astory)

## Ziel

Interaktiver „Click-Dummy“ als TypeScript + React-Boilerplate:
Todo-App mit **komplettem CRUD** (Add / Toggle / Delete), **Bootstrap +
Material Design** Styling und einer schönen Startseite. Vollständig
getestet (Unit + E2E) und CI- grün.

## Changelog

### 2026-10-11 — UX-States (Skeleton, Empty, Error+Retry, Toast)

- **Skeleton-Loading**: Beim ersten Laden (während `loading=true`) werden
  drei Skeleton-Karten mit pulsierendem Hintergrund (`skeleton-pulse`
  Keyframes) angezeigt – keine flimmernden `null`-Values mehr.
- **Empty State**: Wenn keine Todos existieren, wird eine freundliche
  „Keine Todos“ -Karte mit Icon, Text und CTA-Button „Erste Todo anlegen“
  angezeigt.
- **Error + Retry**: Bei API-Fehlern (Fetch-Fehler, nicht 2xx, Timeout) wird
  eine rote Fehler-Karte mit „Neu laden“ -Button angezeigt; `retry()`
  setzt `loading` auf `true` und rückt `error` zurück auf `null`.
- **Toast (Feedback)**: Nach erfolgreichem Add wird ein grüner
  „Todo angelegt“-Toast für 3 Sekunden eingeblendet (CSS-Animation
  `toast-in`); nach Delete ein neutraler „Todo gelöscht“-Toast. Toasts
  sind ARIA-`role=status` für Screenreader.
- **Guard gegen Double-Submit**: `addTodo()` und `deleteTodo()` haben einen
  `isSubmitting`-Guard (wird in Story-0006 ausgebaut, siehe Backlog).
- **Tests**: `App.test.tsx` – 9 Tests (rendering, add, toggle, delete,
  empty state, error state + retry, toast, skeleton, double-submit-guard).
  Alle grün.
- **E2E**: `playwright/todos.spec.ts` – 6 Tests (initial, add, toggle, delete,
  empty-state, error+retry). Alle grün.
- **Styling**: `skeleton-pulse`, `toast-in`, `empty-state-icon`, `.toast`,
  `.error-card` in `src/index.css`; Bootstrap + Material-Design-Konsistenz
  beibehalten.
- **Typecheck**: `tsc --noEmit` sauber (kein Fehler).
- **Lint**: `eslint` sauber (0 Errors, 0 Warnings).

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
