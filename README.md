# Task API

A CRUD API for managing a to-do list, built for the FlyRank Internship —
Backend Track.

- **Week 2 (Assignment A1):** built the API with an in-memory JavaScript
  array as storage.
- **Week 3 (Assignment A2 — this update):** swapped the storage layer to a
  real **SQLite** database. The API itself — routes, request/response
  shapes, status codes — is unchanged; only *where the data lives* changed,
  from a variable in memory to a file on disk (`tasks.db`).

You can create, read, update and delete tasks, and data now **survives a
server restart**.

> This project continues from my Assignment 1 repository. Assignment 1 is
> graded as-is on `main` (unchanged). All Assignment 2 (Week 3 SQLite) work
> lives on the `week3-sqlite` branch.

## How to install & run

```bash
npm install
npm start
```

The server starts on **http://localhost:3000**. Swagger UI (interactive docs)
is at **http://localhost:3000/docs**.

Requires Node.js 18+.

On first run, `tasks.db` is created automatically in the project root, along
with the `tasks` table and three seed tasks — no manual setup needed. The
database file is git-ignored, so every fresh clone starts clean.

## Endpoints

| Method | Path          | Description                             | Success | Errors            |
|--------|---------------|------------------------------------------|---------|--------------------|
| GET    | `/`           | API info (name, version, endpoint list)  | 200     | —                  |
| GET    | `/health`     | Health check                             | 200     | —                  |
| GET    | `/tasks`      | List all tasks (supports `?done=`, `?search=`, `?limit=`, `?offset=`) | 200 | — |
| GET    | `/tasks/:id`  | Get a single task                        | 200     | 404 not found      |
| POST   | `/tasks`      | Create a task (`{ "title": "..." }`)     | 201     | 400 missing/empty title |
| PUT    | `/tasks/:id`  | Update a task's `title` and/or `done`    | 200     | 400 invalid body, 404 not found |
| DELETE | `/tasks/:id`  | Delete a task                            | 204     | 404 not found      |
| GET    | `/stats`      | `{ total, done, open }` counts (extra)   | 200     | —                  |
| POST   | `/reset`      | Restore the 3 seed tasks (extra)         | 200     | —                  |
| GET    | `/docs`       | Swagger UI                               | 200     | —                  |

All of the above are backed by SQLite as of Week 3 — same paths, same
payloads, same status codes as Week 2.

## Example: curl output

Full create → update → delete → confirm cycle, run against the live server:

```
$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy milk"}'
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":false}

$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{}'
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{"error":"title is required and must be a non-empty string"}

$ curl -i -X PUT http://localhost:3000/tasks/4 -H "Content-Type: application/json" -d '{"done":true}'
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":true}

$ curl -i -X DELETE http://localhost:3000/tasks/4
HTTP/1.1 204 No Content

$ curl -i http://localhost:3000/tasks
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[{"id":1,"title":"Buy milk","done":false},{"id":2,"title":"Write README","done":false},{"id":3,"title":"Walk the dog","done":true}]
```

All status codes above (`201`, `400`, `200`, `204`) were captured from a real
run of this server, not hand-typed. This same sequence was re-run against the
SQLite-backed version in Week 3 and produced identical output — proof that
the storage swap didn't change the API's behavior.

## Swagger screenshot

![Swagger Screenshot](localhost_3000_docs_.png)

---

## Storage: SQLite (Week 3)

### Why SQLite

SQLite was chosen because it's a **single file** with **zero setup** — no
separate database server to install, configure, or run. It's a natural next
step up from the in-memory array: same simplicity, but data now persists to
disk instead of living only in the running process's memory.

### Where the database lives

- The database is `tasks.db`, created automatically the first time the
  server runs.
- It's **git-ignored**, so each fresh clone starts clean — the app creates
  the file, creates the `tasks` table, and seeds three example tasks
  automatically.

### Database schema

One table, `tasks`:

| Column  | Type    | Notes                          |
|---------|---------|----------------------------------|
| `id`    | INTEGER | Primary key, auto-assigned       |
| `title` | TEXT    | Required, non-empty               |
| `done`  | INTEGER | Stored as `0` / `1`, boolean in the API |

The table and seed rows are created automatically on first run, and the seed
only runs when the table is empty — restarting never duplicates the seed
data. The three-row seed insert is wrapped in a single **transaction**, so
it's all-or-nothing: either all three rows are written, or none are.

### Parameterized queries

Every query involving user-supplied data (an `id`, a `title`, a `done`
value) uses a `?` placeholder with the value passed separately — nothing is
concatenated directly into the SQL string, which is what keeps user input
from being able to break or manipulate the query.

```javascript
db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
```

### Proving persistence

In Week 2, this exact test lost all new data on restart (see "The mortality
experiment" below, kept for reference). In Week 3, the same test now passes:

1. `POST /tasks` a couple of new tasks.
2. Stop the server (`Ctrl+C`).
3. Start it again (`npm start`).
4. `GET /tasks` — the new tasks are still there.

### Exploring the database by hand (Stage 4)

Opened `tasks.db` directly in [DB Browser for SQLite](https://sqlitebrowser.org/)
to confirm the API and the database file are two views onto the exact same
data, with no syncing step between them.

**Tasks table, viewed in DB Browser:**

![Tasks table in DB Browser](./screenshots/tasks-table.png)

**Example query run in the "Execute SQL" tab:**

```sql
SELECT COUNT(*) FROM tasks;
```

![COUNT query result](./screenshots/count-query.png)

Returned `3`, confirming the seed only ran once and didn't multiply across
restarts.

After running queries directly in DB Browser (and clicking **Write
Changes**), calling `GET /tasks` from the API immediately reflected the
change — no server restart needed, since the API and DB Browser both read
the same `tasks.db` file. There's no "syncing" between them; there's one
source of truth.

### The mortality experiment (Week 2 — historical)

> Kept from the original A1 README for reference — this is the exact problem
> Week 3's SQLite migration above was built to fix.

Create a few tasks, restart the server (`Ctrl+C` then `npm start` again),
then `GET /tasks`. In Week 2, the new tasks were gone — back to the 3 seed
tasks — because everything lived in a JavaScript array in the server's
memory; nothing was written to disk. As of Week 3, this no longer happens
(see "Proving persistence" above).

### Stage 6 — AI vs me (SQLite migration)

*(Fill in after running the Week 3 AI rematch: your prompt asking an AI to
migrate the in-memory CRUD API to SQLite, saved in `ai-version/`, and at
least three concrete differences you found — e.g. seeding that multiplies,
string-glued SQL, a changed status code, or an invented column type. See the
assignment's Stage 6 for the exact three questions to answer.)*

---

## Project structure

```
.
├── server.js         # Express routes (unchanged in behavior since Week 2)
├── db.js             # SQLite connection, table creation, seeding (Week 3)
├── openapi.json       # Swagger/OpenAPI spec
├── tasks.db            # Created automatically on first run (git-ignored)
└── screenshots/
    ├── tasks-table.png
    └── count-query.png
```