# Projekt: myapp

Stack: TypeScript (strict) Monorepo, npm Workspaces.
apps/web = React 19 + Vite (nur UI) · apps/api = Express (REST) · packages/shared = gemeinsame Typen.

## Regeln für dich (KI) – HART

1. Antworte auf Deutsch, Code & Kommentare auf Englisch.
2. Kleine Schritte. Eine Aufgabe = eine kohärente Änderung.
3. Vor Änderungen: relevante Dateien LESEN, nichts annehmen.
4. Keine neuen Dependencies ohne Rückfrage.
5. NIE "fertig" melden oder committen, ohne vorher `npm run check` erfolgreich ausgeführt zu haben:
   `npm run check` = typecheck + lint + test + build in allen Workspaces, bricht bei erstem Fehler ab.
   → `build` ist Pflicht, weil die CI `npm run build --workspaces` ausführt und
   ein fehlendes Script in EINEM Workspace den gesamten Loop bricht.
6. Keine Secrets im Code. Config kommt aus .env (Vorlage: .env.example).
7. Bei Unsicherheit: Frage stellen statt raten.
8. Git: Conventional Commits (feat:, fix:, chore:), kurzer deutscher Subject.
   **NIE direkt auf `master` pushen.** Änderungen gehen über einen Pull Request.
   Workflow: Feature-Branch → Commit → Push Branch → **Mensch erstellt PR** → CI grün → Merge.
   **NIE selbst einen Pull Request erstellen** (kein `gh pr create`).
   Am Ende einer Aufgabe: Branch pushen und „fertig, bereit für PR" melden
   inkl. vorgeschlagener PR-Titel und -Body, damit der Mensch sie nur noch einfügen muss.
9. Vor dem ersten Commit in einem neuen Feature-Branch:
   `.github/workflows/ci.yml` LESEN und sicherstellen, dass alle CI-Schritte
   lokal abgedeckt sind (mind. die vier Pflicht-Checks aus Regel 5).
10. Monorepo: Jeder Workspace (apps/_, packages/_) MUSS die Scripts
    `typecheck` · `lint` · `test` · `build` haben.
    Source-only-Pakete (z. B. packages/shared) nutzen ein No-Op:
    `"build": "echo 'no build needed'"`

## Story-Workflow (Pflicht)

- **Single Source of Truth:** GitHub Issues mit Titel `Story-XXXX: <Thema>`.
  Lokale Story-Markdown-Dateien (`docs/stories/`) werden NICHT mehr verwendet.
- **Branch-Naming:** `feature/<beschreibung>` oder `feature/story-XXXX`
- **Commit-Naming:** Story-Referenz IMMER am Anfang:
  `Story-0014: refactor(web): Web in lib/api + useTodos trennen`
  Ohne Story: `fix(api): CORS-Origin-Liste ergänzen`
- **PR-Titel:** `Story-XXXX: <kurze Beschreibung>`
- Vor Beginn: GitHub-Issue öffnen (Status offen)
- Nach Abschluss: Issue schließen (Status completed)

## PR-Workflow (Pflicht)

- **NIE selbst einen PR erstellen** (kein `gh pr create`).
- **NIE selbst mergen.**
- Am Ende einer Aufgabe: Branch pushen und „fertig, bereit für PR" melden
  inkl. vorgeschlagener PR-Titel und -Body.

**Merge-Kriterien (alle Pflicht):**

1. CI grün
2. **Externes LLM-Review** – ein anderes LLM (Claude, ChatGPT, etc.) reviewed
   den PR-Diff **außerhalb** von VS Code / Cline-Kontext. Zweite unabhängige
   Perspektive; fängt Bias und typische LLM-Blindstellen.
3. Feedback eingearbeitet (neuer Commit)
4. Menschliche Freigabe

## Thinking & Reasoning

- Halte interne Denkprozesse (think-Tags) extrem kurz und prägnant (max. 3–5 Sätze).
- Kein Overthinking oder redundante Analyse.
- Direkt zum Punkt: Antwort, Plan oder Code sofort ausgeben.

## Architektur

- Gemeinsame Typen/DTOs immer in packages/shared definieren, nie duplizieren.
- API-Antworten immer in Form: { "data": ... } oder { "error": { "message": ... } }.
- apps/api: Routen in src/routes/, Logik in src/services/.
- apps/web: holt Daten über fetch von der API (URL aus VITE_API_URL).

## Befehle

- dev: npm run dev (web + api parallel)
- check: npm run check (typecheck + lint + test + build, alle Workspaces)
- e2e: npx playwright install chromium && npm run test:e2e -w web

## Memory

- Wichtige Entscheidungen (Stack-Choice, Abweichungen) dokumentierst du
  in docs/DECISIONS.md als Eintrag: Datum · Entscheidung · Begründung.
- Vollständige Regel-Dokumentation: docs/RULES.md
