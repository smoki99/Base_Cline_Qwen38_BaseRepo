# Story-Übersicht

**Repo:** myapp – TypeScript Monorepo (Express API + React Web + shared)

## Aktive Stories (0006–0016)

| #    | Titel                                       | Phase          | Status      |
| ---- | ------------------------------------------- | -------------- | ----------- |
| 0006 | `npm run check` (ein Befehl für alle Gates) | 1 – Fundament  | ✅ erledigt |
| 0007 | Express 4 → 5                               | 1 – Fundament  | ✅ erledigt |
| 0008 | Prettier-Check in CI                        | 2 – CI-Hygiene | ✅ erledigt |
| 0009 | CI: timeout-minutes + concurrency           | 2 – CI-Hygiene | ✅ erledigt |
| 0010 | SAST + Secret-Scanning (CodeQL + gitleaks)  | 2 – CI-Hygiene | ⬜ offen    |
| 0011 | Vitest-Coverage mit Schwellwert             | 3 – Quality    | ⬜ offen    |
| 0012 | Security-Header (helmet)                    | 3 – Quality    | ⬜ offen    |
| 0013 | Double-Submit-Prävention (Add + Delete)     | 4 – Web        | ⬜ offen    |
| 0014 | Web: `lib/api.ts` + `useTodos`-Hook         | 4 – Web        | ⬜ offen    |
| 0015 | AGENTS.md (agent-agnostisch) + Guardrails   | 5 – Meta       | ⬜ offen    |
| 0016 | API-Vertrag als `docs/API.md`               | 5 – Meta       | ⬜ offen    |

## Abgeschlossene Stories

| #    | Titel                                      | Status      |
| ---- | ------------------------------------------ | ----------- |
| 0001 | Todo-Validierung (POST/PATCH)              | ✅ erledigt |
| 0002 | CORS-Rejection → 403                       | ✅ erledigt |
| 0003 | Double-Click-Race (Toggle)                 | ✅ erledigt |
| 0004 | Chore: user-event, shared-Pin, no-op build | ✅ erledigt |
| 0005 | CI Parität + Build-Skripte                 | ✅ erledigt |

## Abgelehnte Stories

| #          | Titel            | Begründung                                                                                                                                                 |
| ---------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0008 (alt) | Rate Limiting    | Falsche Tatsachenbehauptung (`express-rate-limit` existiert nicht); geringer Mehrwert bei In-Memory-Store; neue Dependency für nicht existierendes Problem |
| 0009 (alt) | Fail-Closed CORS | Teilweise redundant (CORS_ORIGIN + 403 existieren schon); Default-Änderung bricht Dev-Workflow                                                             |
| 0013 (alt) | zod-Schemas      | Überkill für 3 Endpunkte; doppelte Validierung neben `ValidationError`; neue Dependency ohne Mehrwert                                                      |
| 0019 (alt) | Guardrails       | 80 % Überschneidung mit Story-0011 (AGENTS.md); in Story-0015 aufgenommen                                                                                  |

## Phasen

```
Phase 1 – Fundament
  0006  npm run check
  0007  Express 5

Phase 2 – CI-Hygiene
  0008  Prettier-Check
  0009  CI timeout/concurrency
  0010  SAST + Secrets

Phase 3 – Quality
  0011  Coverage
  0012  helmet

Phase 4 – Web
  0013  Double-Submit (Add/Delete)
  0014  lib/api.ts + useTodos

Phase 5 – Meta
  0015  AGENTS.md
  0016  API.md
```
