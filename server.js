const express = require("express");
const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.status(200).send("Hello, Task API!");
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));