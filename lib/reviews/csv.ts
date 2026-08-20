import Papa from "papaparse";

import type { ReviewInsert } from "../supabase/database.types";

const MAX_REVIEW_ROWS = 100;
const MAX_REVIEW_LENGTH = 10_000;
const MAX_LABEL_LENGTH = 200;

type CsvRow = Record<string, string | undefined> & {
  __parsed_extra?: string[];
};

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

export function parseReviewsCsv(csvText: string): ReviewInsert[] {
  if (!csvText.trim()) {
    throw new CsvValidationError(["The CSV file is empty."]);
  }

  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
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
    });
  });

  if (issues.length > 0) {
    throw new CsvValidationError(Array.from(new Set(issues)));
  }

  return rows;
}
