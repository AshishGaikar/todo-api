const cheerio = require("cheerio");
const { politeFetch } = require("./fetcher");

const START_URL = "https://books.toscrape.com/catalogue/page-1.html";
const MAX_PAGES = 3;

/**
 * Follows the catalogue's own "next" link starting at page 1,
 * stopping after MAX_PAGES pages. Never hardcodes book links.
 * Returns { pageUrls, bookUrls } with bookUrls deduplicated.
 */
async function discoverCatalogue() {
  const pageUrls = [];
  const bookUrlSet = new Set();

  let currentUrl = START_URL;

  for (let i = 0; i < MAX_PAGES && currentUrl; i++) {
    const { html, status } = await politeFetch(currentUrl);
    if (status !== 200 || !html) {
      throw new Error(`Could not fetch catalogue page: ${currentUrl} (status ${status})`);
    }

    pageUrls.push(currentUrl);
    const $ = cheerio.load(html);

    $("article.product_pod h3 a").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        bookUrlSet.add(new URL(href, currentUrl).toString());
      }
    });

    const nextHref = $("li.next a").attr("href");
    currentUrl = nextHref ? new URL(nextHref, currentUrl).toString() : null;
  }

  return { pageUrls, bookUrls: Array.from(bookUrlSet) };
}

module.exports = { discoverCatalogue };
