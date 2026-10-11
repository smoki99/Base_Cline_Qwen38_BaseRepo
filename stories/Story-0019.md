# Story-0019: DoD + Guardrails in Agent-Regeln

**Status:** ⬜ offen
**Priority:** Medium
**Bereich:** `AGENTS.md`, `CLAUDE.md`, `.clinerules`
**Review-Befund:** `CLAUDE.md` und `.clinerules` enthalten Projektregeln,
aber keine expliziten „Guardrails“ (Was **nicht** tun) und keine
Definition of Done pro Story.

## Kontext

KI-Agenten (Cline, Claude Code, Codex) arbeiten zuverlässiger, wenn
Regeln explizit formuliert sind – insbesondere Negativ-Regeln
(„Niemals `any`“, „Kein `console.log` in Produktion“) und ein klares
DoD.

## Akzeptanzkriterien

- [ ] `AGENTS.md` (aus Story-0011) enthält eine `## Guardrails`-Sektion: - Keine `any`-Typen (außer explizit kommentiert) - Kein `console.log`/`console.error` in Produktionscode - Keine Hard-Coded-URLs/Ports (immer aus Env) - Keine neuen Dependencies ohne Begründung im Commit - Tests vor Merge (CI grün)
- [ ] `CLAUDE.md`: Verweis auf `AGENTS.md` + kurze Projektübersicht
- [ ] `.clinerules`: dito (Cline-spezifisch, aber konsistent)
- [ ] Jede Story in `stories/` hat eine `## Definition of Done`-Sektion

## Tasks

- [ ] `AGENTS.md` erstellen (siehe Story-0011) – enthält `## Guardrails`
- [ ] `CLAUDE.md` aktualisieren (Verweis + Übersicht)
- [ ] `.clinerules` aktualisieren (Verweis + Guardrails)
- [ ] Stories 0001–0005 prüfen: DoD vorhanden?

## Definition of Done

Alle drei Agent-Regel-Dateien enthalten Guardrails; alle Stories haben
DoD.
