# myapp

TypeScript (strict) Monorepo mit npm Workspaces.

## Stack

| Layer             | Tech                                            |
| ----------------- | ----------------------------------------------- |
| `apps/web`        | React 19 + Vite (nur UI)                        |
| `apps/api`        | Express (REST)                                  |
| `packages/shared` | Gemeinsame Typen & DTOs (reines TS, keine Deps) |

## Struktur

```
myapp/
├── apps/
│   ├── api/                  # Express REST API
│   │   ├── src/
│   │   │   ├── app.ts        # Express App (export für Tests)
│   │   │   ├── index.ts      # Server-Start
│   │   │   ├── routes/       # HTTP-Endpunkte
│   │   │   ├── services/     # Business-Logik
│   │   │   └── __tests__/    # Supertest-Tests
│   │   └── package.json
│   └── web/                  # React + Vite Frontend
│       ├── src/
│       │   ├── components/   # React-Komponenten
│       │   ├── __tests__/    # RTL-Tests (Vitest)
│       │   └── main.tsx      # React Entry
│       ├── e2e/              # Playwright-E2E (headless Chromium)
│       ├── index.html        # Vite Entry
│       ├── playwright.config.ts  # E2E: webServer (API + Web)
│       ├── vite.config.ts    # Proxy + Vitest-Config (e2e/ excluded)
│       └── package.json
├── packages/
│   └── shared/               # Gemeinsame Typen/DTOs
│       ├── src/index.ts      # Todo, ApiResponse, ApiResult
│       └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   └── PROGRESS.md
├── .github/
│   └── workflows/ci.yml      # GitHub Actions (Node 24)
├── .clinerules/
├── .env.example
├── .nvmrc                    # Node 24
├── .editorconfig
├── .prettierrc
├── eslint.config.js
├── package.json
├── tsconfig.base.json
└── LICENSE
```

## Setup

### Voraussetzungen

- **Node.js ≥ 24** (LTS) – siehe `.nvmrc` + `engines` in `package.json`
- **npm ≥ 10** (Node 24 liefert npm 11.x)

### Installation & Start

```bash
# 1. Dependencies installieren
npm install

# 2. Environment-Variabeln kopieren
cp .env.example .env

# 3. (nur für E2E) Playwright-Browser installieren
npx playwright install chromium

# 4. Dev-Server starten (web + api parallel)
npm run dev
```

Danach:

- **Web:** http://localhost:5173
- **API:** http://localhost:3001
- **Health-Check:** http://localhost:3001/health

### Environment-Variablen

| Variable       | Beschreibung                                              | Default                 |
| -------------- | --------------------------------------------------------- | ----------------------- |
| `PORT`         | API-Port                                                  | `3001`                  |
| `CORS_ORIGIN`  | Erlaubte CORS-Origin(s) für die API (prod), kommagetrennt | leer (alle)             |
| `VITE_API_URL` | API-Basis-URL für das Web (prod)                          | `http://localhost:3001` |

> In der Entwicklung übernimmt der **Vite-Proxy** (`/api` → `localhost:3001`),
> `VITE_API_URL` wird dann nicht benötigt.
>
> Für separate Origins in Produktion: `CORS_ORIGIN` auf der API setzen – oder
> (empfohlen) Web + API hinter einem Reverse Proxy (same-origin) ausliefern.
> Details: `docs/ARCHITECTURE.md` → „CORS & Prod-Deployment".

## Befehle

| Command                    | Beschreibung                                                                     |
| -------------------------- | -------------------------------------------------------------------------------- |
| `npm run check`            | **Alle 4 Gates** (typecheck + lint + test + build) – bricht bei erstem Fehler ab |
| `npm run dev`              | Web + API parallel starten (concurrently)                                        |
| `npm run build`            | Alle Workspaces bauen                                                            |
| `npm run lint`             | ESLint auf allen Workspaces                                                      |
| `npm run test`             | Unit-Tests in allen Workspaces (Vitest)                                          |
| `npm run test:e2e`         | Playwright-E2E (headless Chromium); startet API + Web automatisch                |
| `npm run typecheck`        | TypeScript Typecheck (strict)                                                    |
| `npm run knip`             | Dead Code & unused Dependencies detectieren                                      |
| `npm run audit`            | Security-Scan (npm audit, Production-Deps, Level high+)                          |
| `npm run audit:signatures` | Sigstore-Signaturverifikation aller Pakete                                       |
| `npm run size`             | Bundle-Size-Budget prüfen (web ≤ 100 kB gzip)                                    |
| `npm run depcheck`         | Circular-Dependency-Check (Monorepo)                                             |
| `npm run pkg:validate`     | package.json-Struktur in allen Workspaces validieren                             |
| `npm run verify:lockfile`  | Alle installierten Pakete gegen lockfile verifizieren                            |
| `npm run format`           | Prettier formatiert den Code                                                     |

## API

| Method   | Path             | Beschreibung       |
| -------- | ---------------- | ------------------ |
| `GET`    | `/health`        | Liveness-Check     |
| `GET`    | `/api/todos`     | Alle Todos abrufen |
| `POST`   | `/api/todos`     | Neues Todo anlegen |
| `PATCH`  | `/api/todos/:id` | Todo aktualisieren |
| `DELETE` | `/api/todos/:id` | Todo löschen       |

→ Vollständige Doku mit Request/Response-Beispielen: [`docs/API.md`](./docs/API.md)

## Tests

- **Unit (Vitest):** `npm test`
  - `apps/api` via Supertest · `apps/web` via React Testing Library + jsdom.
  - `e2e/**` wird aus dem Vitest-Run explizit ausgeschlossen.
- **E2E (Playwright, headless Chromium):** `npm run test:e2e`
  - Startet **API + Web automatisch** über `webServer` mit Readiness
    (`/health` bzw. Port 5173) – kein manuelles `npm run dev`.
  - Vor dem ersten Lauf einmalig: `npx playwright install chromium`.
  - Deckt ab: `GET /` (200, `text/html`), `GET /index.html` (200),
    React-Mount, seeded-Todos, keine Page-/Console-Errors.

## CI (GitHub Actions)

`.github/workflows/ci.yml` — Trigger: `push` (`master`, `feature/*`),
`pull_request` (`master`), `workflow_dispatch`.

1. `npm ci`
2. `npm audit --omit=dev --audit-level=high`
3. Unexpected-Package-Check (installierte Pakete vs. lockfile)
4. `npm run typecheck`
5. `npm run lint`
6. `npx knip`
7. `npm audit --audit-level=high`
8. `npm run depcheck`
9. `npm run pkg:validate`
10. `npm test` (Unit)
11. `npm run build`
12. `npm run size`
13. `npx playwright install --with-deps chromium`
14. `npm run test:e2e -w web`

Die Actions laufen nativ auf **Node 24** (`actions/checkout@v7`,
`actions/setup-node@v7`).

## Supply Chain Security

| Maßnahme                                  | Wo                                                            |
| ----------------------------------------- | ------------------------------------------------------------- |
| Integrity-Hash (SHA-512)                  | `package-lock.json` – npm verifiziert bei jedem Install       |
| `npm ci` (frozen lockfile)                | CI – schlägt fehl bei inkonsistentem lockfile                 |
| `npm audit --omit=dev --audit-level=high` | Skript + CI – Production-Deps                                 |
| **`npm audit signatures`**                | Skript + CI – Sigstore-Verifikation aller Paket-Signaturen    |
| **Exakte Version-Pinning**                | `.npmrc` → `save-exact=true` – neue Deps werden exakt gepinnt |
| **Corepack `packageManager`**             | `package.json` → `npm@11.8.0` – deterministische npm-Version  |
| **Unexpected-Package-Check**              | CI – vergleicht installierte Pakete mit lockfile              |
| Knip (unused deps)                        | Skript + CI – reduziert Angriffsfläche                        |

### Neues Paket hinzufügen – Checkliste

```bash
# 1. Metadaten & Reputation prüfen
npm view <pkg> maintainers repository time.modified

# 2. Dry-Run: Was würde installiert werden?
npm install --dry-run <pkg>

# 3. Installieren (exakte Version via save-exact)
npm install -D <pkg>

# 4. Lockfile-Diff reviewen
git diff package-lock.json
```

## Git & PR Workflow

### Rollen

| Schritt                  | Wer            | Tool                                          |
| ------------------------ | -------------- | --------------------------------------------- |
| Feature-Branch erstellen | KI             | `git checkout -b feature/...`                 |
| Commits schreiben        | KI             | Conventional Commits                          |
| Branch pushen            | KI             | `git push -u origin feature/...`              |
| PR erstellen             | **Mensch**     | GitHub Web / `gh pr create`                   |
| **Externes LLM-Review**  | **Mensch**     | **Außerhalb VS Code** (z. B. ChatGPT, Claude) |
| CI grün                  | GitHub Actions | automatisch                                   |
| Feedback einarbeiten     | KI             | auf Feature-Branch                            |
| Merge                    | **Mensch**     | GitHub Web / `gh pr merge`                    |
| Issue schließen          | KI             | `gh issue close <#>`                          |
| Feature-Branch löschen   | KI             | `git branch -d` + `git push origin --delete`  |

### Merge-Kriterien (alle Pflicht)

- [ ] CI grün (typecheck + lint + test + build + e2e)
- [ ] **Externes LLM-Review** durchgeführt (außerhalb VS Code / Cline-Kontext)
- [ ] LLM-Feedback eingearbeitet
- [ ] Menschliche Freigabe

### Externes LLM-Review

> Jeder PR wird **vor dem Merge** von einem **externen LLM** (außerhalb von
> VS Code und dem aktuellen Cline-Kontext) reviewed.
>
> **Warum?** Zweite unabhängige Perspektive – kein Bias durch den gleichen
> Kontext, in dem der Code generiert wurde. Fängt typische LLM-Blindstellen
> (Security, Edge Cases, Architektur-Drift).
>
> **So geht's:**
>
> 1. PR-Diff kopieren (`gh pr diff <#>`)
> 2. In ein anderes LLM-Interface einfügen (z. B. Claude, ChatGPT)
> 3. Prompt: _„Review diesen Diff: Edge Cases, Security, Typsicherheit, Architektur."_
> 4. Feedback in den PR als Kommentar einfügen
> 5. KI arbeitet Feedback ein → neuer Commit → CI erneut grün

### Branch-Naming

```
feature/<kurze-beschreibung>
feature/story-XXXX          # für Story-angelegte Aufgaben
feature/process-update      # für Prozess-/Doku-Änderungen
```

### Commit-Naming

```
Story-XXXX: <type>(<scope>): <deutscher Subject>
```

**Story-Referenz IMMER am Anfang** – so lässt sich mit
`git log --grep="Story-0014"` die komplette Commit-Historie einer Story
nachverfolgen und mit dem GitHub-Issue verknüpfen.

Beispiele:

```
Story-0014: refactor(web): Web in lib/api + useTodos-Hook trennen
Story-0011: feat(api): Vitest-Coverage-Schwellwert einrichten
Story-0015: docs(root): AGENTS.md + Guardrails anlegen
```

Ohne Story-Referenz (Prozess-Änderungen, Fix ohne Story):

```
fix(api): CORS-Origin-Liste für Produktion ergänzen
chore: ESLint-Config auf flat config migrieren
```

### PR-Titel

```
Story-XXXX: <kurze Beschreibung>
```

→ Template: [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md)

### Issue-Template

Neue Issues verwenden das Template mit `Story-XXXX: <Thema>` als Titel-Format.

→ Template: [`.github/ISSUE_TEMPLATE/story.md`](./.github/ISSUE_TEMPLATE/story.md)

## Konventionen

- **API-Antworten:** `{ "data": ... }` oder `{ "error": { "message": ... } }`
- **Gemeinsame Typen** immer in `packages/shared` definieren – nie duplizieren
- **Config** ausschließlich aus `.env` (Vorlage: `.env.example`)
- **Git:** Conventional Commits mit deutschen Subjects
