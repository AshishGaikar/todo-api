const Database = require("better-sqlite3");

const db = new Database("tasks.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();

if (count === 0) {
  const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  const seed = db.transaction((seedTasks) => {
    for (const t of seedTasks) insert.run(t.title, t.done ? 1 : 0);
  });

  seed([
    { title: "Buy milk", done: false },
    { title: "Write README", done: false },
    { title: "Walk the dog", done: true },
  ]);
}

module.exports = db;