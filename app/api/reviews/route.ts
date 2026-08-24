import { requireSession, requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ReviewInsert } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalText(value: unknown, maxLength = 200) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new Error(`Text values must be ${maxLength} characters or fewer.`);
  }
  return value.trim();
}

function sanitizeRow(value: unknown): ReviewInsert {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Every review must be an object.");
  }

  const row = value as Record<string, unknown>;
  const reviewText = typeof row.review_text === "string" ? row.review_text.trim() : "";
  if (!reviewText || reviewText.length > 10_000) {
    throw new Error("Every review needs review text between 1 and 10,000 characters.");
  }

  let rating: number | null = null;
  if (row.rating !== null && row.rating !== undefined && row.rating !== "") {
    if (!Number.isInteger(row.rating) || Number(row.rating) < 1 || Number(row.rating) > 5) {
      throw new Error("Ratings must be whole numbers from 1 to 5.");
    }
    rating = Number(row.rating);
  }

  let reviewDate: string | null = null;
  if (row.review_date !== null && row.review_date !== undefined && row.review_date !== "") {
    if (typeof row.review_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.review_date)) {
      throw new Error("Review dates must use YYYY-MM-DD.");
    }
    const parsed = new Date(`${row.review_date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== row.review_date) {
      throw new Error("Review dates must be valid calendar dates.");
    }
    reviewDate = row.review_date;
  }

  return {
    review_text: reviewText,
    rating,
    review_date: reviewDate,
    source: optionalText(row.source),
    reviewer_name: optionalText(row.reviewer_name),
    sentiment: null,
    theme: null,
  };
}

export async function GET(request: Request) {
  if (!(await requireSession())) return unauthorized();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const source = searchParams.get("source") ?? "";
  const reviewDate = searchParams.get("reviewDate") ?? "";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const ascending = sort === "oldest";

  const supabase = createServerSupabaseClient();
  let query = supabase.from("reviews").select("*", { count: "exact" });

  if (search) query = query.ilike("review_text", `%${search}%`);
  if (source) query = query.eq("source", source);
  if (reviewDate) query = query.eq("review_date", reviewDate);

  const { data, error, count } = await query
    .order("review_date", { ascending, nullsFirst: false })
    .order("created_at", { ascending })
    .range(from, to);

  if (error) {
    console.error("VoiceLoop could not load reviews.", error);
    return Response.json({ message: "Reviews could not be loaded." }, { status: 502 });
  }

  return Response.json(
    { reviews: data, total: count ?? 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!(await requireSession())) return unauthorized();
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin uploads are not allowed." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      rows?: unknown;
      filename?: unknown;
      locationId?: unknown;
    };
    if (!Array.isArray(body.rows) || body.rows.length < 1 || body.rows.length > 100) {
      return Response.json({ message: "Upload between 1 and 100 reviews." }, { status: 400 });
    }

    const rows = body.rows.map(sanitizeRow);
    const filename = optionalText(body.filename, 255) ?? "review-import.csv";
    const locationId = body.locationId === null || body.locationId === undefined || body.locationId === ""
      ? null
      : typeof body.locationId === "string" && UUID_PATTERN.test(body.locationId)
        ? body.locationId
        : (() => { throw new Error("Choose a valid location."); })();
    const supabase = createServerSupabaseClient();
    const { data: batch, error: batchError } = await supabase
      .from("import_batches")
      .insert({ filename, row_count: rows.length, status: "processing" })
      .select("id")
      .single();

    if (batchError) throw batchError;

    const { data: inserted, error: insertError } = await supabase
      .from("reviews")
      .insert(rows.map((row) => ({
        ...row,
        import_batch_id: batch.id,
        location_id: locationId,
      })))
      .select("id");

    if (insertError) {
      await supabase.from("import_batches").delete().eq("id", batch.id);
      throw insertError;
    }

    await supabase
      .from("import_batches")
      .update({ status: "complete" })
      .eq("id", batch.id);

    return Response.json(
      { reviews: inserted, importBatchId: batch.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("VoiceLoop could not save an import.", error);
    return Response.json(
      { message: error instanceof Error ? error.message : "Reviews could not be saved." },
      { status: 400 },
    );
  }
}
