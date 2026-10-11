Führe nacheinander aus: `npm run typecheck`, `npm run lint`, `npm test`,
`npm run test:e2e -w web` (Playwright-Headless-Baseline; API+Web starten automatisch).
Bei Fehlern: behebe sie und wiederhole, bis alles grün ist.
Hinweis: E2E braucht einmalig `npx playwright install chromium` (Browser-Binaries).

Danach: `git status` und `git diff --staged` (oder `git diff`) prüfen,
um die geänderten Dateien zu verstehen.

Erstelle dann einen Conventional Commit:

**Format:**

```
Story-XXXX: <type>(<scope>): <kurzes deutsches Subject>
```

- Story-Referenz IMMER am Anfang (ermöglicht `git log --grep="Story-0014"`)
- Typen: feat, fix, chore, refactor, docs, test, perf
- Scope: optional, z. B. `(api)`, `(web)`, `(shared)`
- Subject: kurz, aktiv, deutsch, max. ~70 Zeichen
- Body (optional): nur wenn die Änderung nicht selbst-erklärend ist,
  ebenfalls auf Deutsch, Zeilen max. ~100 Zeichen.

**Beispiele:**

```
Story-0014: refactor(web): Web in lib/api + useTodos-Hook trennen
Story-0011: feat(api): Coverage-Schwellwert einrichten
fix(api): CORS-Origin-Liste für Produktion ergänzen
chore: ESLint-Config auf flat config migrieren
```

Führe `git add -A && git commit -m "<message>"` aus.
Melde kurz: was committed wurde (Commit-Hash + Subject).
