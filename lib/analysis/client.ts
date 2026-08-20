import type { AnalysisApiResult } from "./contracts";

type AnalysisErrorPayload = Partial<AnalysisApiResult> & {
  message?: string;
};

export class AnalysisRequestError extends Error {
  readonly result?: AnalysisErrorPayload;

  constructor(message: string, result?: AnalysisErrorPayload) {
    super(message);
    this.name = "AnalysisRequestError";
    this.result = result;
  }
}

export async function analyzeStoredReviews(reviewIds: string[]) {
  const response = await fetch("/api/reviews/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewIds }),
  });

  let payload: AnalysisErrorPayload;
  try {
    payload = (await response.json()) as AnalysisErrorPayload;
  } catch {
    throw new AnalysisRequestError("VoiceLoop received an invalid analysis response.");
  }

  if (!response.ok) {
    throw new AnalysisRequestError(
      payload.message ?? "VoiceLoop could not analyze the uploaded reviews.",
      payload,
    );
  }

  if (
    typeof payload.requested !== "number" ||
    typeof payload.selected !== "number" ||
    typeof payload.analyzed !== "number" ||
    typeof payload.skipped !== "number" ||
    typeof payload.failed !== "number" ||
    !Array.isArray(payload.errors) ||
    typeof payload.model !== "string"
  ) {
    throw new AnalysisRequestError("VoiceLoop received an invalid analysis response.");
  }

  return payload as AnalysisApiResult;
}
