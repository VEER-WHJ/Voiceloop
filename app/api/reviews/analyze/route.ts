import {
  ANALYSIS_BATCH_SIZE,
  MAX_ANALYSIS_REVIEWS,
  type AnalysisApiResult,
} from "@/lib/analysis/contracts";
import {
  analyzeReviewBatch,
  assertOpenAIConfigured,
  MissingOpenAIKeyError,
  REVIEW_ANALYSIS_MODEL,
} from "@/lib/analysis/openai";
import { requireSession, requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AnalysisRequest = {
  reviewIds?: unknown;
  limit?: unknown;
};

function json(body: object, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function parseRequest(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("The request body must be a JSON object.");
  }

  const { reviewIds: rawReviewIds, limit: rawLimit } = value as AnalysisRequest;
  if (rawReviewIds !== undefined) {
    if (!Array.isArray(rawReviewIds) || rawReviewIds.length === 0) {
      throw new Error("reviewIds must be a non-empty array.");
    }
    if (rawReviewIds.length > MAX_ANALYSIS_REVIEWS) {
      throw new Error(`Select no more than ${MAX_ANALYSIS_REVIEWS} reviews at once.`);
    }

    const reviewIds = Array.from(new Set(rawReviewIds));
    if (
      reviewIds.length !== rawReviewIds.length ||
      reviewIds.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))
    ) {
      throw new Error("reviewIds must contain unique review UUIDs.");
    }

    return { reviewIds: reviewIds as string[], limit: reviewIds.length };
  }

  const limit = rawLimit === undefined ? 10 : rawLimit;
  if (!Number.isInteger(limit) || Number(limit) < 1 || Number(limit) > MAX_ANALYSIS_REVIEWS) {
    throw new Error(`limit must be an integer from 1 to ${MAX_ANALYSIS_REVIEWS}.`);
  }

  return { reviewIds: null, limit: Number(limit) };
}

export async function POST(request: Request) {
  const userId = await requireSession();
  if (!userId) return unauthorized();
  if (!requestHasAllowedOrigin(request)) {
    return json({ message: "Cross-origin analysis requests are not allowed." }, 403);
  }

  let selection: ReturnType<typeof parseRequest>;
  try {
    selection = parseRequest(await request.json());
  } catch (error) {
    return json(
      { message: error instanceof Error ? error.message : "Invalid analysis request." },
      400,
    );
  }

  try {
    assertOpenAIConfigured();
  } catch (error) {
    if (error instanceof MissingOpenAIKeyError) {
      return json(
        { message: "OPENAI_API_KEY is missing from the server environment." },
        503,
      );
    }
    throw error;
  }

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("reviews")
    .select("id, review_text, ordered_items")
    .eq("owner_user_id", userId)
    .is("theme", null)
    .is("sentiment", null)
    .order("created_at", { ascending: true })
    .limit(selection.limit);

  if (selection.reviewIds) query = query.in("id", selection.reviewIds);

  const { data: reviews, error: fetchError } = await query;
  if (fetchError) {
    console.error("Circuit could not fetch unanalyzed reviews.", fetchError);
    return json({ message: "Supabase could not load reviews for analysis." }, 502);
  }

  const requested = selection.reviewIds?.length ?? selection.limit;
  const result: AnalysisApiResult = {
    requested,
    selected: reviews.length,
    analyzed: 0,
    skipped: Math.max(0, requested - reviews.length),
    failed: 0,
    errors: [],
    model: REVIEW_ANALYSIS_MODEL,
  };

  for (let offset = 0; offset < reviews.length; offset += ANALYSIS_BATCH_SIZE) {
    const batch = reviews.slice(offset, offset + ANALYSIS_BATCH_SIZE);
    let analysis;

    try {
      analysis = await analyzeReviewBatch(batch);
    } catch (error) {
      console.error("Circuit OpenAI batch analysis failed.", error);
      result.failed += batch.length;
      result.errors.push(
        `A batch of ${batch.length} ${batch.length === 1 ? "review" : "reviews"} could not be analyzed.`,
      );
      continue;
    }

    for (const item of analysis.results) {
      const { data: updatedRows, error: updateError } = await supabase
        .from("reviews")
        .update({
          theme: item.theme,
          sentiment: item.sentiment.toLowerCase(),
        })
        .eq("id", item.id)
        .eq("owner_user_id", userId)
        .is("theme", null)
        .is("sentiment", null)
        .select("id");

      if (updateError || updatedRows.length !== 1) {
        console.error("Circuit could not save a review analysis.", updateError);
        result.failed += 1;
        result.errors.push(`Analysis could not be saved for review ${item.id}.`);
      } else {
        result.analyzed += 1;
      }
    }
  }

  if (result.failed > 0) {
    return json(
      {
        ...result,
        message:
          result.analyzed > 0
            ? "Some reviews were analyzed, but part of the batch failed."
            : "The selected reviews could not be analyzed.",
      },
      result.analyzed > 0 ? 207 : 502,
    );
  }

  return json(result);
}
