const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");
const { pool, init } = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "unreachable" });
  }
});

app.get("/tasks", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id");
  res.status(200).json(rows);
});

app.get("/tasks/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [req.params.id]);
  const task = rows[0];
  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  res.status(200).json(task);
});

app.post("/tasks", async (req, res) => {
  const { title } = req.body || {};
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and must be a non-empty string" });
  }

  const { rows } = await pool.query(
    "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
    [title.trim(), false]
  );

  res.status(201).json(rows[0]);
});

app.put("/tasks/:id", async (req, res) => {
  const { rows: existingRows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [req.params.id]);
  const existing = existingRows[0];
  if (!existing) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  const { title, done } = req.body || {};
  const titleProvided = title !== undefined;
  const doneProvided = done !== undefined;

  if (!titleProvided && !doneProvided) {
    return res.status(400).json({ error: "request body must include title and/or done" });
  }
  if (titleProvided && (typeof title !== "string" || title.trim() === "")) {
    return res.status(400).json({ error: "title must be a non-empty string" });
  }
  if (doneProvided && typeof done !== "boolean") {
    return res.status(400).json({ error: "done must be a boolean" });
  }

  const newTitle = titleProvided ? title.trim() : existing.title;
  const newDone = doneProvided ? done : existing.done;

  const { rows } = await pool.query(
    "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *",
    [newTitle, newDone, req.params.id]
  );

  res.status(200).json(rows[0]);
});

app.delete("/tasks/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  res.status(204).send();
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on http://localhost:${PORT}`);
      console.log(`Swagger docs at http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
