# PROGRESS – Arbeits-Log der aktuellen Story

> Dieses Root-Dokument ist das **kurzlebige Arbeits-Log für die aktuelle
> Entwicklung** (Plan, Einzeltasks, Status-Log während der Umsetzung).
>
> **Bei jeder neuen Story/Entwicklung hier befüllen:**
>
> 1. **Ziel & Scope** – 2–4 Sätze, was die Story liefert
> 2. **Einzeltasks/Steps** – nummerierte Checkliste mit Status (✅/⏳)
> 3. **Status-Log** – Zeitstempel + was wann passiert ist
> 4. **Risiken & offene Fragen** – falls relevant
>
> **Abschluss:** Nach Abschluss der Story wird das Log hier nicht weiter
> gepflegt – der dauerhafte Verweis ist [`docs/PROGRESS.md`](docs/PROGRESS.md)
> (chronologisches Projekt-Log; Single Source of Truth: GitHub-Issues
> `Story-XXXX`). Ältere Story-Logs bleiben in der Git-Historie erhalten.
>
> (Konvention importiert aus `Base_Chat_WebUI`, Story-0017)

## Aktuelle Story

**Story-0018: TodoStore-Vertrag + persistente Datei-Store (ID-Stabilität)** – [#60](https://github.com/smoki99/Base_Cline_Qwen38_BaseRepo/issues/60)

Ziel: Die API hat keinen Speicher-Vertrag – `todoService` hielt `todos`/`nextId` als
modulweite Mutable State, nach einem Restart waren alle Todos weg. Diese Story führt
den `TodoStore`-Vertrag (Interface) mit `InMemoryTodoStore` (Tests) und `FileTodoStore`
(JSON, atomare Schreibweise) ein; `todoService`/`routes`/`app` werden DI-fähig
(Factory-Pattern). ID-Vertrag: server-assigned, monoton steigend (persistierter
High-Watermark `maxId`), stabil über Restarts, nie wiederverwendet. Korrupte Datei =
Fail-Fast mit klarer Meldung. E2E nutzt eine isolierte `TODO_DATA_FILE`.

## Einzeltasks/Steps

| #   | Task                                                                                                                | Status |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `TodoStore`-Interface + ID-/Concurrency-Vertrag (dokumentiert)                                                      | ✅     |
| 2   | `BaseTodoStore` (serialized Mutations) + `InMemoryTodoStore` (Seed, defensive Copies)                               | ✅     |
| 3   | `FileTodoStore`: `open()`, Seed bei Erststart, Format `{v:1, maxId, todos}`, atomares Persistieren                  | ✅     |
| 4   | Korruptionsfälle → `CorruptStoreError`; `index.ts` Fail-Fast (Exit 1, klare Meldung)                                | ✅     |
| 5   | DI-Refactor: `createTodoRouter(service)`, `createApp(service)`, `TodoService`-Class                                 | ✅     |
| 6   | Tests: `todoStore.test.ts` (Restart/ID-Wiederverwendung/Konkurrenz/Atomarität/Korruption), CRUD via `createTestApp` | ✅     |
| 7   | E2E-Isolation: `global-setup.ts` wipet E2E-Daten-Dir, `TODO_DATA_FILE` in `playwright.config.ts`                    | ✅     |
| 8   | Doku: `.env.example` + README-Env-Tabelle + DECISIONS.md-Eintrag                                                    | ✅     |
| 9   | `npm run check` + E2E grün, Commit, Push, „bereit für PR“                                                           | ✅     |

## Status-Log

_(neueste oben)_

- 2026-10-21 – Validierung grün: `npm run check` (alle Gates) + E2E 6/6 in zwei
  Runs (Deterministik). Gefeixt: E2E-Store lag in Playwrights verwalteter
  `test-results/`-Dir (Playwright wipet sie → ENOENT auf persist) → Verlagerung
  nach `apps/web/e2e-data/` + `persist()`-Härtung (mkdir) + Regressionstest.
  Commit + Push, „fertig, bereit für PR“.
- 2026-10-21 – Spec (Issue #60) erstellt, Freigabe „GO“ erhalten; Implementation
  (Tasks 1–8) im Arbeitsbaum, Doku-Sync erledigt.
