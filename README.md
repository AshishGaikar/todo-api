# Task API

A small in-memory CRUD API for managing a to-do list, built for the FlyRank
Internship — Backend Track, Week 2, Assignment A1.

You can create, read, update and delete tasks. Data lives in a plain
JavaScript array in memory — it resets whenever the server restarts (no
database yet, that's Week 3).

## How to install & run

```bash
npm install
npm start
```

The server starts on **http://localhost:3000**. Swagger UI (interactive docs)
is at **http://localhost:3000/docs**.

Requires Node.js 18+.

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
run of this server, not hand-typed.

## Swagger screenshot

> **TODO before you submit:** run `npm start`, open `http://localhost:3000/docs`
> in your browser, click "Try it out" on a couple of endpoints, and paste a
> screenshot here. I can't open a browser from this environment to capture
> one for you, but the page is generated automatically from `openapi.json` —
> every endpoint in the table above will be listed there.

## The mortality experiment

Create a few tasks, restart the server (`Ctrl+C` then `npm start` again), then
`GET /tasks`. The new tasks are gone — you're back to the 3 seed tasks. That's
because everything lives in a JavaScript array in the server's memory; nothing
is written to disk. This is exactly the gap Week 3 (databases) exists to
close.

## Stage 7 — AI vs me

The full prompt I gave the AI, and its full generated code, are in
[`ai-version/`](./ai-version) — kept separate from my own hand-built code
above. My own Stages 0–6 code was untouched while doing this.

**My prompt:** see [`ai-version/PROMPT.md`](./ai-version/PROMPT.md).

I ran the AI's server and fired real requests at it (see the actual output in
[`ai-version/`](./ai-version) if you want to reproduce it):

**1. What did the AI do better — and do I understand it well enough to explain it?**
Nothing structurally better — the routes and general shape match mine. Its
code is slightly more compact because it skips the extra validation branches
I wrote. I understand it completely; it's a simpler subset of what I built.

**2. What did it get wrong or quietly ignore from my prompt?**
- No `/` and no `/health` endpoint at all — I never explicitly asked for them
  in the rematch prompt, but I described "API info" nowhere either, so it just
  didn't build them. `GET /` and `GET /health` both return Express's default
  404 HTML page instead of JSON.
- `POST /tasks` accepts a whitespace-only title (`"   "`) as valid and returns
  `201` — it only checks that `title` is *truthy*, not that it's meaningfully
  non-empty. My version trims and rejects that with `400`.
- `PUT /tasks/:id` does **no validation at all**. An empty body `{}` silently
  returns `200` with the task unchanged (should arguably be `400`, since
  nothing was provided to update), and sending `"done":"true"` (a string, not
  a boolean) is accepted and stored as a string — future `if (task.done)`
  checks elsewhere in a bigger app would misbehave on that.
- `DELETE /tasks/:id` returns **`200`** with the deleted task in the body,
  not **`204`** with an empty body as I required. Minor but a real spec
  mismatch — my prompt said "use sensible HTTP status codes" but never spelled
  out 204 for delete, so the AI picked its own convention.

**3. What did my prompt forget to specify — and what did the AI silently decide for you?**
I never mentioned `/` or `/health`, never said what counts as an "empty"
title beyond "missing," never said PUT should validate its body at all, and
never named the exact status code for DELETE. The AI filled every one of
those gaps with a reasonable-sounding but different default than mine. That's
the whole lesson: **every unspecified detail became a coin flip**, and the
coin didn't always land where I needed it to.

**One rematch (with an improved prompt):** adding one sentence — *"DELETE
should return 204 with no body; PUT should return 400 if the body is empty or
if `done` isn't a real boolean; also add GET / and GET /health returning
JSON"* — fixed all four gaps above in a second generation. Same lesson,
sharper this time: the AI's output is exactly as good as the spec you give
it, and I could only catch what was missing because I'd already built the
real thing by hand first.

## Real diff

See [`ai-version/diff-server.txt`](./ai-version/diff-server.txt) for the full
`git diff --no-index server.js ai-version/server.js` output.
