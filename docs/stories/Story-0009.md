# Story-0009: CI – timeout-minutes + concurrency

**Status:** ✅ erledigt
**Priority:** High
**Bereich:** `.github/workflows/ci.yml`
**Phase:** 2 – CI-Hygiene

## Kontext

`permissions` ist schon gesetzt (`contents: read`, `actions: write`).
Es fehlen noch `timeout-minutes` und `concurrency` in `ci.yml`.

## Akzeptanzkriterien

- [x] `ci.yml`: `timeout-minutes: 15` auf Job-Ebene
- [x] `ci.yml`: `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`
- [x] CI bleibt grün nach Änderung

## Tasks

- [x] `ci.yml`: `timeout-minutes: 15` unter `jobs.ci` ergänzen
- [x] `ci.yml`: `concurrency`-Block ergänzen
- [x] Push → CI läuft, zweiter Push auf denselben Branch cancelt den ersten

## Definition of Done

- [x] `ci.yml` enthält `timeout-minutes` und `concurrency`
- [x] CI-Run erfolgreich
- [x] `npm run typecheck && npm run lint && npm test && npm run build`
