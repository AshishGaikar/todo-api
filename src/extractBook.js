const cheerio = require("cheerio");
const { politeFetch } = require("./fetcher");

const RATING_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five"];

/**
 * Fetches one book detail page and pulls the eight raw fields.
 * Selectors are scoped to the product area, not the whole document.
 * Returns { record, error, status }.
 */
async function extractBook(bookUrl, sourcePage) {
  const { html, status, error } = await politeFetch(bookUrl);

  if (status !== 200 || !html) {
    return { record: null, error: error || `status ${status}`, status };
  }

  const $ = cheerio.load(html);
  const main = $("div.product_main");

  const title = main.find("h1").text().trim();
  const priceText = main.find("p.price_color").first().text().trim();
  const availabilityText = main.find("p.availability").text().replace(/\s+/g, " ").trim();

  const ratingClass = main.find("p.star-rating").attr("class") || "";
  const ratingWord = ratingClass.split(" ").find((c) => RATING_WORDS.includes(c)) || null;

  // Some books have no description — store null, never invent text.
  const descriptionHeading = $("#product_description");
  const description = descriptionHeading.length
    ? descriptionHeading.nextAll("p").first().text().trim() || null
    : null;

  const record = {
    title,
    product_url: bookUrl,
    price_text: priceText,
    availability_text: availabilityText,
    rating_text: ratingWord,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };

  return { record, error: null, status: 200 };
}

module.exports = { extractBook };
