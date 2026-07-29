const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");
const app = express();
const PORT = 3000;

app.use(express.json());

let tasks = [
  { id: 1, title: "Buy milk", done: false },
  { id: 2, title: "Write README", done: false },
  { id: 3, title: "Walk the dog", done: true },
];
let nextId = 4;

app.get("/", (req, res) => {
  res.status(200).json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/tasks", (req, res) => {
  res.status(200).json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === parseInt(req.params.id));
  if (!task) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  res.status(200).json(task);
});

app.post("/tasks", (req, res) => {
  const { title } = req.body || {};
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and must be a non-empty string" });
  }
  const newTask = { id: nextId++, title: title.trim(), done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put("/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === parseInt(req.params.id));
  if (!task) {
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

  if (titleProvided) task.title = title.trim();
  if (doneProvided) task.done = done;

  res.status(200).json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const index = tasks.findIndex((t) => t.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }
  tasks.splice(index, 1);
  res.status(204).send();
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/docs`);
});