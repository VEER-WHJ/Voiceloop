import assert from "node:assert/strict";
import test from "node:test";

import {
  CsvValidationError,
  parseReviewsCsv,
} from "../lib/reviews/csv.ts";

test("parses valid reviews and leaves analysis fields null", () => {
  const rows = parseReviewsCsv(
    [
      "review_text,rating,review_date,source,reviewer_name",
      '"Great food, friendly team",5,2026-08-19,Google,Avery',
      '"I would visit again",,,Yelp,',
    ].join("\n"),
  );

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    review_text: "Great food, friendly team",
    rating: 5,
    review_date: "2026-08-19",
    source: "Google",
    reviewer_name: "Avery",
    sentiment: null,
    theme: null,
    reviewer_review_count: null,
    reviewer_is_verified: null,
    provider_flagged: false,
  });
  assert.equal(rows[1].rating, null);
});

test("parses optional reviewer-history signals for quality filtering", () => {
  const [row] = parseReviewsCsv(
    "review_text,reviewer_review_count,reviewer_is_verified\nGood meal,1,no",
  );
  assert.equal(row.reviewer_review_count, 1);
  assert.equal(row.reviewer_is_verified, false);
});

test("rejects a CSV without review_text", () => {
  assert.throws(
    () => parseReviewsCsv("feedback_note,rating\nGreat meal,5"),
    (error) =>
      error instanceof CsvValidationError &&
      error.issues.some((issue) => issue.includes('"review_text"')),
  );
});

test("rejects malformed quoted CSV", () => {
  assert.throws(
    () => parseReviewsCsv('review_text,rating\n"Unclosed review,5'),
    (error) =>
      error instanceof CsvValidationError &&
      error.issues.some((issue) => issue.toLowerCase().includes("quote")),
  );
});

test("rejects an empty CSV", () => {
  assert.throws(
    () => parseReviewsCsv("  \n"),
    (error) =>
      error instanceof CsvValidationError &&
      error.issues.includes("The CSV file is empty."),
  );
});

test("rejects invalid optional values before insertion", () => {
  assert.throws(
    () =>
      parseReviewsCsv(
        "review_text,rating,review_date\nGood meal,6,08/19/2026",
      ),
    (error) =>
      error instanceof CsvValidationError &&
      error.issues.some((issue) => issue.includes("rating must")) &&
      error.issues.some((issue) => issue.includes("YYYY-MM-DD")),
  );
});

test("accepts common export column aliases without manual reformatting", () => {
  const rows = parseReviewsCsv(
    [
      "Comment,Stars,Date,Platform,Author",
      '"Excellent burger and quick service",5,2026-08-22,Google,Jordan',
    ].join("\n"),
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].review_text, "Excellent burger and quick service");
  assert.equal(rows[0].rating, 5);
  assert.equal(rows[0].review_date, "2026-08-22");
  assert.equal(rows[0].source, "Google");
  assert.equal(rows[0].reviewer_name, "Jordan");
});
