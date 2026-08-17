const fs = require("fs");
const path = require("path");
const { discoverCatalogue } = require("./discoverCatalogue");
const { extractBook } = require("./extractBook");
const { normalizeAndValidate } = require("./normalize");
const { buildReport } = require("./report");
const { getCacheHits, resetCacheHits } = require("./fetcher");

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Stage 5 proof: `node src/index.js --with-fake-url` adds one made-up
// book URL to the list so you can see the run survive a broken page.
const INJECT_FAKE_URL = process.argv.includes("--with-fake-url");
const FAKE_URL = "https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html";

async function main() {
  resetCacheHits();
  const startTime = Date.now();
  const failedPages = [];
  const validRecords = [];
  const invalidRecords = [];

  console.log("Discovering catalogue...");
  const { pageUrls, bookUrls } = await discoverCatalogue();
  console.log(
    `catalogue_pages=${pageUrls.length} discovered=${bookUrls.length} unique_urls=${bookUrls.length}`
  );

  const urlsToVisit = INJECT_FAKE_URL ? [...bookUrls, FAKE_URL] : bookUrls;
  let pagesFetched = pageUrls.length;

  for (const bookUrl of urlsToVisit) {
    pagesFetched++;
    const { record, error, status } = await extractBook(bookUrl, pageUrls[0]);

    if (!record) {
      console.log(`SKIP       ${bookUrl}  (${error})`);
      failedPages.push({ url: bookUrl, status, error });
      continue;
    }

    const result = normalizeAndValidate(record);
    if (result.valid) {
      validRecords.push(result.record);
    } else {
      console.log(`INVALID    ${bookUrl}  (${result.reason})`);
      invalidRecords.push({ raw: result.raw, reason: result.reason });
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "books.json"), JSON.stringify(validRecords, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, "errors.json"), JSON.stringify(invalidRecords, null, 2));

  const report = buildReport({
    startTime,
    pagesFetched,
    cacheHits: getCacheHits(),
    validCount: validRecords.length,
    invalidCount: invalidRecords.length,
    failedPages,
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, "run-report.json"), JSON.stringify(report, null, 2));

  console.log("\nRun complete.");
  console.log(
    `valid=${validRecords.length} invalid=${invalidRecords.length} failed_pages=${failedPages.length} cache_hits=${report.cache_hits}`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
