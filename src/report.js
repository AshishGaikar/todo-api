function buildReport({ startTime, pagesFetched, cacheHits, validCount, invalidCount, failedPages }) {
  const endTime = Date.now();
  return {
    started_at: new Date(startTime).toISOString(),
    duration_ms: endTime - startTime,
    pages_fetched: pagesFetched,
    cache_hits: cacheHits,
    valid_records: validCount,
    invalid_records: invalidCount,
    failed_pages: failedPages.length,
    failed_page_details: failedPages,
  };
}

module.exports = { buildReport };
