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

**Story-0019: Optimistic Locking (If-Match/rev) + Race-Handling im Web-Client** – [#61](https://github.com/smoki99/Base_Cline_Qwen38_BaseRepo/issues/61)

Ziel: Zwei Clients (oder ein Client + Reload) können denselben Todo gleichzeitig
ändern – ohne Versions-Vertrag gewinnt das blinde letzte Schreiben (Lost Update)
und der Client zeigt danach veralteten Zustand. Diese Story führt ein
`rev`-Versionsfeld (Teil des `Todo`-Vertrags in `shared`) ein: PATCH/DELETE
erfordern `If-Match: <rev>`, der Server antwortet bei Missmatch mit
`412 Precondition Failed` (`{ error: { message } }`); `2xx`-Responses sind
kanonisch und der Client ersetzt damit die lokale Entity. Der Web-Client
(`useTodos`) löst 412 mit Reload der Liste + sichtbarem Konflikt-Fehler auf
(kein stummes Snapshot-Rollback); andere Fehler bleiben bei
Optimistic-Update + Rollback. Inflight-Lock pro Todo bleibt bestehen.

## Einzeltasks/Steps

| #   | Task                                                                                                             | Status |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `shared`: `Todo.rev` (Vertragsfeld, ≥ 1), Doku-Vertrag                                                           | ✅     |
| 2   | `todoStore`: `rev` (Create=1, Update/Remove erwarten `expectedRev`), 412-Fehlertyp                               | ✅     |
| 3   | `todoService`/`routes`: `If-Match`-Parsing (400 fehlend/ungültig), 412 bei Missmatch (PATCH + DELETE)            | ✅     |
| 4   | `web/lib/api.ts`: `If-Match`-Header (update/delete), 412 → `ConflictError`                                       | ✅     |
| 5   | `useTodos`: 2xx → lokale Entity durch Server-Antwort ersetzen; 412 → Reload + Fehler sichtbar; 5xx → Rollback    | ✅     |
| 6   | Tests: Store (rev/412/Restart), Service, Routes (If-Match-Vertrag PATCH + DELETE), Api-Client, Hook (renderHook) | ✅     |
| 7   | Doku: DECISIONS.md-Eintrag (If-Match/rev-Vertrag)                                                                | ✅     |
| 8   | `npm run check` + E2E grün, Commit, Push, „bereit für PR“                                                        | ✅     |

## Status-Log

_(neueste oben)_

- 2026-10-21 – **Story-0019** (Issue #61) implementiert: `rev`-Vertrag (shared/api),
  `If-Match`/412 auf PATCH + DELETE, `ConflictError` im Api-Client, `useTodos`
  (2xx → kanonische Entity, 412 → Reload + Fehler sichtbar, 5xx → Rollback),
  Hook-Tests (renderHook) neu. `npm run check` grün (API 63 + Web 35 Tests),
  E2E 6/6 (isolierte Ports 4011/5183). Hinweis: E2E mit Default-Port 5173
  kollidiert mit fremdem Vite-Prozess auf der Dev-Maschine (`reuseExistingServer`)
  → isolierte Ports verwenden. Commit + Push, „fertig, bereit für PR“.
- 2026-10-21 – Validierung grün: `npm run check` (alle Gates) + E2E 6/6 in zwei
  Runs (Deterministik). Gefeixt: E2E-Store lag in Playwrights verwalteter
  `test-results/`-Dir (Playwright wipet sie → ENOENT auf persist) → Verlagerung
  nach `apps/web/e2e-data/` + `persist()`-Härtung (mkdir) + Regressionstest.
  Commit + Push, „fertig, bereit für PR“.
- 2026-10-21 – Spec (Issue #60) erstellt, Freigabe „GO“ erhalten; Implementation
  (Tasks 1–8) im Arbeitsbaum, Doku-Sync erledigt.
