# The Polite Scraper

A small scraping pipeline: download the first 3 catalogue pages of
[Books to Scrape](https://books.toscrape.com), visit all 60 book pages,
turn the messy HTML into clean, schema-checked JSON, survive a broken
page without crashing, and end every run with an honest report.

Pipeline: **fetch → extract → normalize → validate → store → report.**

## Target classification (Stage 0)

- **Target:** `books.toscrape.com`, part of the [Scraping Sandbox](https://toscrape.com)
  project. Its own page describes it as *"a fictional bookstore that
  desperately wants to be scraped... a safe place for beginners learning
  web scraping and for developers validating their scraping technologies."*
  That sentence is the permission this assignment relies on.
- **Scope:** the first 3 catalogue pages only (60 books total), followed
  via the site's own "next" link — nothing hardcoded, nothing beyond
  page 3.
- **Data collected:** title, price, availability, star rating, and
  description for each book — all publicly rendered on the page the
  server sends, no login or paywall involved.
- **`robots.txt` check:** requested `https://books.toscrape.com/robots.txt`
  on 2026-08-17 — it returns **HTTP 404 (no robots file found)**. A missing
  file is not permission by itself; permission here comes from the site's
  own stated purpose above.

**I will not reuse this code on another site without checking its rules and terms first.**

## Run it

```bash
git clone <this-repo-url>
cd scraper
npm install
npm start
```

This produces:
- `output/books.json` — 60 validated records
- `output/errors.json` — any records that failed validation, with a reason
- `output/run-report.json` — counts, timing, cache hits, failures

To prove Stage 5 (one bad page doesn't kill the run), run:

```bash
npm run start:with-fake-url
```

This injects one made-up book URL into the list on purpose. The run still
finishes, `books.json` still has the 60 good records, and
`run-report.json` shows `failed_pages: 1`.

Re-running `npm start` again reads pages from `cache/` and produces the
same 60 records — not 120.

## Record schema

Each entry in `output/books.json`:

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `product_url` | string (URL) | canonical identity of the record |
| `price_text` | string | raw text, e.g. `"£51.77"` |
| `price_gbp` | number | parsed from `price_text` |
| `availability_text` | string | raw text, e.g. `"In stock (22 available)"` |
| `rating_text` | string or null | e.g. `"Three"` |
| `description` | string or null | `null` when the page has none — never invented |
| `source_page` | string (URL) | which catalogue page linked to this book |
| `fetched_at` | string (ISO timestamp) | provenance |

Validated with Zod (`src/schema.js`) before anything is written to
`books.json`. Anything that fails goes to `errors.json` with the reason
instead.

## Politeness rules

- **User-agent:** every request identifies itself as
  `FlyRankInternshipA9/1.0 (+https://github.com/AshishGaikar/week-5-polite-scraper)`.
- **Timeout:** every request gives up after 8 seconds rather than hanging.
- **Delay:** at least 600ms between real requests. Cached pages incur no
  delay — they never leave the machine.
- **Cache:** every fetched page is saved under `cache/` (git-ignored) and
  reused on subsequent runs, so the site is asked for a given page once.
- **Retry:** a timeout or `5xx` is retried once; a `404` or `403` is never
  retried.
- **Status check:** only `200` is treated as a real page; anything else is
  a failed fetch, not something to parse.

## Sample run report

<!-- Paste a real output/run-report.json here after your first live run. -->

```json
{
  "started_at": "...",
  "duration_ms": ...,
  "pages_fetched": ...,
  "cache_hits": ...,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0,
  "failed_page_details": []
}
```

## Why no browser was needed

The data (title, price, availability, rating, description) is already
present in the HTML the server sends for each page — nothing is rendered
client-side with JavaScript. A headless browser here would only add cost
(memory, startup time) with no extra data in return.

## Ethics note

Use an official API when one exists instead of scraping. Never bypass
logins, paywalls, or explicit blocks (a `403` or a disallowing
`robots.txt` is a stop sign, not a puzzle). Collect only the fields the
task actually needs, and keep the request rate low enough that the target
site never notices the difference between this scraper and a slow human
visitor.

## Known limitation

<!-- Fill in one honest limitation once you've run this for real —
     e.g. "the scraper doesn't yet handle pagination on availability
     text formats other than 'In stock (N available)'" — whatever you
     actually observe. -->

## AI vs me

<!-- Bonus stage: paste your own prompt (written from memory, not copied
     from the assignment doc), note whether the AI's version collected
     all 60, whether a rerun duplicated them, whether one bad page crashed
     it — and at least three concrete differences from this version. -->
