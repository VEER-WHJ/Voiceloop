"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

import { CsvValidationError, parseReviewsCsv } from "@/lib/reviews/csv";
import {
  fetchReviews,
  fetchReviewSources,
  insertReviews,
  REVIEWS_PAGE_SIZE,
  type ReviewSort,
} from "@/lib/reviews/repository";
import type {
  ReviewInsert,
  ReviewRecord,
} from "@/lib/supabase/database.types";

import {
  frictionThemes,
  positiveThemes,
  reviews as sampleReviews,
} from "./sample-data";

type View = "dashboard" | "reviews" | "digest" | "upload";
type UploadStatus = "empty" | "selected" | "loading" | "success" | "error";
type Theme = { name: string; count: number; tone: "positive" | "warning"; description: string };

const navItems: { id: View; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "reviews", label: "Review Explorer" },
  { id: "digest", label: "AI Digest" },
  { id: "upload", label: "Upload CSV" },
];

const buttonPrimary = "inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-700 bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:border-blue-800 hover:bg-blue-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300";
const buttonSecondary = "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

export function VoiceLoopApp() {
  const [view, setView] = useState<View>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerTheme, setDrawerTheme] = useState<Theme | null>(null);
  const [reviewsRevision, setReviewsRevision] = useState(0);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setDrawerTheme(null);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const navigate = (next: View) => {
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <a href="#main-content" className="fixed left-3 top-3 z-[90] -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 font-bold text-white focus:translate-y-0">Skip to main content</a>
      <Header view={view} open={menuOpen} onToggle={() => setMenuOpen((value) => !value)} onNavigate={navigate} />
      <main id="main-content" className="mx-auto w-[min(calc(100%-2rem),1180px)] max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10 lg:px-0 lg:py-12">
        {view === "dashboard" && <Dashboard onNavigate={navigate} onOpenTheme={setDrawerTheme} />}
        {view === "reviews" && <ReviewExplorer revision={reviewsRevision} />}
        {view === "digest" && <AIDigest onOpenTheme={setDrawerTheme} />}
        {view === "upload" && (
          <UploadScreen
            onComplete={() => {
              setReviewsRevision((value) => value + 1);
              navigate("reviews");
            }}
          />
        )}
      </main>
      {drawerTheme && <EvidenceDrawer theme={drawerTheme} onClose={() => setDrawerTheme(null)} />}
    </div>
  );
}

function Header({ view, open, onToggle, onNavigate }: { view: View; open: boolean; onToggle: () => void; onNavigate: (view: View) => void }) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="relative mx-auto flex h-full max-w-[1180px] items-center justify-between px-4 sm:px-6 lg:px-0">
        <button onClick={() => onNavigate("dashboard")} aria-label="VoiceLoop home" className="rounded-md bg-white">
          <Image src="/voiceloop-logo.png" alt="VoiceLoop" width={170} height={46} className="h-11 w-40 object-contain" priority />
        </button>
        <button type="button" className={buttonSecondary} onClick={onToggle} aria-expanded={open} aria-controls="main-menu">Menu</button>
        {open && (
          <nav id="main-menu" aria-label="VoiceLoop areas" className="absolute right-4 top-[calc(100%+0.5rem)] z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:right-6 lg:right-0">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => onNavigate(item.id)} aria-current={view === item.id ? "page" : undefined} className={`block min-h-11 w-full rounded-lg px-4 text-left text-sm font-semibold transition ${view === item.id ? "bg-blue-50 text-blue-800" : "text-slate-700 hover:bg-slate-50"}`}>{item.label}</button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-800">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.025em] text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-2 text-base leading-7 text-slate-600 sm:text-lg">{copy}</p>
      </div>
      {action}
    </header>
  );
}

function Dashboard({ onNavigate, onOpenTheme }: { onNavigate: (view: View) => void; onOpenTheme: (theme: Theme) => void }) {
  return (
    <div className="fade-in">
      <PageHeading eyebrow="Customer feedback overview" title="VoiceLoop dashboard" copy="24 customer reviews analyzed" action={<button className={buttonPrimary} onClick={() => onNavigate("upload")}>Upload new reviews</button>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Feedback summary metrics">
        <MetricCard label="Reviews analyzed" value="24" detail="Current CSV dataset" />
        <MetricCard label="Positive sentiment" value="50%" detail="12 positive reviews" />
        <MetricCard label="Top praise" value="Food quality" detail="6 mentions" compact />
        <MetricCard label="Top complaint" value="Slow service and wait times" detail="6 mentions" compact />
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SentimentChart onExplore={() => onNavigate("reviews")} />
        <ThemeChart onOpen={() => onNavigate("digest")} />
      </div>
      <section className="mt-6 rounded-xl border border-violet-200 bg-violet-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-700">AI-generated summary</p><h2 className="mt-2 text-2xl font-bold">Feedback snapshot</h2></div><button className={buttonSecondary} onClick={() => onNavigate("digest")}>Open full digest</button></div>
        <p className="mt-5 max-w-5xl text-base leading-8 text-slate-700">Customers most often praised food quality. The most frequent recurring complaint was slow service and wait times, mentioned in 6 reviews. Check the supporting quotes before deciding what to investigate.</p>
      </section>
      <section className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">Investigate first</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">Slow service and wait times</h2><p className="mt-2 text-sm leading-6 text-slate-700">Highest complaint mention count, concentrated around ordering and check delivery.</p></div><button className={buttonSecondary} onClick={() => onOpenTheme(frictionThemes[0])}>Review 6 quotes</button></div></section>
    </div>
  );
}

function MetricCard({ label, value, detail, compact = false }: { label: string; value: string; detail: string; compact?: boolean }) {
  return <article className="min-h-44 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-600">{label}</p><p className={`mt-4 font-bold leading-tight text-slate-950 ${compact ? "text-xl" : "text-3xl"}`}>{value}</p><p className="mt-3 text-sm text-slate-500">{detail}</p></article>;
}

function SentimentChart({ onExplore }: { onExplore: () => void }) {
  const rows = [{ label: "Positive", count: 12, percent: 50, color: "bg-teal-600" }, { label: "Neutral", count: 0, percent: 0, color: "bg-slate-500" }, { label: "Negative", count: 12, percent: 50, color: "bg-amber-600" }];
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">Sentiment</p><h2 className="mt-2 text-2xl font-bold">Review mix</h2></div><button className="text-sm font-bold text-blue-700 hover:text-blue-900" onClick={onExplore}>Explore reviews</button></div><div className="mt-7 space-y-6">{rows.map((row) => <div key={row.label}><div className="mb-2 flex justify-between text-sm"><span className="font-bold">{row.label}</span><span className="text-slate-500">{row.count} · {row.percent}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.percent}%` }} /></div></div>)}</div></section>;
}

function ThemeChart({ onOpen }: { onOpen: () => void }) {
  const rows = [...positiveThemes.slice(0, 2), frictionThemes[0], positiveThemes[2]];
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">Recurring themes</p><h2 className="mt-2 text-2xl font-bold">Most mentioned</h2></div><button className="text-sm font-bold text-blue-700 hover:text-blue-900" onClick={onOpen}>Read AI digest</button></div><div className="mt-7 space-y-5">{rows.map((row) => <div key={row.name}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-bold">{row.name}</span><span className="shrink-0 text-slate-500">{row.count} · {Math.round(row.count / 24 * 100)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${row.tone === "positive" ? "bg-teal-600" : "bg-amber-600"}`} style={{ width: `${row.count / 24 * 100}%` }} /></div></div>)}</div></section>;
}

function UploadScreen({ onComplete }: { onComplete: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("empty");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ReviewInsert[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [dragging, setDragging] = useState(false);

  const clearSelection = () => {
    setFileName("");
    setRows([]);
    setValidationErrors([]);
    setStatus("empty");
    if (inputRef.current) inputRef.current.value = "";
  };

  const chooseFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setRows([]);
    setValidationErrors([]);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setValidationErrors(["Choose a file with a .csv extension."]);
      setStatus("error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setValidationErrors(["The CSV must be smaller than 2 MB."]);
      setStatus("error");
      return;
    }

    try {
      const parsedRows = parseReviewsCsv(await file.text());
      setRows(parsedRows);
      setStatus("selected");
    } catch (error) {
      setValidationErrors(
        error instanceof CsvValidationError
          ? error.issues
          : ["VoiceLoop could not read that CSV file."],
      );
      setStatus("error");
    }
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void chooseFile(event.dataTransfer.files[0]);
  };

  const upload = async () => {
    if (status !== "selected" || rows.length === 0) return;
    setStatus("loading");
    setValidationErrors([]);

    try {
      const count = await insertReviews(rows);
      setUploadedCount(count);
      setStatus("success");
      window.setTimeout(onComplete, 900);
    } catch (error) {
      setValidationErrors([
        error instanceof Error
          ? `Supabase could not save the reviews: ${error.message}`
          : "Supabase could not save the reviews.",
      ]);
      setStatus("error");
    }
  };

  const loadSampleCsv = async () => {
    try {
      const response = await fetch("/sample-reviews.csv");
      if (!response.ok) throw new Error("Sample CSV is unavailable.");
      const file = new File([await response.blob()], "sample-reviews.csv", {
        type: "text/csv",
      });
      await chooseFile(file);
    } catch (error) {
      setFileName("sample-reviews.csv");
      setValidationErrors([
        error instanceof Error ? error.message : "Sample CSV is unavailable.",
      ]);
      setStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <StatusPanel
        tone="blue"
        eyebrow="Uploading reviews"
        title="Saving your review data"
        copy={`VoiceLoop is adding ${rows.length} validated reviews from ${fileName} to Supabase.`}
        loading
      />
    );
  }

  if (status === "success") {
    return (
      <StatusPanel
        tone="green"
        eyebrow="Upload complete"
        title="Your reviews are ready"
        copy={`${uploadedCount} reviews were saved successfully. Opening Review Explorer now.`}
      />
    );
  }

  return <div className="mx-auto max-w-3xl fade-in"><PageHeading eyebrow="Customer feedback intelligence" title="Upload a review CSV" copy="Add one CSV to store validated reviews and refresh Review Explorer." />
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-bold">Upload customer reviews</h2><p className="mt-1 text-sm text-slate-600">Upload between 1 and 100 reviews.</p></div><button className="self-start text-sm font-bold text-blue-700" onClick={() => window.alert("Required column: review_text. Optional columns: rating (1–5), review_date (YYYY-MM-DD), source, and reviewer_name. Files may contain 1–100 non-empty rows.")}>CSV requirements</button></div>
      {status === "selected" ? <div className="rounded-xl border border-teal-300 bg-teal-50 p-5 sm:flex sm:items-center sm:justify-between"><div><p className="font-bold text-teal-950">{fileName}</p><p className="mt-1 text-sm text-teal-800">{rows.length} validated {rows.length === 1 ? "review" : "reviews"} ready to upload</p></div><div className="mt-4 flex gap-2 sm:mt-0"><button className={buttonSecondary} onClick={() => inputRef.current?.click()}>Replace</button><button className={buttonSecondary} onClick={clearSelection}>Remove</button></div></div> : <div onDragEnter={() => setDragging(true)} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={drop} className={`grid min-h-60 place-items-center rounded-xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-slate-50"}`}><div><p className="text-lg font-bold">Drag and drop your CSV here</p><p className="my-2 text-sm text-slate-500">or</p><button className={buttonSecondary} onClick={() => inputRef.current?.click()}>Choose CSV file</button><p className="mt-5 text-sm text-slate-600">The file must include a column named <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">review_text</code>.</p></div></div>}
      <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => void chooseFile(event.target.files?.[0])} />
      {status === "error" && <div role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900"><p className="font-bold">We couldn’t use {fileName || "that file"}.</p><ul className="mt-2 list-disc space-y-1 pl-5">{validationErrors.slice(0, 6).map((error) => <li key={error}>{error}</li>)}</ul>{validationErrors.length > 6 && <p className="mt-2">Fix {validationErrors.length - 6} additional validation errors, then try again.</p>}<div className="mt-3 flex gap-2"><button className={buttonPrimary} onClick={() => inputRef.current?.click()}>Choose another file</button><button className={buttonSecondary} onClick={clearSelection}>Back to upload</button></div></div>}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Valid reviews are stored in your connected Supabase project.</p><button className={buttonPrimary} disabled={status !== "selected"} onClick={() => void upload()}>Upload reviews</button></div>
    </section><p className="mt-5 text-center text-sm text-slate-600">Need a file to test? <button className="font-bold text-blue-700 underline underline-offset-4" onClick={() => void loadSampleCsv()}>Use sample CSV</button></p></div>;
}

function StatusPanel({ eyebrow, title, copy, loading = false, tone }: { eyebrow: string; title: string; copy: string; loading?: boolean; tone: "blue" | "green" }) {
  return <div className="grid min-h-[68vh] place-items-center fade-in"><section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12"><p className={`text-xs font-bold uppercase tracking-[0.14em] ${tone === "green" ? "text-teal-700" : "text-blue-800"}`}>{eyebrow}</p><h1 className="mt-3 text-3xl font-bold">{title}</h1><p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">{copy}</p>{loading && <div className="mx-auto mt-8 h-2 max-w-md overflow-hidden rounded-full bg-slate-100"><div className="progress-shimmer h-full w-1/3 rounded-full bg-blue-700" /></div>}</section></div>;
}

function ReviewExplorer({ revision }: { revision: number }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [source, setSource] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [sort, setSort] = useState<"Newest" | "Oldest">("Newest");
  const [page, setPage] = useState(1);
  const [storedReviews, setStoredReviews] = useState<ReviewRecord[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    void fetchReviewSources()
      .then((values) => {
        if (active) setSources(values);
      })
      .catch(() => {
        if (active) setSources([]);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  useEffect(() => {
    let active = true;

    void fetchReviews({
      search: debouncedQuery,
      source,
      reviewDate,
      sort: sort.toLowerCase() as ReviewSort,
      page,
    })
      .then((result) => {
        if (!active) return;
        setLoadError("");
        setStoredReviews(result.reviews);
        setTotal(result.total);
        const nextPages = Math.max(1, Math.ceil(result.total / REVIEWS_PAGE_SIZE));
        if (page > nextPages) setPage(nextPages);
      })
      .catch((error) => {
        if (!active) return;
        setStoredReviews([]);
        setTotal(0);
        setLoadError(
          error instanceof Error
            ? `Supabase could not load reviews: ${error.message}`
            : "Supabase could not load reviews.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, page, refreshKey, reviewDate, revision, sort, source]);

  const pages = Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE));
  const current = Math.min(page, pages);
  const update = <T,>(setter: (value: T) => void, value: T) => { setLoading(true); setter(value); setPage(1); };
  const clear = () => { setLoading(true); setQuery(""); setDebouncedQuery(""); setSource(""); setReviewDate(""); setSort("Newest"); setPage(1); };
  return <div className="fade-in"><PageHeading eyebrow="Source evidence" title="Review explorer" copy={`Search, filter, and sort ${total} reviews stored in your VoiceLoop workspace.`} />
    <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_170px_190px_180px]"><label><span className="sr-only">Search reviews</span><input value={query} onChange={(e) => update(setQuery, e.target.value)} placeholder="Search review text" className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-600" /></label><Select label="Source" value={source} options={["", ...sources]} optionLabels={{ "": "All sources" }} onChange={(value) => update(setSource, value)} /><label><span className="sr-only">Review date</span><input aria-label="Review date" type="date" value={reviewDate} onInput={(event) => update(setReviewDate, event.currentTarget.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-blue-600" /></label><Select label="Sort reviews" value={sort} options={["Newest", "Oldest"]} onChange={(value) => update(setSort, value as "Newest" | "Oldest")} /></div></section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">Customer reviews</h2><p className="mt-1 text-sm text-slate-500">Showing {total} matching reviews</p></div><button className={buttonSecondary} onClick={clear}>Clear filters</button></div>
      {loading ? <div className="p-10 text-center"><h3 className="text-xl font-bold">Loading reviews</h3><p className="mt-2 text-slate-600">Reading the latest data from Supabase.</p></div> : loadError ? <div role="alert" className="p-10 text-center"><h3 className="text-xl font-bold">Reviews unavailable</h3><p className="mt-2 text-slate-600">{loadError}</p><button className={`${buttonPrimary} mt-5`} onClick={() => { setLoading(true); setLoadError(""); setRefreshKey((value) => value + 1); }}>Try again</button></div> : storedReviews.length ? <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[860px] border-collapse text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Review</th><th className="px-5 py-4">Theme</th><th className="px-5 py-4">Sentiment</th><th className="px-5 py-4">Rating</th><th className="px-5 py-4">Source</th></tr></thead><tbody className="divide-y divide-slate-100">{storedReviews.map((review) => <ReviewRow key={review.id} review={review} />)}</tbody></table></div><div className="space-y-3 p-4 md:hidden">{storedReviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div></> : <div className="p-10 text-center"><h3 className="text-xl font-bold">No reviews match</h3><p className="mt-2 text-slate-600">Upload a CSV or try a broader search.</p><button className={`${buttonPrimary} mt-5`} onClick={clear}>Clear filters</button></div>}
    </section><div className="mt-5 flex items-center justify-between"><p className="text-sm text-slate-500">Page {current} of {pages}</p><div className="flex gap-2"><button className={buttonSecondary} disabled={current === 1} onClick={() => { setLoading(true); setPage((value) => Math.max(1, value - 1)); }}>Previous</button><button className={buttonSecondary} disabled={current === pages} onClick={() => { setLoading(true); setPage((value) => Math.min(pages, value + 1)); }}>Next</button></div></div>
  </div>;
}

function Select({ label, value, options, optionLabels = {}, onChange }: { label: string; value: string; options: string[]; optionLabels?: Record<string, string>; onChange: (value: string) => void }) {
  return <label><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-blue-600">{options.map((option) => <option key={option} value={option}>{optionLabels[option] ?? option}</option>)}</select></label>;
}

function SentimentBadge({ value }: { value: string | null }) {
  const normalized = value?.toLowerCase() ?? "";
  const style = normalized === "positive" ? "bg-teal-50 text-teal-800" : normalized === "negative" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700";
  const label = normalized ? `${normalized[0].toUpperCase()}${normalized.slice(1)}` : "Not analyzed yet";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{label}</span>;
}

function formatReviewDate(value: string | null) {
  if (!value) return "Date not provided";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function ReviewRow({ review }: { review: ReviewRecord }) {
  return <tr className="align-top hover:bg-slate-50"><td className="max-w-xl px-5 py-4"><p className="text-sm leading-6 text-slate-700">{review.review_text}</p><p className="mt-2 text-xs text-slate-400">{formatReviewDate(review.review_date)}</p></td><td className="px-5 py-4 text-sm font-semibold text-slate-700">{review.theme ?? "Not analyzed yet"}</td><td className="px-5 py-4"><SentimentBadge value={review.sentiment} /></td><td className="px-5 py-4 text-sm font-bold">{review.rating === null ? "Not provided" : `${review.rating}.0`}</td><td className="px-5 py-4 text-sm text-slate-600">{review.source ?? "Not provided"}</td></tr>;
}

function ReviewCard({ review }: { review: ReviewRecord }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><SentimentBadge value={review.sentiment} /><span className="text-sm font-bold">{review.rating === null ? "Not provided" : `${review.rating}.0`}</span></div><p className="mt-4 text-sm leading-6 text-slate-700">{review.review_text}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{review.theme ?? "Not analyzed yet"}</span><span>{review.source ?? "Not provided"}</span><span>{formatReviewDate(review.review_date)}</span></div></article>;
}

function AIDigest({ onOpenTheme }: { onOpenTheme: (theme: Theme) => void }) {
  return <div className="fade-in"><PageHeading eyebrow="AI-assisted review analysis" title="AI digest" copy="A concise summary of the recurring themes in your current review dataset." />
    <section className="rounded-xl border border-violet-200 bg-violet-50 p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-700">AI-generated summary</p><h2 className="mt-2 text-2xl font-bold">Weekly feedback snapshot</h2></div><button className={buttonSecondary} onClick={() => window.print()}>Print digest</button></div><p className="mt-5 max-w-5xl text-base leading-8 text-slate-700">Customers most often praised food quality and friendly staff. The clearest recurring complaint was slow service and wait times, mentioned in 6 reviews. Food temperature and parking were smaller but repeated friction points. Check the evidence before deciding what deserves attention.</p></section>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><ThemeList title="What customers love" kicker="Positive feedback" themes={positiveThemes} onOpen={onOpenTheme} /><ThemeList title="What customers complain about" kicker="Recurring friction" themes={frictionThemes} onOpen={onOpenTheme} /></div>
    <section className="mt-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">Investigate first</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold">Slow service and wait times</h2><p className="mt-2 text-sm leading-6 text-slate-700">This theme has the highest displayed complaint mention count. Review the quotes before choosing an operational response.</p></div><button className={buttonSecondary} onClick={() => onOpenTheme(frictionThemes[0])}>View evidence</button></div></section>
    <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900"><strong>Use these findings as a starting point.</strong> VoiceLoop identifies patterns in the uploaded reviews; it does not determine root causes or prescribe fixes.</div>
  </div>;
}

function ThemeList({ title, kicker, themes, onOpen }: { title: string; kicker: string; themes: Theme[]; onOpen: (theme: Theme) => void }) {
  return <section><p className={`text-xs font-bold uppercase tracking-[0.12em] ${themes[0].tone === "positive" ? "text-teal-700" : "text-amber-700"}`}>{kicker}</p><h2 className="mt-1 text-2xl font-bold">{title}</h2><div className="mt-4 space-y-3">{themes.map((theme) => <button key={theme.name} onClick={() => onOpen(theme)} className={`w-full rounded-xl border border-slate-200 border-l-4 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${theme.tone === "positive" ? "border-l-teal-600" : "border-l-amber-600"}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{theme.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{theme.description}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${theme.tone === "positive" ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"}`}>{theme.count} reviews</span></div></button>)}</div></section>;
}

function EvidenceDrawer({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const key = theme.name === "Slow service" ? "Slow service" : theme.name;
  const evidence = sampleReviews.filter((review) => review.theme === key).slice(0, theme.count);
  return <div className="fixed inset-0 z-[80] bg-slate-950/40" onMouseDown={onClose}><aside role="dialog" aria-modal="true" aria-labelledby="evidence-title" className="drawer-enter absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="sticky top-0 flex items-start justify-between gap-5 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:p-7"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">Theme evidence</p><h2 id="evidence-title" className="mt-2 text-2xl font-bold">{theme.name}</h2><p className="mt-1 text-sm text-slate-500">{theme.count} supporting reviews</p></div><button className={buttonSecondary} onClick={onClose}>Close</button></div><div className="p-5 sm:p-7"><p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">{theme.description}</p><div className="mt-6 space-y-4">{evidence.length ? evidence.map((review) => <blockquote key={review.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="leading-7 text-slate-700">“{review.text}”</p><footer className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500"><span>{review.source}</span><span>{review.rating}.0 rating</span><span>{review.date}</span></footer></blockquote>) : <p className="rounded-lg border border-slate-200 p-5 text-sm text-slate-600">Supporting quote unavailable in this sample.</p>}</div></div></aside></div>;
}
