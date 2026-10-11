# Story-0011: Vitest-Coverage mit Schwellwert

**Status:** ✅ erledigt
**Priority:** Medium
**Bereich:** `apps/api`, `apps/web`
**Phase:** 3 – Quality

## Kontext

Tests existieren, aber die Abdeckung ist unklar. Ein Coverage-Report mit
Schwellwert verhindert, dass neue Code-Pfade ungetestet bleiben.
`@vitest/coverage-v8` ist als neue Dependency freigegeben.

## Akzeptanzkriterien

- [x] `apps/api` und `apps/web`: `@vitest/coverage-v8` in `devDependencies`
- [x] Vitest-Config: `coverage: { provider: 'v8', lines: 80, functions: 80 }`
- [x] `npm run test` zeigt Coverage-Report (Terminal + `coverage/`-Ordner)
- [x] Coverage unter 80 % → CI rot

## Tasks

- [x] `cd apps/api && npm i -D @vitest/coverage-v8`
- [x] `cd apps/web && npm i -D @vitest/coverage-v8`
- [x] Vitest-Config (beide Apps): Coverage-Optionen ergänzen
- [x] `npm test` in beiden Apps → Coverage-Report erscheint
- [x] Ggf. fehlende Tests ergänzen, bis 80 % erreicht

## Definition of Done

- [x] `npm run typecheck && npm run lint && npm test && npm run build`
- [x] Coverage ≥ 80 % (lines + functions) in beiden Apps
- [x] `coverage/`-Ordner in `.gitignore`
