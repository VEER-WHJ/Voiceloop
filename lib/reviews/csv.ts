import Papa from "papaparse";

import type { ReviewInsert } from "../supabase/database.types";

const MAX_REVIEW_ROWS = 100;
const MAX_REVIEW_LENGTH = 10_000;
const MAX_LABEL_LENGTH = 200;

type CsvRow = Record<string, string | undefined> & {
  __parsed_extra?: string[];
};

const HEADER_ALIASES: Record<string, string> = {
  review: "review_text",
  text: "review_text",
  comment: "review_text",
  comments: "review_text",
  review_body: "review_text",
  review_content: "review_text",
  stars: "rating",
  star_rating: "rating",
  score: "rating",
  date: "review_date",
  reviewed_at: "review_date",
  platform: "source",
  channel: "source",
  author: "reviewer_name",
  customer_name: "reviewer_name",
  author_review_count: "reviewer_review_count",
  reviewer_total_reviews: "reviewer_review_count",
  verified_reviewer: "reviewer_is_verified",
  spam_flag: "provider_flagged",
  is_spam: "provider_flagged",
};

function normalizeHeader(header: string) {
  const normalized = header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return HEADER_ALIASES[normalized] ?? normalized;
}

export class CsvValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues[0] ?? "The CSV could not be validated.");
    this.name = "CsvValidationError";
    this.issues = issues;
  }
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function parseRating(value: string | undefined, rowNumber: number) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { value: null, issue: null };

  const rating = Number(trimmed);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      value: null,
      issue: `Row ${rowNumber}: rating must be a whole number from 1 to 5.`,
    };
  }

  return { value: rating, issue: null };
}

function parseDate(value: string | undefined, rowNumber: number) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { value: null, issue: null };

  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  const isRealDate =
    isoMatch &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === trimmed;

  if (!isRealDate) {
    return {
      value: null,
      issue: `Row ${rowNumber}: review_date must use YYYY-MM-DD.`,
    };
  }

  return { value: trimmed, issue: null };
}

function parseReviewerCount(value: string | undefined, rowNumber: number) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { value: null, issue: null };
  const count = Number(trimmed);
  if (!Number.isInteger(count) || count < 0) return { value: null, issue: `Row ${rowNumber}: reviewer_review_count must be a non-negative whole number.` };
  return { value: count, issue: null };
}

function parseVerified(value: string | undefined, rowNumber: number) {
  const trimmed = value?.trim().toLowerCase() ?? "";
  if (!trimmed) return { value: null, issue: null };
  if (["true", "yes", "1"].includes(trimmed)) return { value: true, issue: null };
  if (["false", "no", "0"].includes(trimmed)) return { value: false, issue: null };
  return { value: null, issue: `Row ${rowNumber}: reviewer_is_verified must be true, false, yes, or no.` };
}

export function parseReviewsCsv(csvText: string): ReviewInsert[] {
  if (!csvText.trim()) {
    throw new CsvValidationError(["The CSV file is empty."]);
  }

  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });

  const headers = result.meta.fields ?? [];
  const issues: string[] = [];

  const parseErrors = result.errors.filter(
    (error) =>
      !(
        error.code === "UndetectableDelimiter" &&
        headers.length === 1 &&
        headers[0] === "review_text"
      ),
  );

  for (const error of parseErrors) {
    const rowLabel = typeof error.row === "number" ? `Row ${error.row + 2}: ` : "";
    issues.push(`${rowLabel}${error.message}`);
  }

  if (!headers.includes("review_text")) {
    issues.push('The CSV must include a column named "review_text".');
  }

  if (Object.keys(result.meta.renamedHeaders ?? {}).length > 0) {
    issues.push("The CSV contains duplicate column names.");
  }

  if (result.data.length === 0) {
    issues.push("The CSV contains no review rows.");
  }

  if (result.data.length > MAX_REVIEW_ROWS) {
    issues.push(`The CSV contains more than ${MAX_REVIEW_ROWS} review rows.`);
  }

  const rows: ReviewInsert[] = [];

  result.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const reviewText = row.review_text?.trim() ?? "";
    const rating = parseRating(row.rating, rowNumber);
    const reviewDate = parseDate(row.review_date, rowNumber);
    const source = optionalText(row.source);
    const reviewerName = optionalText(row.reviewer_name);
    const reviewerCount = parseReviewerCount(row.reviewer_review_count, rowNumber);
    const reviewerVerified = parseVerified(row.reviewer_is_verified, rowNumber);
    const providerFlagged = parseVerified(row.provider_flagged, rowNumber);

    if (row.__parsed_extra?.length) {
      issues.push(`Row ${rowNumber}: too many values for the CSV header.`);
    }
    if (!reviewText) {
      issues.push(`Row ${rowNumber}: review_text cannot be empty.`);
    }
    if (reviewText.length > MAX_REVIEW_LENGTH) {
      issues.push(
        `Row ${rowNumber}: review_text exceeds ${MAX_REVIEW_LENGTH.toLocaleString()} characters.`,
      );
    }
    if (rating.issue) issues.push(rating.issue);
    if (reviewDate.issue) issues.push(reviewDate.issue);
    if (reviewerCount.issue) issues.push(reviewerCount.issue);
    if (reviewerVerified.issue) issues.push(reviewerVerified.issue);
    if (providerFlagged.issue) issues.push(providerFlagged.issue.replace("reviewer_is_verified", "provider_flagged"));
    if (source && source.length > MAX_LABEL_LENGTH) {
      issues.push(`Row ${rowNumber}: source exceeds ${MAX_LABEL_LENGTH} characters.`);
    }
    if (reviewerName && reviewerName.length > MAX_LABEL_LENGTH) {
      issues.push(
        `Row ${rowNumber}: reviewer_name exceeds ${MAX_LABEL_LENGTH} characters.`,
      );
    }

    rows.push({
      review_text: reviewText,
      rating: rating.value,
      review_date: reviewDate.value,
      source,
      reviewer_name: reviewerName,
      sentiment: null,
      theme: null,
      reviewer_review_count: reviewerCount.value,
      reviewer_is_verified: reviewerVerified.value,
      provider_flagged: providerFlagged.value ?? false,
    });
  });

  if (issues.length > 0) {
    throw new CsvValidationError(Array.from(new Set(issues)));
  }

  return rows;
}
