# Architektur

## Überblick

```
┌────────────────────────────────────────────────────────────┐
│  apps/web (React 19 + Vite)                                │
│  – Holt Daten via fetch von der API                        │
│  – VITE_API_URL (aus .env) oder Vite-Proxy in dev          │
│  – Importiert Typen aus packages/shared                    │
└──────────────────────┬─────────────────────────────────────┘
                       │ HTTP / REST
                       ▼
┌────────────────────────────────────────────────────────────┐
│  apps/api (Express)                                        │
│  – src/routes/    → HTTP-Endpunkte (Routen, Validierung)   │
│  – src/services/  → Business-Logik (keine HTTP-Kenntnisse) │
│  – Importiert Typen aus packages/shared                    │
└──────────────────────┬─────────────────────────────────────┘
                       │ import
                       ▼
┌────────────────────────────────────────────────────────────┐
│  packages/shared                                           │
│  – Todo, ApiResponse<T>, ApiError, ApiResult<T>            │
│  – Gemeinsame Typen & DTOs für alle Workspaces             │
│  – Keine eigenen Dependencies (reines TS)                  │
└────────────────────────────────────────────────────────────┘
```

## Gemeinsame Typen (`packages/shared`)

Alle Domänen-Typen und API-DTOs werden **einmalig** in `packages/shared/src/index.ts`
definiert und von beiden Apps importiert:

```ts
// packages/shared/src/index.ts
export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

/** Payload for creating a todo. */
export interface CreateTodo {
  title: string;
}

/** Payload for updating a todo (partial). */
export interface UpdateTodo {
  title?: string;
  done?: boolean;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: { message: string };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

/** Type guard: narrows ApiResult<T> to ApiError. */
export function isApiError<T>(result: ApiResult<T>): result is ApiError;
/** Type guard: narrows ApiResult<T> to ApiResponse<T>. */
export function isApiSuccess<T>(result: ApiResult<T>): result is ApiResponse<T>;
```

### Import-Beispiele

```ts
// apps/api/src/services/todoService.ts
import type { Todo } from 'shared';

// apps/web/src/components/TodoList.tsx
import type { ApiResponse, Todo } from 'shared';
```

> **Regel:** Keine lokalen Typ-Duplikate. Neue Typen/DTOs immer in `packages/shared`.

## API-Antwortformat

Jede API-Antwort folgt strikt diesem Schema:

```json
{ "data": ... }
```

oder bei Fehlern:

```json
{ "error": { "message": "..." } }
```

Die Typen `ApiResponse<T>` und `ApiError` aus `packages/shared` modellieren
dieses Format und werden in der Web-App zur Typisierung der Fetch-Antworten verwendet.

## apps/api – Struktur

| Verzeichnis      | Zweck                                                  |
| ---------------- | ------------------------------------------------------ |
| `src/routes/`    | HTTP-Endpunkte: Routing, Request/Response, Validierung |
| `src/services/`  | Business-Logik: rein, ohne HTTP-Abhängigkeiten         |
| `src/app.ts`     | Express-App-Instanz (export für Tests)                 |
| `src/index.ts`   | Server-Start (`app.listen`)                            |
| `src/__tests__/` | Integrationstests (Vitest + Supertest)                 |

## apps/web – Struktur

| Verzeichnis/Datei      | Zweck                                              |
| ---------------------- | -------------------------------------------------- |
| `src/components/`      | React-Komponenten                                  |
| `src/__tests__/`       | Komponenten-Tests (Vitest + React Testing Library) |
| `src/test/setup.ts`    | Test-Setup (`@testing-library/jest-dom`)           |
| `src/main.tsx`         | React Entry Point                                  |
| `src/index.css`        | Material Design 3 CSS (Bootstrap + MD3-Tokens)     |
| `e2e/`                 | Playwright-E2E-Tests (headless Chromium)           |
| `playwright.config.ts` | E2E-Konfiguration (webServer startet API + Web)    |
| `vite.config.ts`       | Vite-Plugin, Dev-Proxy, Vitest-Config              |
| `index.html`           | Vite HTML-Entry                                    |

### Dev-Proxy

In der Entwicklung proxys Vite `/api/*` auf `http://localhost:3001`,
somit ist `VITE_API_URL` in dev nicht erforderlich.
In Produktion wird `VITE_API_URL` aus der Environment gesetzt.

### CORS & Prod-Deployment

In der Entwicklung proxys Vite `/api/*` auf `http://localhost:3001` (same-origin),
somit ist CORS in dev nicht relevant. In Produktion hängen Web und API typischerweise
an **unterschiedlichen Origins** – hier braucht der Browser CORS-Header oder einen
same-origin-Aufbau. Zwei Wege:

**Option A – CORS-Middleware (separate Origins):**
Die API liefert `Access-Control-Allow-Origin` für erlaubte Origins. Die erlaubten
Origins werden über `CORS_ORIGIN` (kommagetrennt) konfiguriert. Leer = alle Origins
erlauben (**nur für dev**!).

```env
CORS_ORIGIN=https://app.example.com
```

**Option B (empfohlen) – same-origin via Reverse Proxy:**
Web-Static und API werden hinter derselben Domain ausgeliefert (z. B. nginx).
CORS fällt dann komplett weg:

```nginx
server {
  listen 80;
  server_name app.example.com;

  # Web-Static (Build-Output von apps/web)
  location / {
    root /var/www/myapp/web/dist;
    try_files $uri /index.html;
  }

  # API-Proxy
  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

> Empfehlung: **B** als Standard (keine Cross-Origin-Requests), **A** als
> Sicherheitsnetz, falls Web und API tatsächlich an separaten Origins laufen.

## Regeln

1. **Gemeinsame Typen** leben ausschließlich in `packages/shared`.
   Duplizierung von Typen/DTOs ist verboten.

2. **API-Antwortformat** ist strikt:

   ```json
   { "data": ... }
   { "error": { "message": "..." } }
   ```

3. **apps/api**
   - `src/routes/` – HTTP-Endpunkte (Routen-Definition, Validierung)
   - `src/services/` – Business-Logik (keine HTTP-Kenntnisse)

4. **apps/web**
   - Holt Daten über `fetch` von der API (URL: `VITE_API_URL` oder Proxy)
   - Keine direkten Datenbankzugriffe

5. **Konfiguration**
   - Secrets/Config ausschließlich aus `.env`
   - Vorlage: `.env.example`

## Monorepo-Konventionen

- npm Workspaces (keine Yarn/pnpm)
- TypeScript strict + `noUncheckedIndexedAccess`
- Gemeinsamer `tsconfig.base.json`
- ESLint flat config (root) + typescript-eslint
- Prettier für Formatting (Konflikte via `eslint-config-prettier` eliminiert)
- `shared` wird als `"shared": "*"` in die Dependencies der Apps referenziert
