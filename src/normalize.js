const { BookSchema } = require("./schema");

/**
 * "£51.77" -> 51.77. Returns null (not NaN) if nothing numeric is found,
 * so validation catches it rather than storing a broken number.
 */
function parsePriceGbp(priceText) {
  const digits = (priceText || "").replace(/[^\d.]/g, "");
  const value = parseFloat(digits);
  return Number.isNaN(value) ? null : value;
}

/**
 * Normalizes a raw record and validates it against BookSchema.
 * Returns { valid: true, record } or { valid: false, reason, raw }.
 */
function normalizeAndValidate(raw) {
  const candidate = {
    ...raw,
    price_gbp: parsePriceGbp(raw.price_text),
  };

  const result = BookSchema.safeParse(candidate);

  if (!result.success) {
    const reason = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return { valid: false, reason, raw };
  }

  return { valid: true, record: result.data };
}

module.exports = { normalizeAndValidate, parsePriceGbp };
