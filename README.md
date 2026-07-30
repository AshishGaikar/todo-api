# Task API

A CRUD API for managing a to-do list, built for the FlyRank Internship —
Backend Track.

- **Week 2 (Assignment A1):** built the API with an in-memory JavaScript
  array as storage.
- **Week 3 (Assignment A2):** swapped the storage layer to a real
  **SQLite** database. The API itself — routes, request/response shapes,
  status codes — stayed unchanged; only *where the data lives* changed,
  from a variable in memory to a file on disk (`tasks.db`).
- **Week 4 (Assignment A4 — this update):** added real user accounts and
  route protection using **Supabase Auth**. Users can sign up, log in, and
  log out; specific routes now require a valid access token to reach.

> This project continues from my earlier repository. Assignment 1 is graded
> as-is on `main` (unchanged). Week 3 work lives on `week3-sqlite`, and this
> Week 4 auth work lives on `week4-auth`, branched from `week3-sqlite`.

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

### Environment variables

This project requires a free [Supabase](https://supabase.com) project for
authentication. Create a `.env` file in the project root (never commit this
file — it's git-ignored):

```
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
PORT=3000
```

Get these values from your Supabase Dashboard → **Project Settings → API**.
Use the **anon / public** key — never the `service_role` key, which bypasses
all security and must never be used client-side.

A `.env.example` file is committed with the expected key names and no real
values, so anyone cloning this repo knows exactly what to set.

---

## Endpoints

| Method | Path                 | Description                             | Auth required | Success | Errors            |
|--------|----------------------|-------------------------------------------|:---:|---------|--------------------|
| GET    | `/`                  | API info (name, version, endpoint list)    | – | 200     | —                  |
| GET    | `/health`            | Health check                              | – | 200     | —                  |
| GET    | `/tasks`             | List all tasks (supports `?done=`, `?search=`, `?limit=`, `?offset=`) | – | 200 | — |
| GET    | `/tasks/:id`         | Get a single task                          | – | 200     | 404 not found      |
| POST   | `/tasks`             | Create a task (`{ "title": "..." }`)       | – | 201     | 400 missing/empty title |
| PUT    | `/tasks/:id`         | Update a task's `title` and/or `done`      | – | 200     | 400 invalid body, 404 not found |
| DELETE | `/tasks/:id`         | Delete a task                              | – | 204     | 404 not found      |
| GET    | `/stats`             | `{ total, done, open }` counts (extra)     | – | 200     | —                  |
| POST   | `/reset`             | Restore the 3 seed tasks (extra)           | – | 200     | —                  |
| GET    | `/docs`              | Swagger UI                                | – | 200     | —                  |
| POST   | `/auth/signup`       | Create a new user account                  | – | 201     | 400 missing email/password |
| POST   | `/auth/login`        | Authenticate & return a JWT                | – | 200     | 400 missing fields, 401 invalid credentials |
| POST   | `/auth/logout`       | End the current session                    | ✅ Bearer | 204 | 401 missing/invalid token |
| GET    | `/public/info`       | Open, unauthenticated info                 | – | 200     | —                  |
| GET    | `/protected/profile` | Read the logged-in user's private profile  | ✅ Bearer | 200 | 401 missing/invalid token |
| GET    | `/protected/dashboard` | Second example protected route, same guard | ✅ Bearer | 200 | 401 missing/invalid token |

Routes marked **✅ Bearer** require an `Authorization: Bearer <token>` header
containing a valid Supabase access token.

## Example: curl output (task routes)

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

All status codes above were captured from a real run of this server. This
same behavior was re-verified after both the Week 3 (SQLite) and Week 4
(auth) changes — proof that neither storage nor auth changed how the task
routes themselves behave.

---

## Storage: SQLite (Week 3)

### Why SQLite

SQLite was chosen because it's a **single file** with **zero setup** — no
separate database server to install, configure, or run. It's a natural next
step up from an in-memory array: same simplicity, but data now persists to
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

### Parameterized queries (SQL)

Every query involving user-supplied data (an `id`, a `title`, a `done`
value) uses a `?` placeholder with the value passed separately — nothing is
concatenated directly into the SQL string, which is what keeps user input
from being able to break or manipulate the query.

```javascript
db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
```

### Exploring the database by hand

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

---

## Auth: Supabase (Week 4)

### Why Supabase

Supabase acts as the **Identity Provider** — it stores accounts, hashes
passwords, and signs JSON Web Tokens (JWTs). This project never writes its
own password hashing or token signing; it only sends credentials to
Supabase and verifies the tokens it hands back. Rolling your own auth is a
common source of real security vulnerabilities, so this delegates that
entirely to a trusted provider.

### The flow

1. **Sign up / Log in** — the client sends `email` + `password` to
   `/auth/signup` or `/auth/login`, which forward them to Supabase.
2. **The token** — on successful login, Supabase returns a signed JWT
   (`access_token`) and a `refresh_token`.
3. **The request** — the client attaches the access token on every request
   to a protected route: `Authorization: Bearer <token>`.
4. **Verification** — the server extracts the token and asks Supabase
   `getUser(token)` whether it's real. If valid, the route runs; if not, the
   server returns `401`.

### The guard: middleware

Token verification is implemented once, as a reusable Express middleware
(`middleware/auth.js`), and applied to every protected route
(`/protected/profile`, `/protected/dashboard`, `/auth/logout`). Adding a new
protected route requires no new auth code — just applying the same
middleware.

```javascript
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = data.user;
  next();
}
```

### Verifying it end-to-end

Registered and authenticated real users through the API — visible directly
in the Supabase dashboard under **Authentication → Users**:

![Supabase Auth Users](./screenshots/supabase-users.png)

A valid token returns `200` from `/protected/profile`; changing even one
character of the token returns `401` — proof the signature is actually being
checked, not just "a token exists."

### Swagger UI with bearer auth

`/docs` shows a lock icon on every protected route. Clicking **Authorize**
and pasting an access token lets you call protected routes directly from the
browser via "Try it out," without needing curl.

The full flow, run end-to-end from the browser — signup (`201`), login
(`200`, returning the access token), logout (`204`), a public route
(`200`), and both protected routes returning real user/dashboard data
(`200`) once authorized:

![Swagger UI full auth flow](./screenshots/swagger-full-flow.png)

**Authorize dialog and authorized state:**

![Swagger Authorize dialog](./screenshots/swagger-authorize.png)

![Swagger authorized state](./screenshots/swagger-authorized.png)

> Note: the Authorize field expects only the raw access token string, not
> the full JSON login response — worth double-checking the pasted value
> doesn't include surrounding `{ }` or the `refresh_token` field.

---

## Project structure

```
.
├── server.js            # Express routes
├── db.js                # SQLite connection, table creation, seeding (Week 3)
├── supabaseClient.js     # Supabase client init (Week 4)
├── middleware/
│   └── auth.js            # Reusable auth guard middleware (Week 4)
├── openapi.json            # Swagger/OpenAPI spec
├── .env.example              # Documented env var names, no real secrets
├── tasks.db                    # Created automatically on first run (git-ignored)
└── screenshots/
    ├── tasks-table.png
    ├── count-query.png
    ├── supabase-users.png
    ├── swagger-full-flow.png
    ├── swagger-authorize.png
    └── swagger-authorized.png
```