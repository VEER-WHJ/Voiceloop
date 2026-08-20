export const REVIEW_THEMES = [
  "Food Quality",
  "Service Speed",
  "Staff Friendliness",
  "Wait Time",
  "Atmosphere",
  "Cleanliness",
  "Value",
  "Parking",
  "Ordering / Delivery",
  "Other",
] as const;

export const REVIEW_SENTIMENTS = ["Positive", "Neutral", "Negative"] as const;

export const ANALYSIS_BATCH_SIZE = 8;
export const MAX_ANALYSIS_REVIEWS = 50;

export type ReviewTheme = (typeof REVIEW_THEMES)[number];
export type ReviewSentiment = (typeof REVIEW_SENTIMENTS)[number];

export type ReviewAnalysis = {
  id: string;
  theme: ReviewTheme;
  sentiment: ReviewSentiment;
};

export type ReviewAnalysisBatch = {
  results: ReviewAnalysis[];
};

export type AnalysisApiResult = {
  requested: number;
  selected: number;
  analyzed: number;
  skipped: number;
  failed: number;
  errors: string[];
  model: string;
};

export class AnalysisValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateAnalysisBatch(
  value: unknown,
  expectedIds: readonly string[],
): ReviewAnalysisBatch {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    throw new AnalysisValidationError("The model response is missing a results array.");
  }

  if (value.results.length !== expectedIds.length) {
    throw new AnalysisValidationError(
      "The model response does not contain one result for every review.",
    );
  }

  const expected = new Set(expectedIds);
  const seen = new Set<string>();
  const results = value.results.map((item) => {
    if (!isRecord(item)) {
      throw new AnalysisValidationError("A model result is not an object.");
    }

    const { id, theme, sentiment } = item;
    if (typeof id !== "string" || !expected.has(id) || seen.has(id)) {
      throw new AnalysisValidationError("The model returned an unknown or duplicate review id.");
    }
    if (
      typeof theme !== "string" ||
      !REVIEW_THEMES.includes(theme as ReviewTheme)
    ) {
      throw new AnalysisValidationError("The model returned an unsupported review theme.");
    }
    if (
      typeof sentiment !== "string" ||
      !REVIEW_SENTIMENTS.includes(sentiment as ReviewSentiment)
    ) {
      throw new AnalysisValidationError("The model returned an unsupported sentiment.");
    }

    seen.add(id);
    return {
      id,
      theme: theme as ReviewTheme,
      sentiment: sentiment as ReviewSentiment,
    };
  });

  return { results };
}
