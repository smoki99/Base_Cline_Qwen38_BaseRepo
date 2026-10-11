# API – Referenz

> **Basis-URL (dev):** `http://localhost:3001`
> **Content-Type:** `application/json`
> **Antwort-Envelope:** `{ "data": ... }` bei Erfolg · `{ "error": { "message": "..." } }` bei Fehlern

---

## Endpunkte

### GET /health

Liveness-Probe – prüft, ob die API erreichbar ist.

**Response `200`**

```json
{ "data": { "status": "ok", "uptime": 42.13 } }
```

---

### GET /api/todos

Listet alle Todos auf.

**Response `200`**

```json
{
  "data": [
    { "id": 1, "title": "Einkaufen", "done": false },
    { "id": 2, "title": "Code review", "done": true }
  ]
}
```

---

### POST /api/todos

Legt ein neues Todo an.

**Request-Body**

| Feld    | Typ    | Pflicht | Beschreibung       |
| ------- | ------ | ------- | ------------------ |
| `title` | string | ✅      | Titel (nicht leer) |

```json
{ "title": "Einkaufen" }
```

**Response `201`**

```json
{ "data": { "id": 3, "title": "Einkaufen", "done": false } }
```

**Fehler**

| Status | Körper                                                      | Bedingung         |
| ------ | ----------------------------------------------------------- | ----------------- |
| `400`  | `{ "error": { "message": "Title darf nicht leer sein." } }` | Body fehlt / leer |

---

### PATCH /api/todos/:id

Aktualisiert ein bestehendes Todo (Titel und/oder `done`-Flag).

**Path-Parameter**

| Parameter | Typ    | Beschreibung |
| --------- | ------ | ------------ |
| `id`      | number | ID des Todos |

**Request-Body** (mindestens ein Feld)

| Feld    | Typ     | Beschreibung      |
| ------- | ------- | ----------------- |
| `title` | string  | Neuer Titel       |
| `done`  | boolean | Fertig-Markierung |

```json
{ "done": true }
```

```json
{ "title": "Umformuliert", "done": false }
```

**Response `200`**

```json
{ "data": { "id": 3, "title": "Einkaufen", "done": true } }
```

**Fehler**

| Status | Körper                                               | Bedingung                   |
| ------ | ---------------------------------------------------- | --------------------------- |
| `400`  | `{ "error": { "message": "Invalid request body" } }` | Body leer / ungültige ID    |
| `404`  | `{ "error": { "message": "Not found" } }`            | Todo mit ID existiert nicht |

---

### DELETE /api/todos/:id

Löscht ein Todo.

**Path-Parameter**

| Parameter | Typ    | Beschreibung |
| --------- | ------ | ------------ |
| `id`      | number | ID des Todos |

**Response `204`** – kein Body.

**Fehler**

| Status | Körper                                    | Bedingung            |
| ------ | ----------------------------------------- | -------------------- |
| `404`  | `{ "error": { "message": "Not found" } }` | Todo existiert nicht |

---

## Fehler-Format (gemeinsam)

Alle Fehlerantworten folgen demselben Schema:

```json
{ "error": { "message": "<menschleserbare Beschreibung>" } }
```

| Status | Bedeutung                           |
| ------ | ----------------------------------- |
| `400`  | Ungültige Anfrage (Body, Parameter) |
| `404`  | Ressource nicht gefunden            |

---

## Typ-Referenz (packages/shared)

| Typ              | Definition                                     |
| ---------------- | ---------------------------------------------- |
| `Todo`           | `{ id: number; title: string; done: boolean }` |
| `CreateTodo`     | `{ title: string }`                            |
| `UpdateTodo`     | `{ title?: string; done?: boolean }`           |
| `ApiResponse<T>` | `{ data: T }`                                  |
| `ApiError`       | `{ error: { message: string } }`               |
| `ApiResult<T>`   | `ApiResponse<T> \| ApiError`                   |

> Quelle: `packages/shared/src/index.ts`
