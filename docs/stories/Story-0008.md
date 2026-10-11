# Story-0008: Prettier-Check in CI

**Status:** ✅ erledigt
**Priority:** Medium
**Bereich:** Root, CI
**Phase:** 2 – CI-Hygiene

## Kontext

`.prettierrc.json` und das `format`-Skript (`prettier --write .`) existieren
schon im Repo. Es fehlt der `format:check`-Skript und der CI-Step.

## Akzeptanzkriterien

- [x] Root `package.json`: `"format:check": "prettier --check ."`
- [x] `.prettierignore`: `node_modules`, `dist`, `coverage`, `package-lock.json`
- [x] CI: neuer Step „Format" → `npm run format:check`
- [x] Bestehender Code ist formatiert (einmaliges `npm run format`)

## Tasks

- [x] `package.json`: `format:check`-Skript ergänzen
- [x] `.prettierignore` anlegen
- [x] `npm run format` einmalig ausführen
- [x] `ci.yml`: Step „Format" nach „Setup" einfügen
- [x] `npm run format:check` → exit 0

## Definition of Done

- [x] `npm run typecheck && npm run lint && npm test && npm run build`
- [x] `npm run format:check` grün
- [x] CI: Format-Step erfolgreich
