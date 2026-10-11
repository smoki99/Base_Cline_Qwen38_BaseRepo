# Progress

> Plan & Fortschritt, chronologisch. Neueste Einträge zuerst.
> Status: ✅ fertig · 🔄 in Arbeit · ⬜ offen · ⛔ blockiert

## Ziel

Interaktiver „Click-Dummy“ als TypeScript + React-Boilerplate:
Todo-App mit **komplettem CRUD** (Add / Toggle / Delete), **Bootstrap +
Material Design** Styling und einer schönen Startseite. Vollständig
getestet (Unit + E2E) und CI- grün.

## Plan (Etappen)

| #   | Etappe                                                      | Status |
| --- | ----------------------------------------------------------- | ------ |
| 1   | Progress-Datei anlegen                                      | ✅     |
| 2   | Monorepo-Grundgerüst (npm workspaces, `packages/shared`)    | ✅     |
| 3   | Express-Backend (`apps/server`) mit CRUD-API                | ✅     |
| 4   | React-Frontend (`apps/web`, Vite + React 19)                | ✅     |
| 5   | Bootstrap + Material Design UI (Startseite)                 | ✅     |
| 6   | Unit-Tests (Vitest, RTL)                                    | ✅     |
| 7   | E2E-Tests (Playwright)                                      | ✅     |
| 8   | CI (GitHub Actions)                                         | ✅     |
| 9   | ESLint + Prettier + TypeScript strikt                       | ✅     |
| 10  | README + Doku + Agenten-Regeln (`.clinerules`, `CLAUDE.md`) | ✅     |
| 11  | UX-States: Skeleton, Empty State, Error+Retry, Toast        | ✅     |
| 12  | Double-Submit-Prävention (Add + Delete)                     | ⬜     |
| 13  | Security-Header (helmet)                                    | ⬜     |
| 14  | Rate-Limiting                                               | ⬜     |
| 15  | Fail-Closed CORS (Production)                               | ⬜     |
| 16  | CI: Least Privilege + Timeout + Concurrency                 | ⬜     |
| 17  | AGENTS.md (agent-agnostisch)                                | ⬜     |
| 18  | `npm run check` (ein Befehl)                                | ⬜     |
| 19  | Validierungs-Schemas (zod) in shared                        | ⬜     |
| 20  | Express 4 → 5                                               | ✅     |
| 21  | Web: `lib/api.ts` + `useTodos`-Hook                         | ⬜     |
| 22  | Vitest-Coverage mit Schwellwert                             | ⬜     |
| 23  | Prettier-Check in CI                                        | ✅     |
| 24  | SAST + Secret-Scanning (CodeQL + gitleaks)                  | ⬜     |
| 25  | DoD + Guardrails in Agent-Regeln                            | ⬜     |
| 26  | API-Vertrag als `docs/API.md`                               | ⬜     |

## Backlog — Härtung (Stories 0006–0020)

| Story                              | Thema                                       | Priorität | Status |
| ---------------------------------- | ------------------------------------------- | --------- | ------ |
| [0006](stories/Story-0006.md)      | Double-Submit-Prävention (Add + Delete)     | High      | ⬜     |
| [0007](stories/Story-0007.md)      | Security-Header (helmet)                    | High      | ⬜     |
| [0008](stories/Story-0008.md)      | Rate-Limiting                               | High      | ⬜     |
| [0009](stories/Story-0009.md)      | Fail-Closed CORS (Production)               | High      | ⬜     |
| [0010](stories/Story-0010.md)      | CI: Least Privilege + Timeout + Concurrency | High      | ⬜     |
| [0011](stories/Story-0011.md)      | AGENTS.md (agent-agnostisch)                | High      | ⬜     |
| [0012](stories/Story-0012.md)      | `npm run check` (ein Befehl)                | High      | ⬜     |
| [0013](stories/Story-0013.md)      | Validierungs-Schemas (zod) in shared        | Medium    | ⬜     |
| [0007](docs/stories/Story-0007.md) | Express 4 → 5                               | Medium    | ✅     |
| [0008](docs/stories/Story-0008.md) | Prettier-Check in CI                        | Medium    | ✅     |
| [0015](stories/Story-0015.md)      | Web: `lib/api.ts` + `useTodos`-Hook         | Medium    | ⬜     |
| [0016](stories/Story-0016.md)      | Vitest-Coverage mit Schwellwert             | Medium    | ⬜     |
| [0018](stories/Story-0018.md)      | SAST + Secret-Scanning (CodeQL + gitleaks)  | Medium    | ⬜     |
| [0019](stories/Story-0019.md)      | DoD + Guardrails in Agent-Regeln            | Medium    | ⬜     |
| [0020](stories/Story-0020.md)      | API-Vertrag als `docs/API.md`               | Medium    | ⬜     |

> Quelle: Code-Review (Qualität / Sicherheit / KI-Fähigkeit), 2026-07-01.
> Reihenfolge-Vorschlag: 0012 → 0006 → 0007 → 0008 → 0009 → 0010 → 0011 → 0013 → 0014 → 0015 → 0016 → 0017 → 0018 → 0019 → 0020.

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
