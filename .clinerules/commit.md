Führe nacheinander aus: `npm run typecheck`, `npm run lint`, `npm test`,
`npm run test:e2e -w web` (Playwright-Headless-Baseline; API+Web starten automatisch).
Bei Fehlern: behebe sie und wiederhole, bis alles grün ist.
Hinweis: E2E braucht einmalig `npx playwright install chromium` (Browser-Binaries).

Danach: `git status` und `git diff --staged` (oder `git diff`) prüfen,
um die geänderten Dateien zu verstehen.

Erstelle dann einen Conventional Commit:

- Format: `<type>(<scope>): <kurzes deutsches Subject>`
- Typen: feat, fix, chore, refactor, docs, test, perf
- Scope: optional, z. B. `(api)`, `(web)`, `(shared)`
- Subject: kurz, aktiv, deutsch, max. ~70 Zeichen
- Body (optional): nur wenn die Änderung nicht selbst-erklärend ist,
  ebenfalls auf Deutsch, Zeilen max. ~100 Zeichen.

Beispiele:

```
feat(api): User-Login-Endpunkt hinzufügen
fix(shared): ApiResult-Typ auf optionale Felder erweitern
chore: ESLint-Config auf flat config migrieren
```

Führe `git add -A && git commit -m "<message>"` aus.
Melde kurz: was committed wurde (Commit-Hash + Subject).
