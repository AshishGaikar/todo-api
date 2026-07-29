# Stage 7 — the prompt I gave the AI

> Build a small Node.js backend using Express that manages a to-do list of tasks
> in memory (no database, no files — just a JavaScript array). Each task has an
> id, a title, and a done boolean.
>
> I need these endpoints:
> - GET /tasks — list all tasks
> - GET /tasks/:id — get one task, 404 if it doesn't exist
> - POST /tasks — create a task from a JSON body with a title, starts as not done
> - PUT /tasks/:id — update a task's title and/or done
> - DELETE /tasks/:id — delete a task
>
> Use sensible HTTP status codes for each case (success, created, deleted,
> not found, bad input). Reject a POST if the title is missing. Also add
> Swagger UI so I can see and test the API in the browser. Keep it in one
> server.js file I can run with `node server.js`.

This was written from memory, without looking back at the assignment PDF —
deliberately looser than my own build (Stages 0–6). It's missing several
things I *knew* mattered but forgot to say out loud: no mention of `/` or
`/health`, no mention of *which* port, no mention of rejecting an empty-string
title vs. a missing one, no mention of validating the PUT body, and no mention
of what "bad input" on PUT should look like.
