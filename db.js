const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false
    )
  `);

  const { rows } = await pool.query("SELECT COUNT(*) AS count FROM tasks");
  const count = parseInt(rows[0].count, 10);

  if (count === 0) {
    const seedTasks = [
      { title: "Buy milk", done: false },
      { title: "Write README", done: false },
      { title: "Walk the dog", done: true },
    ];

    for (const t of seedTasks) {
      await pool.query(
        "INSERT INTO tasks (title, done) VALUES ($1, $2)",
        [t.title, t.done]
      );
    }
  }
}

module.exports = { pool, init };
