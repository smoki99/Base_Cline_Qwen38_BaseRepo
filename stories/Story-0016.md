# Story-0016: Vitest-Coverage mit Schwellwert

**Status:** ⬜ offen
**Priority:** Medium
**Bereich:** `apps/server`, `apps/web`
**Review-Befund:** Kein Coverage-Reporting, keine Schwellwerte –
Ungetestetes Code wächst unbemerkt.

## Kontext

`vitest` läuft bereits; `@vitest/coverage-v8` fehlt in den Deps. Ein
Coverage-Schwellwert (z. B. 80 %) in `vitest.config.ts` erzwingt, dass
neuer Code getestet wird.

## Akzeptanzkriterien

- [ ] `apps/server`: `@vitest/coverage-v8` in DevDeps; `vitest.config.ts` mit:

  coverage: { provider: 'v8', thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 } }

- [ ] `apps/web`: dito (inkl. `useTodos`, `lib/api`)
- [ ] `npm run test -- --coverage` zeigt den Report; Abbruch unterhalb
      Schwellwert
- [ ] README: `npm run test -- --coverage` als optionales Gate

## Tasks

- [ ] `cd apps/server && npm i -D @vitest/coverage-v8`
- [ ] `vitest.config.ts`: Coverage-Block
- [ ] `apps/web`: `npm i -D @vitest/coverage-v8`; `vitest.config.ts`
- [ ] `npm test -- --coverage` in beiden Apps

## Definition of Done

`npm run check` grün; Coverage-Report zeigt ≥ 80 % in `apps/server` und
`apps/web`.
