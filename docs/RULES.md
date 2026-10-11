# KI-Regeln (Projekt: myapp)

> Kanonische Regeln für alle KI-Agenten (Cline, Copilot, etc.).
> Diese Datei wird bei jedem Agent-Run automatisch geladen.

---

## 1. Sprache

- Antworte auf **Deutsch**.
- Code & Kommentare auf **Englisch**.

## 2. Arbeitsweise

- Kleine Schritte. **Eine Aufgabe = eine kohärente Änderung.**
- Vor Änderungen: **relevante Dateien LESEN**, nichts annehmen.
- Keine neuen Dependencies ohne Rückfrage.
- Bei Unsicherheit: **Frage stellen** statt raten.

## 3. Qualitäts-Gate (vor JEDEM Commit)

> NIE „fertig" melden oder committen, ohne vorher **ALLE** Checks erfolgreich ausgeführt zu haben:

```bash
npm run check   # typecheck + lint + test + build – alle Workspaces, bricht bei erstem Fehler ab
```

**Warum `build`?**
Die CI (`npm run build --workspaces`) erwartet ein `build`-Script in JEDEM Workspace.
Ein fehlendes Script bricht den CI-Loop – auch wenn typecheck/lint/test grün sind.

**Zusätzlich bei E2E-relevanten Änderungen:**

```bash
npx playwright install chromium   # einmalig, Browser-Binaries
npm run test:e2e -w web
```

## 4. CI-Parität

> **Bevor** der erste Commit in einem neuen Feature-Branch erfolgt:

1. `.github/workflows/ci.yml` **lesen**
2. Alle CI-Schritte lokal abbilden (mind. die vier Pflicht-Checks oben)
3. Falls neue CI-Schritte hinzugekommen sind: lokal testen

**Grundregel:** Was in der CI läuft, muss lokal grün sein – und umgekehrt.

## 5. Architektur

- Gemeinsame Typen/DTOs **immer** in `packages/shared` – nie duplizieren.
- API-Antworten: `{ "data": ... }` oder `{ "error": { "message": ... } }`.
- `apps/api`: Routen in `src/routes/`, Logik in `src/services/`.
- `apps/web`: holt Daten via `fetch` (URL aus `VITE_API_URL`).

## 6. Git & Commits

### Commit-Format

```
Story-XXXX: <type>(<scope>): <kurzes deutsches Subject>
```

- **Story-Referenz IMMER am Anfang** – ermöglicht
  `git log --grep="Story-0014"` für die vollständige Story-Historie.
- Typen: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`
- Scope: optional – `(api)`, `(web)`, `(shared)`
- Subject: kurz, aktiv, **deutsch**, max. ~70 Zeichen
- Body (optional): nur bei nicht selbst-erklärenden Änderungen, Zeilen max. ~100 Zeichen.

Beispiele:

```
Story-0014: refactor(web): Web in lib/api + useTodos-Hook trennen
Story-0011: feat(api): Coverage-Schwellwert einrichten
fix(api): CORS-Origin-Liste für Produktion ergänzen   ← ohne Story
```

### PR-Workflow

- **NIE direkt auf `master` pushen.** Änderungen gehen ausschließlich über einen Pull Request.
- **NIE selbst einen Pull Request erstellen** (kein `gh pr create`).
- **NIE selbst mergen** – der Mensch entscheidet.

**Vollständiger Workflow:**

| Schritt                                     | Wer             |
| ------------------------------------------- | --------------- |
| Feature-Branch + Commits                    | KI              |
| Branch pushen                               | KI              |
| PR erstellen                                | **Mensch**      |
| **Externes LLM-Review** (außerhalb VS Code) | **Mensch**      |
| CI grün                                     | automatisch     |
| Feedback einarbeiten                        | KI              |
| Merge + Issue schließen                     | **Mensch** + KI |

**Merge-Kriterien (alle Pflicht):**

1. CI grün (typecheck + lint + test + build + e2e)
2. **Externes LLM-Review** durchgeführt – ein anderes LLM (z. B. Claude, ChatGPT)
   reviewed den PR-Diff **außerhalb** des aktuellen Cline-/VS-Code-Kontexts.
   Zweite unabhängige Perspektive; fängt Bias und Blindstellen.
3. LLM-Feedback eingearbeitet (neuer Commit, CI erneut grün)
4. Menschliche Freigabe

### Externes LLM-Review – Ablauf

```bash
# 1. Diff exportieren
gh pr diff <PR-Nummer> > /tmp/pr-diff.txt

# 2. In externes LLM einfügen (Claude, ChatGPT, etc.)
#    Prompt: "Review diesen Diff: Edge Cases, Security, Typsicherheit, Architektur."

# 3. Feedback als PR-Kommentar einfügen
# 4. KI arbeitet Feedback ein → neuer Commit → CI erneut grün
```

## 7. Security & Config

- **Keine Secrets im Code.**
- Config kommt aus `.env` (Vorlage: `.env.example`).
- `npm audit --omit=dev --audit-level=high` vor jedem Merge.

## 8. Dokumentation

- Wichtige Entscheidungen → `docs/DECISIONS.md` (Datum · Entscheidung · Begründung).
- Fortschritt → `docs/PROGRESS.md`.
- Architektur → `docs/ARCHITECTURE.md`.

## 9. Monorepo-Konventionen

- **Jeder Workspace** (`apps/*`, `packages/*`) muss die Pflicht-Scripts haben:
  - `typecheck`
  - `lint`
  - `test`
  - `build` (No-Op `echo '...'` erlaubt für Source-only-Pakete)
- Root-Scripts nutzen `--workspaces` – ein fehlendes Script in EINEM Workspace
  bricht den gesamten Loop.

---

_Letzte Aktualisierung: 2026-10-11_
