# Story-0017: Prettier-Check in CI

**Status:** ✅ erledigt (als Story-0008 in `docs/stories/` umgesetzt)
**Priority:** Medium
**Bereich:** `.github/workflows/ci.yml`, `package.json`

> Hinweis: Diese Story wurde als `docs/stories/Story-0008.md` implementiert
> (Commit `e9dfc1b`). Alle Akzeptanzkriterien sind erfüllt.

## Akzeptanzkriterien

- [x] `package.json` (root): `"format:check": "prettier --check ."` und `"format": "prettier --write ."`
- [x] `ci.yml`: neuer Step `Run: npm run format:check` (vor `npm run check`)
- [x] `.prettierrc` existiert und deckt alle Dateien ab
- [x] CI: `format:check` läuft und ist grün

## Tasks

- [x] `package.json`: Scripts ergänzen
- [x] `ci.yml`: Step ergänzen
- [x] `npm run format` (einmalig)
- [x] `.prettierignore` anlegen

## Definition of Done

`npm run check` + `npm run format:check` grün; CI zeigt den Step. ✅
