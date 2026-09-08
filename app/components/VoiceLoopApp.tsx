"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ChartBar,
  CheckCircle,
  ClipboardText,
  CloudArrowUp,
  GearSix,
  GoogleLogo,
  House,
  ListMagnifyingGlass,
  MapPin,
  Plus,
  PlugsConnected,
  ShieldCheck,
  SignOut,
  Sparkle,
  Storefront,
  UploadSimple,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

import { analyzeStoredReviews } from "@/lib/analysis/client";
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
  createLocation,
  createCompetitor,
  fetchCompetitors,
  createManagerAction,
  fetchImports,
  fetchLocations,
  fetchManagerActions,
  fetchSourceConnections,
  runCompetitorResearch,
  undoImport,
  updateLocation,
  updateManagerAction,
  type ImportBatch,
  type ManagerAction,
  type Competitor,
  type WorkspaceLocation,
} from "@/lib/workspace/repository";

import {
  frictionThemes,
  positiveThemes,
  reviews as sampleReviews,
} from "./sample-data";

type View = "dashboard" | "reviews" | "sources" | "upload" | "digest" | "competitors" | "locations" | "settings";
type LocationSelection = { id: string; name: string };
type UploadStatus = "empty" | "selected" | "loading" | "analyzing" | "success" | "analysis-error" | "error";
type Theme = { name: string; count: number; tone: "positive" | "warning"; description: string };

const navItems: { id: View; label: string; icon: typeof House }[] = [
  { id: "dashboard", label: "Overview", icon: House },
  { id: "reviews", label: "Reviews", icon: ListMagnifyingGlass },
  { id: "sources", label: "Sources", icon: PlugsConnected },
  { id: "upload", label: "Uploads", icon: UploadSimple },
  { id: "digest", label: "AI digest", icon: Sparkle },
  { id: "competitors", label: "Competitors", icon: UsersThree },
  { id: "settings", label: "Settings", icon: GearSix },
];

const buttonPrimary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300";
const buttonSecondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const panelClass = "rounded-[18px] border border-slate-200 bg-white shadow-sm";

export function CircuitApp() {
  const [view, setView] = useState<View>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerTheme, setDrawerTheme] = useState<Theme | null>(null);
  const [reviewsRevision, setReviewsRevision] = useState(0);
  const [location, setLocation] = useState<LocationSelection>({ id: "all", name: "All locations" });

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
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <a href="#main-content" className="fixed left-3 top-3 z-[90] -translate-y-24 rounded-lg bg-stone-950 px-4 py-3 font-bold text-white focus:translate-y-0">Skip to main content</a>
      <Sidebar view={view} open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />
      <MobileHeader
        onHome={() => navigate("dashboard")}
        onToggle={() => setMenuOpen((value) => !value)}
      />
      <main id="main-content" className="min-h-screen px-4 pb-12 pt-6 sm:px-6 lg:ml-[236px] lg:px-10 lg:pb-16 lg:pt-8 xl:px-14">
        <div className="mx-auto max-w-[1240px]">
          <WorkspaceHeader view={view} location={location} onLocationChange={setLocation} onNavigate={navigate} />
        {view === "dashboard" && <Dashboard location={location} onNavigate={navigate} onOpenTheme={setDrawerTheme} />}
        {view === "reviews" && <ReviewExplorer revision={reviewsRevision} location={location} />}
        {view === "sources" && <SourcesScreen onNavigate={navigate} />}
        {view === "digest" && <AIDigest onOpenTheme={setDrawerTheme} />}
        {view === "competitors" && <CompetitorsScreen />}
        {view === "locations" && <LocationsScreen />}
        {view === "upload" && (
          <UploadScreen
            onComplete={() => {
              setReviewsRevision((value) => value + 1);
              navigate("reviews");
            }}
          />
        )}
        {view === "settings" && <SettingsScreen />}
        </div>
      </main>
      {drawerTheme && <EvidenceDrawer theme={drawerTheme} onClose={() => setDrawerTheme(null)} />}
    </div>
  );
}

function CircuitMark({ onHome, compact = false }: { onHome: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      className="brand-mark rounded-lg text-left leading-none outline-none transition hover:opacity-75 focus-visible:ring-2 focus-visible:ring-[#c81e1e] focus-visible:ring-offset-4"
      onClick={onHome}
      aria-label="Go to the Circuit overview"
    >
      <p className={`${compact ? "text-[10px]" : "text-[12px]"} font-black uppercase tracking-[0.34em] text-[#c81e1e]`}>Circuit</p>
      <p className={`${compact ? "mt-0.5 text-[21px]" : "mt-1 text-[25px]"} font-black uppercase tracking-[-0.055em] text-stone-950`}>Feedback</p>
    </button>
  );
}

function Sidebar({ view, open, onClose, onNavigate }: { view: View; open: boolean; onClose: () => void; onNavigate: (view: View) => void }) {
  const router = useRouter();

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-50 bg-stone-950/35 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-[60] flex w-[236px] flex-col border-r-2 border-stone-300 bg-[#fffaf1] px-4 py-6 shadow-[6px_0_20px_rgba(41,37,36,0.06)] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-start justify-between px-3"><CircuitMark onHome={() => onNavigate("dashboard")} /><button className="grid h-11 w-11 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden" onClick={onClose} aria-label="Close menu"><X size={20} weight="bold" /></button></div>
        <nav id="main-menu" aria-label="Circuit workspace" className="mt-10 space-y-1.5">
          {navItems.map((item) => { const Icon = item.icon; return (
            <button key={item.id} onClick={() => onNavigate(item.id)} aria-current={view === item.id ? "page" : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-semibold transition ${view === item.id ? "bg-slate-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><Icon size={19} weight={view === item.id ? "fill" : "bold"} />{item.label}</button>
          ); })}
        </nav>
        <div className="mt-auto rounded-xl border-2 border-stone-300 bg-white p-3.5 shadow-[0_3px_0_rgba(41,37,36,0.07)]">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-900 text-xs font-black text-white">CF</div><div className="min-w-0"><p className="truncate text-sm font-extrabold">Private workspace</p><p className="truncate text-xs text-stone-500">Customer feedback</p></div><button type="button" onClick={() => void signOut()} className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-950" aria-label="Sign out"><SignOut size={18} weight="bold" /></button></div>
        </div>
      </aside>
    </>
  );
}

function MobileHeader({ onHome, onToggle }: { onHome: () => void; onToggle: () => void }) {
  return <header className="sticky top-0 z-40 flex h-[74px] items-center justify-between border-b-2 border-stone-300 bg-[#fffaf1]/95 px-4 backdrop-blur lg:hidden"><CircuitMark compact onHome={onHome} /><button type="button" className={buttonSecondary} onClick={onToggle} aria-controls="main-menu"><ListMagnifyingGlass size={18} weight="bold" />Menu</button></header>;
}

function WorkspaceHeader({ view, location, onLocationChange, onNavigate }: { view: View; location: LocationSelection; onLocationChange: (location: LocationSelection) => void; onNavigate: (view: View) => void }) {
  const pageTitle = navItems.find((item) => item.id === view)?.label ?? "Overview";
  const [workspaceLocations, setWorkspaceLocations] = useState<WorkspaceLocation[]>([]);

  useEffect(() => {
    if (view !== "dashboard") return;
    void fetchLocations().then(setWorkspaceLocations).catch(() => setWorkspaceLocations([]));
  }, [view]);

  const options = [
    { id: "all", name: "All locations" },
    ...workspaceLocations.map(({ id, name }) => ({ id, name })),
  ];
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{pageTitle}</p><h1 className="mt-1 text-[2rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[2.7rem]">Customer feedback</h1></div>
        <div className="flex items-center gap-2"><NotificationBell onNavigate={onNavigate} /><button className={buttonPrimary} onClick={() => onNavigate("upload")}><UploadSimple size={18} weight="bold" />Add reviews</button></div>
      </div>
      {view === "dashboard" && <label className="mt-7 block max-w-sm"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</span><select aria-label="Choose a location" value={location.id} onChange={(event) => { if (event.target.value === "__add__") { onNavigate("locations"); return; } const selected = options.find((item) => item.id === event.target.value); if (selected) onLocationChange(selected); }} className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200">{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}<option value="__add__">+ Add location</option></select></label>}
    </header>
  );
}

function NotificationBell({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [open, setOpen] = useState(false);
  const notifications = [
    { title: "Connect a feedback source", copy: "Google and Ovation are not connected yet.", view: "sources" as View },
    { title: "Add your first location", copy: "Set up the locations you want to monitor.", view: "locations" as View },
  ];
  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} className="relative grid h-11 w-11 place-items-center rounded-xl border-2 border-slate-300 bg-white shadow-sm hover:bg-slate-50" aria-label={`${notifications.length} notifications`} aria-expanded={open}><Bell size={20} weight="bold" /><span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-slate-800 px-1 text-[10px] font-bold text-white">{notifications.length}</span></button>{open && <div className="absolute right-0 top-14 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-200 px-4 py-3"><p className="font-semibold">Notifications</p></div>{notifications.map((item) => <button key={item.title} type="button" onClick={() => { setOpen(false); onNavigate(item.view); }} className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.copy}</p></button>)}</div>}</div>;
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b91c1c]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-stone-950 sm:text-[2.5rem]">{title}</h1>
        <p className="mt-2 text-base leading-7 text-stone-600 sm:text-lg">{copy}</p>
      </div>
      {action}
    </header>
  );
}

const locationPerformance = [
  { id: "downtown", name: "Downtown", score: 4.7, reviews: 148, trend: "+0.2", issue: "Order accuracy", tone: "text-emerald-700" },
  { id: "riverside", name: "Riverside", score: 3.9, reviews: 126, trend: "-0.4", issue: "Wait time", tone: "text-[#b91c1c]" },
  { id: "northgate", name: "Northgate", score: 4.5, reviews: 94, trend: "+0.1", issue: "Food temperature", tone: "text-emerald-700" },
  { id: "airport", name: "Airport", score: 4.2, reviews: 88, trend: "0.0", issue: "Value", tone: "text-stone-600" },
];

function GuidedStart({ onNavigate, onOpenTheme }: { onNavigate: (view: View) => void; onOpenTheme: (theme: Theme) => void }) {
  const visible = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      window.addEventListener("circuit-tour-change", notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener("circuit-tour-change", notify);
      };
    },
    () => window.localStorage.getItem("circuit_tour_dismissed") !== "true",
    () => false,
  );

  if (!visible) return null;
  const dismiss = () => {
    window.localStorage.setItem("circuit_tour_dismissed", "true");
    window.dispatchEvent(new Event("circuit-tour-change"));
  };

  return (
    <section className={`${panelClass} overflow-hidden bg-[#fffaf1]`} aria-label="Circuit quick start">
      <div className="flex items-start justify-between gap-4 border-b-2 border-stone-300 px-5 py-4 sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Getting started</p><h2 className="mt-1 text-2xl font-bold">Workspace setup</h2></div><button type="button" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" onClick={dismiss} aria-label="Dismiss setup guide"><X size={20} weight="bold" /></button></div>
      <div className="grid divide-y-2 divide-stone-200 md:grid-cols-3 md:divide-x-2 md:divide-y-0">
        <button className="group p-5 text-left sm:p-6" onClick={() => onOpenTheme(frictionThemes[0])}><span className="grid h-8 w-8 place-items-center rounded-full bg-stone-950 text-sm font-black text-white">1</span><h3 className="mt-4 font-extrabold group-hover:text-[#b91c1c]">Inspect an issue</h3><p className="mt-1 text-sm leading-6 text-stone-600">Open the supporting customer quotes behind an alert.</p></button>
        <button className="group p-5 text-left sm:p-6" onClick={() => onNavigate("reviews")}><span className="grid h-8 w-8 place-items-center rounded-full bg-stone-950 text-sm font-black text-white">2</span><h3 className="mt-4 font-extrabold group-hover:text-[#b91c1c]">Explore reviews</h3><p className="mt-1 text-sm leading-6 text-stone-600">Search and filter the evidence across sources.</p></button>
        <button className="group p-5 text-left sm:p-6" onClick={() => onNavigate("upload")}><span className="grid h-8 w-8 place-items-center rounded-full bg-stone-950 text-sm font-black text-white">3</span><h3 className="mt-4 font-extrabold group-hover:text-[#b91c1c]">Add feedback</h3><p className="mt-1 text-sm leading-6 text-stone-600">Upload a CSV and let Circuit organize it safely.</p></button>
      </div>
    </section>
  );
}

function ManagerActionQueue() {
  const [actions, setActions] = useState<ManagerAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void fetchManagerActions()
      .then((items) => {
        if (cancelled) return;
        setActions(items);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Manager actions are temporarily unavailable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addPriorityAction = async () => {
    setSaving(true);
    setError("");
    try {
      const action = await createManagerAction({
        title: "Investigate Riverside dinner wait times",
        description: "Review the eleven supporting comments and compare staffing during the 6–8 PM dinner window.",
        locationName: "Riverside",
        priority: "high",
      });
      setActions((current) => [action, ...current]);
    } catch {
      setError("Circuit could not create the action. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (action: ManagerAction, status: ManagerAction["status"]) => {
    setSaving(true);
    try {
      const updated = await updateManagerAction(action.id, { status });
      setActions((current) => current.map((item) => item.id === action.id ? updated : item));
      setError("");
    } catch {
      setError("Circuit could not update that action.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`${panelClass} mt-6 overflow-hidden`}>
      <div className="flex flex-col gap-4 border-b-2 border-stone-300 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Manager actions</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.025em]">Action list</h2></div><button className={buttonSecondary} disabled={saving || actions.some((item) => item.title.startsWith("Investigate Riverside"))} onClick={() => void addPriorityAction()}><Plus size={17} weight="bold" />Create action</button></div>
      {error && <p role="alert" className="border-b-2 border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-900">{error}</p>}
      {loading ? <p className="p-7 text-sm text-stone-500">Loading manager actions…</p> : actions.length ? <div className="divide-y-2 divide-stone-200">{actions.slice(0, 5).map((action) => <article key={action.id} className="grid gap-4 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${action.priority === "high" ? "bg-red-50 text-red-800" : "bg-stone-100 text-stone-600"}`}>{action.priority}</span>{action.location_name && <span className="text-xs font-bold text-stone-500">{action.location_name}</span>}</div><h3 className="mt-2 font-extrabold">{action.title}</h3>{action.description && <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">{action.description}</p>}</div><select aria-label={`Status for ${action.title}`} value={action.status} disabled={saving} onChange={(event) => void changeStatus(action, event.target.value as ManagerAction["status"])} className="h-11 rounded-lg border-2 border-stone-300 bg-white px-3 text-sm font-extrabold capitalize"><option value="open">Open</option><option value="monitoring">Monitoring</option><option value="resolved">Resolved</option></select></article>)}</div> : <div className="p-7 text-center"><ClipboardText className="mx-auto text-stone-400" size={34} weight="bold" /><h3 className="mt-3 text-lg font-extrabold">No actions yet</h3><p className="mt-1 text-sm text-stone-500">Create the highlighted Riverside investigation to demonstrate the workflow.</p></div>}
    </section>
  );
}

function Dashboard({ location, onNavigate, onOpenTheme }: { location: LocationSelection; onNavigate: (view: View) => void; onOpenTheme: (theme: Theme) => void }) {
  const selected = location.name;
  const visiblePerformance = location.id === "all" ? locationPerformance : locationPerformance.filter((row) => row.name === location.name);
  return (
    <div className="fade-in">
      <GuidedStart onNavigate={onNavigate} onOpenTheme={onOpenTheme} />
      <section className={`${panelClass} mt-6 overflow-hidden`}>
        <div className="border-b-2 border-stone-300 bg-[#fff8e7] px-5 py-4 sm:px-7"><div className="flex items-center gap-2 text-[#b91c1c]"><WarningCircle size={20} weight="fill" /><p className="text-xs font-black uppercase tracking-[0.14em]">Needs attention today</p></div></div>
        <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-5 sm:p-8 lg:border-r-2 lg:border-stone-300"><p className="text-sm font-extrabold text-stone-500">Riverside · Service speed</p><h2 className="mt-2 max-w-2xl text-[2rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-[2.45rem]">Slow service is driving this week’s negative reviews.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">Eleven guests mentioned long waits after ordering—more than double Riverside’s usual volume. Dinner service between 6–8 PM is the clearest cluster.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button className={buttonPrimary} onClick={() => onOpenTheme(frictionThemes[0])}>Review evidence <ArrowRight size={18} weight="bold" /></button><button className={buttonSecondary} onClick={() => { onNavigate("reviews"); }}>View Riverside dashboard</button></div></div>
          <div className="grid grid-cols-2 gap-px bg-stone-300 lg:grid-cols-1">
            <div className="bg-white p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[0.1em] text-stone-500">Mentions</p><p className="mt-2 text-4xl font-black tracking-tight">11</p><p className="mt-1 text-sm font-bold text-[#b91c1c]">+7 vs usual</p></div>
            <div className="bg-white p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[0.1em] text-stone-500">Average rating</p><p className="mt-2 text-4xl font-black tracking-tight">2.3</p><p className="mt-1 text-sm text-stone-500">for affected reviews</p></div>
          </div>
        </div>
      </section>

      <section className={`${panelClass} mt-6 overflow-hidden`}>
        <div className="flex flex-col gap-4 border-b-2 border-stone-300 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Performance</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] sm:text-3xl">{selected}</h2><p className="mt-1 text-sm text-stone-500">Last 30 days · 456 reviews across 7 sources</p></div><button className={buttonSecondary} onClick={() => onNavigate("reviews")}>View reviews <ArrowRight size={17} weight="bold" /></button></div>
        <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-stone-300 md:grid-cols-4 md:divide-y-0">
          <MetricCard label="Average rating" value="4.3" detail="+0.1 from last month" tone="positive" />
          <MetricCard label="Positive sentiment" value="72%" detail="328 happy guests" tone="positive" />
          <MetricCard label="Response needed" value="18" detail="Unanswered low ratings" tone="warning" />
          <MetricCard label="Top praise" value="Food quality" detail="184 mentions" compact />
        </div>
        <div className="overflow-x-auto border-t-2 border-stone-300"><table className="w-full min-w-[720px] text-left"><thead className="bg-stone-100 text-xs uppercase tracking-[0.08em] text-stone-500"><tr><th className="px-6 py-4">Location</th><th className="px-6 py-4">Rating</th><th className="px-6 py-4">Reviews</th><th className="px-6 py-4">30-day trend</th><th className="px-6 py-4">Top issue</th></tr></thead><tbody className="divide-y-2 divide-stone-200">{visiblePerformance.map((row) => <tr key={row.id} className="bg-white hover:bg-slate-50"><td className="px-6 py-4 font-semibold"><span className="inline-flex items-center gap-2"><MapPin size={17} weight="fill" className="text-slate-500" />{row.name}</span></td><td className="px-6 py-4 font-bold">{row.score}</td><td className="px-6 py-4 text-stone-600">{row.reviews}</td><td className={`px-6 py-4 font-semibold ${row.tone}`}>{row.trend}</td><td className="px-6 py-4 text-stone-600">{row.issue}</td></tr>)}{visiblePerformance.length === 0 && <tr><td colSpan={5} className="bg-white px-6 py-8 text-center text-sm text-slate-500">No connected review metrics for this location yet.</td></tr>}</tbody></table></div>
        <div className="flex justify-end border-t-2 border-stone-300 bg-stone-50 px-5 py-4"><button className={buttonSecondary} onClick={() => onNavigate("locations")}>View all locations <ArrowRight size={17} weight="bold" /></button></div>
      </section>

      <ManagerActionQueue />
      <SourceFreshness location={location} onNavigate={onNavigate} />
    </div>
  );
}

function MetricCard({ label, value, detail, compact = false, tone }: { label: string; value: string; detail: string; compact?: boolean; tone?: "positive" | "warning" }) {
  return <article className="min-h-40 bg-white p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-[0.08em] text-stone-500">{label}</p><p className={`mt-4 font-black leading-tight tracking-[-0.03em] text-stone-950 ${compact ? "text-[1.35rem]" : "text-3xl"}`}>{value}</p><p className={`mt-3 text-sm font-semibold ${tone === "positive" ? "text-emerald-700" : tone === "warning" ? "text-[#b91c1c]" : "text-stone-500"}`}>{detail}</p></article>;
}

function SourceFreshness({ location, onNavigate }: { location: LocationSelection; onNavigate: (view: View) => void }) {
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  useEffect(() => {
    void fetchSourceConnections(location.id).then((items) => setConnectedProviders(items.filter((item) => item.status === "connected").map((item) => item.provider.toLowerCase()))).catch(() => setConnectedProviders([]));
  }, [location.id]);
  const sources = [
    { provider: "google", name: "Google", status: "Manager approval required", icon: GoogleLogo, color: "text-blue-600" },
    { provider: "doordash", name: "DoorDash", status: "CSV import", icon: Storefront, color: "text-slate-600" },
    { provider: "ubereats", name: "Uber Eats", status: "CSV import", icon: Storefront, color: "text-emerald-700" },
    { provider: "yelp", name: "Yelp", status: "CSV import", icon: Sparkle, color: "text-slate-600" },
    { provider: "grubhub", name: "Grubhub", status: "CSV import", icon: UploadSimple, color: "text-orange-700" },
    { provider: "ovation", name: "Ovation + Toast", status: "Partner setup", icon: PlugsConnected, color: "text-violet-700" },
  ];
  return <section className={`${panelClass} mt-6 overflow-hidden`}><div className="flex flex-col gap-3 border-b-2 border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sources for {location.name.toLowerCase()}</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.025em]">Connection status</h2></div><button className={buttonSecondary} onClick={() => onNavigate("sources")}>Manage sources <ArrowRight size={17} weight="bold" /></button></div><div className="grid sm:grid-cols-2 xl:grid-cols-3">{sources.map((source) => { const Icon = source.icon; const connected = connectedProviders.includes(source.provider); return <div key={source.name} className="border-b border-r border-slate-200 p-5"><div className="flex items-start gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 ${source.color}`}><Icon size={21} weight="bold" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{source.name}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${connected ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{connected ? "Connected" : "Not connected"}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{connected ? "Feedback is included in this location." : `${source.status}. Connect this source to include its feedback.`}</p></div></div></div>; })}</div></section>;
}

function SourcesScreen({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [setupOpen, setSetupOpen] = useState<"google" | "ovation" | null>(null);
  const sourceCards = [
    { name: "Google Business Profile", copy: "Connect the Google account that manages your verified locations when you are ready to authorize access.", status: "Manager approval required", icon: GoogleLogo, action: "View connection steps", tone: "text-blue-600" },
    { name: "DoorDash", copy: "Upload the native review export when it is available from the Merchant Portal.", status: "Manual import", icon: Storefront, action: "Upload CSV", tone: "text-[#c81e1e]" },
    { name: "Uber Eats", copy: "Bring in merchant feedback exports without reformatting reviews by hand.", status: "Manual import", icon: Storefront, action: "Upload CSV", tone: "text-emerald-700" },
    { name: "Yelp", copy: "Import an approved account export or a Circuit-ready CSV from your team.", status: "Manual import", icon: Sparkle, action: "Upload CSV", tone: "text-[#c81e1e]" },
    { name: "Grubhub", copy: "Use the Circuit CSV template for reviews exported by the merchant team.", status: "Manual import", icon: UploadSimple, action: "Upload CSV", tone: "text-orange-700" },
    { name: "Ovation + Toast POS", copy: "Bring SMS feedback together with the Toast order and menu items linked to that guest response.", status: "Partner setup required", icon: PlugsConnected, action: "View setup", tone: "text-violet-700" },
  ];
  return <div className="fade-in">
    <PageHeading eyebrow="Connections" title="Feedback sources" copy="Connect an account or upload a review file." action={<button className={buttonPrimary} onClick={() => onNavigate("upload")}><CloudArrowUp size={19} weight="bold" />Upload review file</button>} />
    <section className={`${panelClass} overflow-hidden`}>
      <div className="grid gap-px bg-stone-300 md:grid-cols-2 xl:grid-cols-3">{sourceCards.map((source) => { const Icon = source.icon; const setup = source.name.startsWith("Google") ? "google" : source.name.startsWith("Ovation") ? "ovation" : null; return <article key={source.name} className="flex min-h-[260px] flex-col bg-white p-6"><div className="flex items-start justify-between gap-4"><div className={`grid h-12 w-12 place-items-center rounded-xl border-2 border-stone-200 bg-stone-50 ${source.tone}`}><Icon size={25} weight="bold" /></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">{source.status}</span></div><h2 className="mt-5 text-xl font-bold tracking-[-0.02em]">{source.name}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{source.copy}</p><button className={`${setup ? buttonPrimary : buttonSecondary} mt-auto self-start`} onClick={() => setup ? setSetupOpen(setup) : onNavigate("upload")}>{source.action}<ArrowRight size={17} weight="bold" /></button></article>; })}</div>
    </section>
    <section className={`${panelClass} mt-6 grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center sm:p-7`}><div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-700"><ChartBar size={24} weight="bold" /></div><div><h2 className="text-xl font-bold">Review data</h2><p className="mt-1 text-sm leading-6 text-stone-600">Circuit keeps source, date, rating, review text, and available order context together. AI analysis is stored separately.</p></div><button className={buttonSecondary} onClick={() => onNavigate("reviews")}>Open reviews</button></section>
    {setupOpen && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 p-4" onMouseDown={() => setSetupOpen(null)}><section role="dialog" aria-modal="true" aria-labelledby="source-setup-title" className={`${panelClass} w-full max-w-xl p-6 sm:p-8`} onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-700">{setupOpen === "google" ? <GoogleLogo size={26} weight="bold" /> : <PlugsConnected size={26} weight="bold" />}</div><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setSetupOpen(null)} aria-label="Close source setup"><X size={20} weight="bold" /></button></div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{setupOpen === "google" ? "Google Business Profile" : "Ovation + Toast POS"}</p><h2 id="source-setup-title" className="mt-2 text-3xl font-bold tracking-[-0.035em]">Connection setup</h2><p className="mt-3 leading-7 text-slate-600">{setupOpen === "google" ? "Sign in with the Google account that manages your verified locations and approve access when Google connection credentials are configured." : "Enable Ovation in Toast Web for the required locations, then complete Ovation onboarding. Circuit will use authorized SMS feedback with the associated Toast menu items when integration credentials are supplied."}</p><div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex gap-3"><CheckCircle size={21} weight="fill" className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="font-semibold">Not connected</p><p className="mt-1 text-sm leading-6 text-slate-600">No account data or credentials are stored until the account owner completes provider authorization.</p></div></div></div><div className="mt-7 flex justify-end"><button className={buttonSecondary} onClick={() => setSetupOpen(null)}>Close</button></div></section></div>}
  </div>;
}

function LocationsScreen() {
  return <div className="fade-in"><PageHeading eyebrow="Locations" title="Add and manage locations" copy="Add each store once, then connect its feedback sources from the location overview." /><LocationManager /></div>;
}

function CompetitorsScreen() {
  const [items, setItems] = useState<Competitor[]>([]);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [researching, setResearching] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchCompetitors().then(setItems).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Competitors could not be loaded.")).finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const competitor = await createCompetitor(name, website);
      setItems((current) => [...current, competitor]);
      setName("");
      setWebsite("");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "The competitor could not be added.");
    } finally {
      setSaving(false);
    }
  };

  const research = async (id: string) => {
    setResearching(id);
    setError("");
    try {
      const updated = await runCompetitorResearch(id);
      setItems((current) => current.map((item) => item.id === id ? updated : item));
    } catch (researchError) {
      setError(researchError instanceof Error ? researchError.message : "The briefing could not be created.");
    } finally {
      setResearching("");
    }
  };

  return <div className="fade-in"><PageHeading eyebrow="Market watch" title="Competitors" copy="Track nearby restaurant brands and create a current, source-linked briefing when you need one." />
    <section className={`${panelClass} p-5 sm:p-7`}><h2 className="text-xl font-bold">Add a competitor</h2><div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><label><span className="sr-only">Competitor name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Shake Shack" maxLength={120} className="h-11 w-full rounded-lg border-2 border-slate-300 px-4 text-sm outline-none focus:border-slate-600" /></label><label><span className="sr-only">Website (optional)</span><input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="Website (optional)" type="url" className="h-11 w-full rounded-lg border-2 border-slate-300 px-4 text-sm outline-none focus:border-slate-600" /></label><button type="button" className={buttonPrimary} disabled={saving || !name.trim()} onClick={() => void add()}><Plus size={17} weight="bold" />{saving ? "Adding…" : "Add competitor"}</button></div>{error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}</section>
    <section className="mt-6 grid gap-5 lg:grid-cols-2">{loading ? <div className={`${panelClass} p-7 text-sm text-slate-500`}>Loading competitors…</div> : items.length ? items.map((competitor) => <article key={competitor.id} className={`${panelClass} flex flex-col p-5 sm:p-7`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-bold">{competitor.name}</h2>{competitor.website && <a href={competitor.website} target="_blank" rel="noreferrer" className="mt-1 block max-w-sm truncate text-sm text-slate-500 underline decoration-slate-300 underline-offset-4">{competitor.website}</a>}</div><button type="button" className={buttonSecondary} disabled={Boolean(researching)} onClick={() => void research(competitor.id)}><Sparkle size={17} weight="bold" />{researching === competitor.id ? "Researching…" : competitor.latest_summary ? "Refresh briefing" : "Research online"}</button></div>{competitor.latest_summary ? <div className="mt-6"><p className="whitespace-pre-line text-sm leading-7 text-slate-700">{competitor.latest_summary}</p>{competitor.latest_sources.length > 0 && <div className="mt-5 border-t border-slate-200 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sources</p><ul className="mt-2 space-y-2">{competitor.latest_sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">{source.title}</a></li>)}</ul></div>}</div> : <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">No briefing yet. Research runs only when you click the button and uses current public web sources.</p>}</article>) : <div className={`${panelClass} p-8 text-center lg:col-span-2`}><UsersThree className="mx-auto text-slate-400" size={36} weight="bold" /><h2 className="mt-3 text-xl font-bold">No competitors added</h2><p className="mt-1 text-sm text-slate-500">Add a restaurant brand above to start tracking it.</p></div>}</section>
  </div>;
}

function SettingsScreen() {
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [issueAlerts, setIssueAlerts] = useState(true);
  return <div className="fade-in"><PageHeading eyebrow="Workspace preferences" title="Circuit settings" copy="Set up the locations, sources, and alerts that matter to your team." />
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <section className={`${panelClass} overflow-hidden`}><div className="border-b-2 border-stone-300 p-6 sm:p-7"><h2 className="text-2xl font-black">Notifications</h2><p className="mt-1 text-sm text-stone-600">Choose which changes should reach the manager.</p></div><div className="divide-y-2 divide-stone-200">
        <PreferenceRow title="Weekly owner digest" copy="A concise Monday summary across every location." enabled={weeklyDigest} onToggle={() => setWeeklyDigest((value) => !value)} />
        <PreferenceRow title="Urgent issue alerts" copy="Notify the manager when a negative theme rises sharply at one location." enabled={issueAlerts} onToggle={() => setIssueAlerts((value) => !value)} />
      </div></section>
      <section className={`${panelClass} p-6 sm:p-7`}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace</p><h2 className="mt-2 text-2xl font-bold">Circuit Feedback</h2><dl className="mt-6 space-y-4 text-sm"><div><dt className="font-semibold text-slate-500">Access</dt><dd className="mt-1 font-medium">Manager account</dd></div><div><dt className="font-semibold text-slate-500">Locations</dt><dd className="mt-1 font-medium">Add and manage your own</dd></div><div><dt className="font-semibold text-slate-500">Connections</dt><dd className="mt-1 font-medium">Choose sources independently</dd></div></dl></section>
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <LocationManager />
      <section className={`${panelClass} p-6 sm:p-7`}><div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={23} weight="fill" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Data</p><h2 className="mt-1 text-2xl font-bold">Security</h2></div></div><ul className="mt-6 space-y-4 text-sm leading-6 text-stone-600"><li><strong className="text-stone-950">Account isolation:</strong> each manager sees only their workspace data.</li><li><strong className="text-stone-950">Protected reviews:</strong> anonymous database read and write access is disabled.</li><li><strong className="text-stone-950">Server-side AI:</strong> the OpenAI key is never sent to the browser.</li><li><strong className="text-stone-950">Provider consent:</strong> source synchronization remains inactive until the account owner grants access.</li><li><strong className="text-stone-950">Reversible imports:</strong> each CSV upload can be removed as one batch.</li></ul></section>
    </div>
  </div>;
}

function LocationManager() {
  const [items, setItems] = useState<WorkspaceLocation[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchLocations()
      .then((locations) => { setItems(locations); setError(""); })
      .catch(() => setError("Locations could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const location = await createLocation(name);
      setItems((current) => [...current, location]);
      setName("");
      setError("");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "The location could not be added.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (location: WorkspaceLocation) => {
    setSaving(true);
    try {
      const updated = await updateLocation(location.id, { isActive: !location.is_active });
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setError("");
    } catch {
      setError("The location could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  return <section className={`${panelClass} overflow-hidden`}><div className="border-b-2 border-stone-300 p-6 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Locations</p><h2 className="mt-1 text-2xl font-bold">Manage locations</h2><p className="mt-1 text-sm leading-6 text-stone-600">Add each location you want to track.</p><div className="mt-5 flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">New location name</span><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void add(); }} placeholder="Location name" className="h-11 w-full rounded-lg border-2 border-stone-300 px-3 text-sm font-bold" /></label><button className={buttonSecondary} disabled={saving || !name.trim()} onClick={() => void add()}><Plus size={17} weight="bold" />Add</button></div>{error && <p role="alert" className="mt-3 text-sm font-bold text-red-800">{error}</p>}</div><div className="divide-y-2 divide-stone-200">{loading ? <p className="p-6 text-sm text-stone-500">Loading locations…</p> : items.length ? items.map((location) => <div key={location.id} className="flex items-center justify-between gap-4 bg-white px-6 py-4"><div><p className="font-semibold">{location.name}</p><p className="mt-0.5 text-xs text-stone-500">{location.is_active ? "Active in filters" : "Hidden from filters"}</p></div><button role="switch" aria-checked={location.is_active} aria-label={`${location.name} active`} disabled={saving} onClick={() => void toggle(location)} className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition ${location.is_active ? "border-slate-700 bg-slate-700" : "border-stone-300 bg-stone-200"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${location.is_active ? "left-6" : "left-0.5"}`} /></button></div>) : <p className="p-6 text-sm text-stone-500">No locations yet.</p>}</div></section>;
}

function PreferenceRow({ title, copy, enabled, onToggle }: { title: string; copy: string; enabled: boolean; onToggle: () => void }) {
  return <div className="flex items-center justify-between gap-5 p-6 sm:p-7"><div><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-stone-600">{copy}</p></div><button role="switch" aria-checked={enabled} aria-label={title} onClick={onToggle} className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition ${enabled ? "border-[#a71919] bg-[#c81e1e]" : "border-stone-300 bg-stone-200"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-0.5"}`} /></button></div>;
}

function UploadScreen({ onComplete }: { onComplete: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("empty");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ReviewInsert[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [insertedReviewIds, setInsertedReviewIds] = useState<string[]>([]);
  const [analysisError, setAnalysisError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [locationOptions, setLocationOptions] = useState<WorkspaceLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  useEffect(() => {
    void fetchLocations()
      .then((items) => setLocationOptions(items.filter((item) => item.is_active)))
      .catch(() => setLocationOptions([]));
  }, []);

  const clearSelection = () => {
    setFileName("");
    setRows([]);
    setValidationErrors([]);
    setInsertedReviewIds([]);
    setAnalysisError("");
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
          : ["Circuit could not read that CSV file."],
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

    let reviewIds: string[];
    try {
      const result = await insertReviews(rows, {
        filename: fileName,
        locationId: selectedLocation || null,
      });
      reviewIds = result.reviews.map(({ id }) => id);
      setUploadedCount(reviewIds.length);
      setInsertedReviewIds(reviewIds);
    } catch (error) {
      setValidationErrors([
        error instanceof Error
          ? `Supabase could not save the reviews: ${error.message}`
          : "Supabase could not save the reviews.",
      ]);
      setStatus("error");
      return;
    }

    await runAnalysis(reviewIds);
  };

  const runAnalysis = async (reviewIds: string[]) => {
    setStatus("analyzing");
    setAnalysisError("");

    try {
      const result = await analyzeStoredReviews(reviewIds);
      setAnalyzedCount(Math.min(reviewIds.length, result.analyzed + result.skipped));

      if (result.failed > 0) {
        setAnalysisError(
          `${result.analyzed} reviews were analyzed, but ${result.failed} could not be completed. Your uploaded reviews are still safely stored.`,
        );
        setStatus("analysis-error");
        return;
      }

      setStatus("success");
      window.setTimeout(onComplete, 900);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? `${error.message} Your uploaded reviews are still safely stored.`
          : "Circuit could not analyze the uploaded reviews. Your uploaded reviews are still safely stored.",
      );
      setStatus("analysis-error");
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
        copy={`Circuit is adding ${rows.length} validated reviews from ${fileName} to your review library.`}
        loading
      />
    );
  }

  if (status === "analyzing") {
    return (
      <StatusPanel
        tone="blue"
        eyebrow="AI review analysis"
        title="Analyzing customer feedback..."
        copy={`Circuit is assigning a theme and sentiment to ${uploadedCount} uploaded reviews in controlled batches.`}
        loading
      />
    );
  }

  if (status === "success") {
    return (
      <StatusPanel
        tone="green"
        eyebrow="Upload and analysis complete"
        title="Your analyzed reviews are ready"
        copy={`${uploadedCount} reviews were saved and ${analyzedCount} have theme and sentiment results. Opening Review Explorer now.`}
      />
    );
  }

  if (status === "analysis-error") {
    return (
      <StatusPanel
        tone="red"
        eyebrow="Analysis needs attention"
        title="Your reviews are safe"
        copy={analysisError}
        action={
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button className={buttonPrimary} onClick={() => void runAnalysis(insertedReviewIds)}>Try analysis again</button>
            <button className={buttonSecondary} onClick={onComplete}>Open Review Explorer</button>
          </div>
        }
      />
    );
  }

  return <div className="mx-auto max-w-3xl fade-in"><PageHeading eyebrow="Review imports" title="Upload customer reviews" copy="Add a source export or Circuit-ready CSV to your shared review library." />
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-bold">Upload customer reviews</h2><p className="mt-1 text-sm text-slate-600">Upload between 1 and 100 reviews.</p></div><button className="self-start text-sm font-bold text-blue-700" onClick={() => window.alert("Required column: review_text. Optional columns: rating (1–5), review_date (YYYY-MM-DD), source, and reviewer_name. Files may contain 1–100 non-empty rows.")}>CSV requirements</button></div>
      {status === "selected" ? <div className="rounded-xl border border-teal-300 bg-teal-50 p-5 sm:flex sm:items-center sm:justify-between"><div><p className="font-bold text-teal-950">{fileName}</p><p className="mt-1 text-sm text-teal-800">{rows.length} validated {rows.length === 1 ? "review" : "reviews"} ready to upload</p></div><div className="mt-4 flex gap-2 sm:mt-0"><button className={buttonSecondary} onClick={() => inputRef.current?.click()}>Replace</button><button className={buttonSecondary} onClick={clearSelection}>Remove</button></div></div> : <div onDragEnter={() => setDragging(true)} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={drop} className={`grid min-h-60 place-items-center rounded-xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-slate-50"}`}><div><p className="text-lg font-bold">Drag and drop your CSV here</p><p className="my-2 text-sm text-slate-500">or</p><button className={buttonSecondary} onClick={() => inputRef.current?.click()}>Choose CSV file</button><p className="mt-5 text-sm text-slate-600">The file must include a column named <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">review_text</code>.</p></div></div>}
      <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => void chooseFile(event.target.files?.[0])} />
      <label className="mt-5 block"><span className="text-sm font-extrabold text-stone-700">Apply to location <span className="font-medium text-stone-500">(optional)</span></span><select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} className="mt-2 h-11 w-full rounded-lg border-2 border-stone-300 bg-white px-3 text-sm font-bold"><option value="">Not assigned</option>{locationOptions.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      {status === "error" && <div role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900"><p className="font-bold">We couldn’t use {fileName || "that file"}.</p><ul className="mt-2 list-disc space-y-1 pl-5">{validationErrors.slice(0, 6).map((error) => <li key={error}>{error}</li>)}</ul>{validationErrors.length > 6 && <p className="mt-2">Fix {validationErrors.length - 6} additional validation errors, then try again.</p>}<div className="mt-3 flex gap-2"><button className={buttonPrimary} onClick={() => inputRef.current?.click()}>Choose another file</button><button className={buttonSecondary} onClick={clearSelection}>Back to upload</button></div></div>}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Valid reviews are stored in your connected Supabase project.</p><button className={buttonPrimary} disabled={status !== "selected"} onClick={() => void upload()}>Upload reviews</button></div>
    </section><p className="mt-5 text-center text-sm text-slate-600">Need a file to test? <button className="font-bold text-blue-700 underline underline-offset-4" onClick={() => void loadSampleCsv()}>Use sample CSV</button></p><ImportHistory /></div>;
}

function ImportHistory() {
  const [items, setItems] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetchImports()
      .then(setItems)
      .catch(() => setMessage("Import history is temporarily unavailable."))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (item: ImportBatch) => {
    const confirmed = window.confirm(`Undo ${item.filename}? This removes all ${item.row_count} reviews from that import.`);
    if (!confirmed) return;
    setRemoving(item.id);
    try {
      const result = await undoImport(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      setMessage(`${result.removedReviews} imported reviews were removed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That import could not be undone.");
    } finally {
      setRemoving("");
    }
  };

  return <section className={`${panelClass} mt-8 overflow-hidden`}><div className="border-b-2 border-stone-300 p-5 sm:px-7"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Import history</p><h2 className="mt-1 text-2xl font-bold">Recent files</h2></div>{message && <p role="status" className="border-b-2 border-stone-200 bg-stone-50 px-6 py-3 text-sm font-bold text-stone-700">{message}</p>}{loading ? <p className="p-6 text-sm text-stone-500">Loading import history…</p> : items.length ? <div className="divide-y-2 divide-stone-200">{items.map((item) => <div key={item.id} className="flex flex-col gap-3 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><p className="font-semibold">{item.filename}</p><p className="mt-1 text-xs text-stone-500">{item.row_count} reviews · {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(item.created_at))}</p></div><button className={buttonSecondary} disabled={removing === item.id} onClick={() => void remove(item)}>{removing === item.id ? "Removing…" : "Undo import"}</button></div>)}</div> : <p className="p-6 text-sm text-stone-500">No imports yet.</p>}</section>;
}

function StatusPanel({ eyebrow, title, copy, loading = false, tone, action }: { eyebrow: string; title: string; copy: string; loading?: boolean; tone: "blue" | "green" | "red"; action?: React.ReactNode }) {
  const eyebrowTone = tone === "green" ? "text-teal-700" : tone === "red" ? "text-red-700" : "text-blue-800";
  return <div className="grid min-h-[68vh] place-items-center fade-in"><section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12"><p className={`text-xs font-bold uppercase tracking-[0.14em] ${eyebrowTone}`}>{eyebrow}</p><h1 className="mt-3 text-3xl font-bold">{title}</h1><p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">{copy}</p>{loading && <div className="mx-auto mt-8 h-2 max-w-md overflow-hidden rounded-full bg-slate-100"><div className="progress-shimmer h-full w-1/3 rounded-full bg-blue-700" /></div>}{action}</section></div>;
}

function ReviewExplorer({ revision, location }: { revision: number; location: LocationSelection }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [source, setSource] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [sort, setSort] = useState<"Newest" | "Oldest">("Newest");
  const [quality, setQuality] = useState<"standard" | "all" | "review">("standard");
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
    void fetchReviewSources(location.id)
      .then((values) => {
        if (active) setSources(values);
      })
      .catch(() => {
        if (active) setSources([]);
      });
    return () => {
      active = false;
    };
  }, [location.id, revision]);

  useEffect(() => {
    let active = true;

    void fetchReviews({
      search: debouncedQuery,
      source,
      reviewDate,
      sort: sort.toLowerCase() as ReviewSort,
      page,
      quality,
      locationId: location.id,
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
  }, [debouncedQuery, location.id, page, quality, refreshKey, reviewDate, revision, sort, source]);

  const pages = Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE));
  const current = Math.min(page, pages);
  const update = <T,>(setter: (value: T) => void, value: T) => { setLoading(true); setter(value); setPage(1); };
  const clear = () => { setLoading(true); setQuery(""); setDebouncedQuery(""); setSource(""); setReviewDate(""); setSort("Newest"); setQuality("standard"); setPage(1); };
  return <div className="fade-in"><PageHeading eyebrow="Customer evidence" title="Review explorer" copy={`Search, filter, and sort ${total} reviews for ${location.name.toLowerCase()}.`} />
    <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_150px_170px_170px_190px]"><label><span className="sr-only">Search reviews</span><input value={query} onChange={(e) => update(setQuery, e.target.value)} placeholder="Search review text" className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-600" /></label><Select label="Source" value={source} options={["", ...sources]} optionLabels={{ "": "All sources" }} onChange={(value) => update(setSource, value)} /><label><span className="sr-only">Review date</span><input aria-label="Review date" type="date" value={reviewDate} onInput={(event) => update(setReviewDate, event.currentTarget.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-blue-600" /></label><Select label="Sort reviews" value={sort} options={["Newest", "Oldest"]} onChange={(value) => update(setSort, value as "Newest" | "Oldest")} /><Select label="Reviewer quality" value={quality} options={["standard", "all", "review"]} optionLabels={{ standard: "Hide flagged spam", all: "All reviews", review: "Needs review" }} onChange={(value) => update(setQuality, value as "standard" | "all" | "review")} /></div></section>
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
  return <tr className="align-top hover:bg-slate-50"><td className="max-w-xl px-5 py-4"><p className="text-sm leading-6 text-slate-700">{review.review_text}</p>{review.ordered_items.length > 0 && <p className="mt-2 text-xs font-semibold text-slate-500">Ordered: {review.ordered_items.join(", ")}</p>}{review.legitimacy_status === "review" && <p className="mt-2 text-xs font-semibold text-amber-700">Low-confidence reviewer · {review.legitimacy_reason}</p>}<p className="mt-2 text-xs text-slate-400">{formatReviewDate(review.review_date)}</p></td><td className="px-5 py-4 text-sm font-semibold text-slate-700">{review.theme ?? "Not analyzed yet"}</td><td className="px-5 py-4"><SentimentBadge value={review.sentiment} /></td><td className="px-5 py-4 text-sm font-bold">{review.rating === null ? "Not provided" : `${review.rating}.0`}</td><td className="px-5 py-4 text-sm text-slate-600">{review.source ?? "Not provided"}</td></tr>;
}

function ReviewCard({ review }: { review: ReviewRecord }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><SentimentBadge value={review.sentiment} /><span className="text-sm font-bold">{review.rating === null ? "Not provided" : `${review.rating}.0`}</span></div><p className="mt-4 text-sm leading-6 text-slate-700">{review.review_text}</p>{review.ordered_items.length > 0 && <p className="mt-3 text-xs font-semibold text-slate-500">Ordered: {review.ordered_items.join(", ")}</p>}{review.legitimacy_status === "review" && <p className="mt-2 text-xs font-semibold text-amber-700">Low-confidence reviewer</p>}<div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{review.theme ?? "Not analyzed yet"}</span><span>{review.source ?? "Not provided"}</span><span>{formatReviewDate(review.review_date)}</span></div></article>;
}

function AIDigest({ onOpenTheme }: { onOpenTheme: (theme: Theme) => void }) {
  return <div className="fade-in"><PageHeading eyebrow="AI-assisted review analysis" title="Circuit AI digest" copy="A concise, evidence-linked summary of recurring themes across your locations." />
    <section className="rounded-xl border-2 border-stone-300 bg-[#fff8e7] p-5 shadow-[0_5px_0_rgba(41,37,36,0.08)] sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#b91c1c]">AI-generated summary</p><h2 className="mt-2 text-2xl font-black">Weekly feedback snapshot</h2></div><button className={buttonSecondary} onClick={() => window.print()}>Print digest</button></div><p className="mt-5 max-w-5xl text-base leading-8 text-stone-700">Guests most often praised burger quality, friendly teams, and fresh delivery orders. The clearest recurring complaint is slow service at Riverside during the dinner rush. Food temperature and order accuracy are smaller but repeated delivery friction points. Check the supporting reviews before choosing an operational response.</p></section>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><ThemeList title="What customers love" kicker="Positive feedback" themes={positiveThemes} onOpen={onOpenTheme} /><ThemeList title="What customers complain about" kicker="Recurring friction" themes={frictionThemes} onOpen={onOpenTheme} /></div>
    <section className="mt-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">Investigate first</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold">Slow service and wait times</h2><p className="mt-2 text-sm leading-6 text-slate-700">This theme has the highest displayed complaint mention count. Review the quotes before choosing an operational response.</p></div><button className={buttonSecondary} onClick={() => onOpenTheme(frictionThemes[0])}>View evidence</button></div></section>
    <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">AI-generated classifications should be checked against the source reviews.</div>
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
