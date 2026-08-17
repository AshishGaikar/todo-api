const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CACHE_DIR = path.join(__dirname, "..", "cache");
const USER_AGENT = "FlyRankInternshipA9/1.0 (+https://github.com/AshishGaikar/week-5-polite-scraper)";
const TIMEOUT_MS = 8000;
const DELAY_MS = 600;

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

let cacheHitCount = 0;
function getCacheHits() {
  return cacheHitCount;
}
function resetCacheHits() {
  cacheHitCount = 0;
}

function cachePathFor(url) {
  const hash = crypto.createHash("sha1").update(url).digest("hex");
  return path.join(CACHE_DIR, `${hash}.html`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Politely fetch a URL, reading from the on-disk cache when present.
 * Real requests: identify with a user-agent, time out, wait between
 * requests, and retry once on timeout/5xx (never on 404/403).
 *
 * Returns { html, status, fromCache, error }.
 */
async function politeFetch(url) {
  const cachePath = cachePathFor(url);

  if (fs.existsSync(cachePath)) {
    const html = fs.readFileSync(cachePath, "utf-8");
    cacheHitCount++;
    console.log(`CACHE HIT  ${url}  (${html.length} bytes)`);
    return { html, status: 200, fromCache: true, error: null };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchOnce(url);

      if (res.status === 404 || res.status === 403) {
        console.log(`FETCH      ${url}  status=${res.status} (not retrying)`);
        return { html: null, status: res.status, fromCache: false, error: `HTTP ${res.status}` };
      }

      if (res.status >= 500 && attempt === 1) {
        console.log(`FETCH      ${url}  status=${res.status} (server error, retrying once)`);
        await sleep(1000);
        continue;
      }

      if (res.status !== 200) {
        console.log(`FETCH      ${url}  status=${res.status}`);
        return { html: null, status: res.status, fromCache: false, error: `HTTP ${res.status}` };
      }

      const html = await res.text();
      fs.writeFileSync(cachePath, html, "utf-8");
      console.log(`FETCH      ${url}  status=200 (${html.length} bytes)`);
      await sleep(DELAY_MS);
      return { html, status: 200, fromCache: false, error: null };
    } catch (err) {
      lastError = err;
      if (attempt === 1) {
        console.log(`FETCH      ${url}  error=${err.message} (retrying once)`);
        await sleep(1000);
        continue;
      }
    }
  }

  console.log(`FETCH      ${url}  failed after retry: ${lastError?.message}`);
  return { html: null, status: 0, fromCache: false, error: lastError?.message || "unknown error" };
}

module.exports = { politeFetch, getCacheHits, resetCacheHits, USER_AGENT };
