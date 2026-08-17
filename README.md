# Task API — Containerized on Postgres

A CRUD task API running against a real PostgreSQL database, with the whole
stack (app + database) started by a single command.

This is the third storage swap for this API: in-memory → SQLite → this,
containerized Postgres. The routes and behaviour are unchanged throughout —
only the storage engine underneath is different.

## Run it

```bash
cp .env.example .env
docker compose up
```

That's it — the API is now on `http://localhost:3000`, backed by Postgres
running in its own container, with a volume so your data survives restarts.

Swagger docs: `http://localhost:3000/docs`

## Environment variables

See `.env.example`. Only one variable is required:

| Variable       | Meaning                                    |
|----------------|---------------------------------------------|
| `DATABASE_URL` | Postgres connection string the app connects with |

`.env` is git-ignored — never commit real secrets. `.env.example` documents
the shape with placeholder values.

## Endpoints

| Method | Path          | Description                     | Success | Errors |
|--------|---------------|----------------------------------|---------|--------|
| GET    | `/`           | API info                        | 200     | —      |
| GET    | `/health`     | Health check (pings the DB)     | 200     | 500    |
| GET    | `/tasks`      | List all tasks                  | 200     | —      |
| GET    | `/tasks/:id`  | Get one task                    | 200     | 404    |
| POST   | `/tasks`      | Create a task (`title` required)| 201     | 400    |
| PUT    | `/tasks/:id`  | Update `title` and/or `done`    | 200     | 400, 404 |
| DELETE | `/tasks/:id`  | Delete a task                   | 204     | 404    |

## Example

```bash
curl -i http://localhost:3000/tasks
```

<!-- Paste your real curl -i output here once you've run it -->

## Data screenshot

<!-- Paste a screenshot here of psql \dt + a SELECT, or a GUI like DBeaver/pgAdmin/TablePlus,
     showing the tasks table and rows. -->

## Persistence check

```bash
docker compose down
docker compose up
curl http://localhost:3000/tasks   # tasks are still there — the volume kept them
```

## AI vs me

<!-- Stage 6 (bonus): paste your own prompt (written from memory, not copied from
     the assignment doc), the AI's generated compose/Dockerfile/db code, and at
     least three concrete differences you found between it and your hand-built
     version. Note what it did better, what it got wrong, and what your prompt
     forgot to specify. -->
