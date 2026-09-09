"use client";

import { type CSSProperties, type FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ChartBar,
  CheckCircle,
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
  UserCircle,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

import {
  fetchReviews,
  fetchReviewSources,
  REVIEWS_PAGE_SIZE,
  type ReviewSort,
} from "@/lib/reviews/repository";
import type { ReviewRecord } from "@/lib/supabase/database.types";
import { fetchDashboard, type DashboardData, type DashboardTheme } from "@/lib/dashboard/repository";
import {
  createLocation,
  createCompetitor,
  fetchAccount,
  fetchCompetitors,
  fetchLocations,
  fetchSourceConnections,
  runCompetitorResearch,
  updateAccount,
  updateLocation,
  type AccountProfile,
  type Competitor,
  type WorkspaceLocation,
} from "@/lib/workspace/repository";

type View = "dashboard" | "reviews" | "sources" | "digest" | "competitors" | "locations" | "account";
type LocationSelection = { id: string; name: string; themeIndex: number };

const navItems: { id: View; label: string; icon: typeof House }[] = [
  { id: "dashboard", label: "Overview", icon: House },
  { id: "reviews", label: "Reviews", icon: ListMagnifyingGlass },
  { id: "digest", label: "AI digest", icon: Sparkle },
  { id: "competitors", label: "Competitors", icon: UsersThree },
];
const locationAwareViews: View[] = ["dashboard", "reviews", "sources", "digest"];

const pageLabels: Record<View, string> = {
  dashboard: "Overview",
  reviews: "Reviews",
  sources: "Sources",
  digest: "AI digest",
  competitors: "Competitors",
  locations: "Locations",
  account: "Account",
};

const buttonPrimary = "location-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300";
const buttonSecondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const panelClass = "rounded-[18px] border border-slate-200 bg-white shadow-sm";

const providerAliases: Record<string, string[]> = {
  google: ["google", "google_business_profile"],
  ovation: ["ovation", "ovation_toast", "ovation_toast_pos"],
};

function providerIsConnected(connectedProviders: string[], provider: string) {
  const aliases = providerAliases[provider] ?? [provider];
  return aliases.some((alias) => connectedProviders.includes(alias));
}

function getLocationTheme(themeIndex: number) {
  const hue = themeIndex === 0 ? 158 : Math.min(222, 176 + (themeIndex - 1) * 12);
  return {
    accent: `hsl(${hue} 68% 34%)`,
    dark: `hsl(${hue} 66% 24%)`,
    soft: `hsl(${hue} 62% 95%)`,
    glow: `hsl(${hue} 70% 45% / 0.24)`,
  };
}

export function CircuitApp() {
  const [view, setView] = useState<View>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState<LocationSelection>({ id: "all", name: "All locations", themeIndex: 0 });

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
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

  const theme = getLocationTheme(location.themeIndex);
  const workspaceStyle = {
    "--location-accent": theme.accent,
    "--location-accent-dark": theme.dark,
    "--location-accent-soft": theme.soft,
    "--location-glow": theme.glow,
  } as CSSProperties;

  return (
    <div className="circuit-workspace min-h-screen text-slate-950" style={workspaceStyle}>
      <a href="#main-content" className="fixed left-3 top-3 z-[90] -translate-y-24 rounded-lg bg-stone-950 px-4 py-3 font-bold text-white focus:translate-y-0">Skip to main content</a>
      <Sidebar view={view} open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />
      <MobileHeader
        onHome={() => navigate("dashboard")}
        onToggle={() => setMenuOpen((value) => !value)}
      />
      <main id="main-content" className="min-h-screen px-4 pb-12 pt-6 sm:px-6 lg:ml-[236px] lg:px-10 lg:pb-16 lg:pt-8 xl:px-14">
        <div className="mx-auto max-w-[1240px]">
          <WorkspaceHeader view={view} location={location} onLocationChange={setLocation} onNavigate={navigate} />
        {view === "dashboard" && <Dashboard key={location.id} location={location} onNavigate={navigate} />}
        {view === "reviews" && <ReviewExplorer revision={0} location={location} />}
        {view === "sources" && <SourcesScreen location={location} onNavigate={navigate} />}
        {view === "digest" && <AIDigest key={location.id} location={location} />}
        {view === "competitors" && <CompetitorsScreen />}
        {view === "locations" && <LocationsScreen />}
        {view === "account" && <AccountScreen />}
        </div>
      </main>
    </div>
  );
}

function CircuitMark({ onHome, compact = false }: { onHome: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      className="brand-mark rounded-lg text-left outline-none transition hover:opacity-75 focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-4"
      onClick={onHome}
      aria-label="Go to the Circuit overview"
    >
      <p className={`${compact ? "text-[19px]" : "text-[22px]"} tracking-[-0.035em] text-slate-950`}><span className="location-accent-text font-bold">Circuit</span><span className="ml-1.5 font-medium text-slate-600">Feedback</span></p>
    </button>
  );
}

function Sidebar({ view, open, onClose, onNavigate }: { view: View; open: boolean; onClose: () => void; onNavigate: (view: View) => void }) {
  return (
    <>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-50 bg-stone-950/35 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-[60] flex w-[236px] flex-col border-r-2 border-slate-200 bg-slate-50 px-4 py-6 shadow-[6px_0_20px_rgba(15,23,42,0.05)] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-start justify-between px-3"><CircuitMark onHome={() => onNavigate("dashboard")} /><button className="grid h-11 w-11 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden" onClick={onClose} aria-label="Close menu"><X size={20} weight="bold" /></button></div>
        <nav id="main-menu" aria-label="Circuit workspace" className="mt-10 space-y-1.5">
          {navItems.map((item) => { const Icon = item.icon; return (
            <button key={item.id} onClick={() => onNavigate(item.id)} aria-current={view === item.id ? "page" : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-semibold transition ${view === item.id ? "location-nav-active" : "location-nav-idle text-slate-600"}`}><Icon size={19} weight={view === item.id ? "fill" : "bold"} />{item.label}</button>
          ); })}
        </nav>
        <button type="button" onClick={() => onNavigate("account")} aria-current={view === "account" ? "page" : undefined} className={`mt-auto flex w-full items-center gap-3 rounded-xl border-2 bg-white p-3.5 text-left shadow-[0_3px_0_rgba(41,37,36,0.07)] transition ${view === "account" ? "location-account-active" : "border-stone-300 hover:border-slate-400 hover:bg-slate-50"}`}><div className="location-account-icon grid h-9 w-9 shrink-0 place-items-center rounded-full"><UserCircle size={21} weight="fill" /></div><div className="min-w-0"><p className="truncate text-sm font-bold">Account</p><p className="truncate text-xs text-stone-500">Company & profile</p></div><ArrowRight className="ml-auto text-slate-400" size={17} weight="bold" /></button>
      </aside>
    </>
  );
}

function MobileHeader({ onHome, onToggle }: { onHome: () => void; onToggle: () => void }) {
  return <header className="sticky top-0 z-40 flex h-[74px] items-center justify-between border-b-2 border-slate-200 bg-slate-50/95 px-4 backdrop-blur lg:hidden"><CircuitMark compact onHome={onHome} /><button type="button" className={buttonSecondary} onClick={onToggle} aria-controls="main-menu"><ListMagnifyingGlass size={18} weight="bold" />Menu</button></header>;
}

function WorkspaceHeader({ view, location, onLocationChange, onNavigate }: { view: View; location: LocationSelection; onLocationChange: (location: LocationSelection) => void; onNavigate: (view: View) => void }) {
  const pageTitle = pageLabels[view];
  const [workspaceLocations, setWorkspaceLocations] = useState<WorkspaceLocation[]>([]);

  useEffect(() => {
    if (!locationAwareViews.includes(view)) return;
    let active = true;
    void fetchLocations()
      .then((locations) => {
        if (!active) return;
        const visibleLocations = locations.filter((item) => item.is_active);
        setWorkspaceLocations(visibleLocations);
        if (location.id !== "all" && !visibleLocations.some((item) => item.id === location.id)) {
          onLocationChange({ id: "all", name: "All locations", themeIndex: 0 });
        }
      })
      .catch(() => {
        if (active) setWorkspaceLocations([]);
      });
    return () => { active = false; };
  }, [location.id, onLocationChange, view]);

  const options = [
    { id: "all", name: "All locations", themeIndex: 0 },
    ...workspaceLocations.map(({ id, name }, index) => ({ id, name, themeIndex: index + 1 })),
  ];
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="location-accent-text text-sm font-semibold uppercase tracking-[0.12em]">{pageTitle}</p><h1 className="mt-1 text-[2rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[2.7rem]">Customer Feedback{location.id === "all" || !locationAwareViews.includes(view) ? "" : ` - ${location.name}`}</h1></div>
        <div className="flex items-center gap-2"><NotificationBell view={view} onNavigate={onNavigate} /><button className={buttonPrimary} onClick={() => onNavigate("sources")}><PlugsConnected size={18} weight="bold" />Connect source</button></div>
      </div>
      {locationAwareViews.includes(view) && <div className="mt-7"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Locations</p><div className="location-tabs -mx-1 flex gap-2 overflow-x-auto p-1 pb-2" role="group" aria-label="Choose a location">{options.map((item) => <button key={item.id} type="button" aria-pressed={location.id === item.id} onClick={() => onLocationChange(item)} className={`min-h-11 shrink-0 rounded-xl border-2 px-4 text-sm font-semibold transition ${location.id === item.id ? "location-tab-selected" : "location-tab-idle"}`}>{item.name}</button>)}<button type="button" onClick={() => onNavigate("locations")} className="location-tab-add grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2" aria-label="Add a location"><Plus size={19} weight="bold" /></button></div></div>}
    </header>
  );
}

function NotificationBell({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ title: string; copy: string; view: View }>>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([fetchLocations(), fetchSourceConnections("all")])
      .then(([locations, connections]) => {
        if (!active) return;
        const next: Array<{ title: string; copy: string; view: View }> = [];
        if (locations.length === 0) {
          next.push({ title: "Add your first location", copy: "Set up a location before connecting its feedback accounts.", view: "locations" });
        }
        if (!connections.some((connection) => connection.status === "connected")) {
          next.push({ title: "Connect a feedback source", copy: "Authorize a source to begin receiving customer feedback.", view: "sources" });
        }
        setNotifications(next);
      })
      .catch(() => {
        if (active) setNotifications([]);
      });
    return () => { active = false; };
  }, [view]);

  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} className="location-accent-text location-notification relative grid h-11 w-11 place-items-center rounded-xl border-2 border-slate-300 bg-white shadow-sm" aria-label={`${notifications.length} notifications`} aria-expanded={open}><Bell size={20} weight="bold" />{notifications.length > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{notifications.length}</span>}</button>{open && <div className="absolute right-0 top-14 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-200 px-4 py-3"><p className="font-semibold">Notifications</p></div>{notifications.length ? notifications.map((item) => <button key={item.title} type="button" onClick={() => { setOpen(false); onNavigate(item.view); }} className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.copy}</p></button>) : <p className="px-4 py-5 text-sm text-slate-500">You’re all caught up.</p>}</div>}</div>;
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="location-accent-text text-xs font-bold uppercase tracking-[0.14em]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-stone-950 sm:text-[2.5rem]">{title}</h1>
        <p className="mt-2 text-base leading-7 text-stone-600 sm:text-lg">{copy}</p>
      </div>
      {action}
    </header>
  );
}

function GuidedStart({ onNavigate }: { onNavigate: (view: View) => void }) {
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

  const steps: Array<{ number: string; title: string; copy: string; view: View; tone: string }> = [
    { number: "1", title: "Add locations", copy: "Create the stores you want to monitor.", view: "locations", tone: "location-accent-background" },
    { number: "2", title: "Connect sources", copy: "Authorize the accounts that collect feedback.", view: "sources", tone: "bg-sky-600" },
    { number: "3", title: "Explore reviews", copy: "Search feedback after connections begin syncing.", view: "reviews", tone: "bg-amber-500" },
  ];

  return (
    <section className={`${panelClass} overflow-hidden bg-white`} aria-label="Circuit quick start">
      <div className="flex items-start justify-between gap-4 border-b-2 border-slate-200 px-5 py-4 sm:px-7"><div><p className="location-accent-text text-xs font-semibold uppercase tracking-[0.14em]">Getting started</p><h2 className="mt-1 text-2xl font-bold">Workspace setup</h2></div><button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={dismiss} aria-label="Dismiss setup guide"><X size={20} weight="bold" /></button></div>
      <div className="grid divide-y-2 divide-slate-200 md:grid-cols-3 md:divide-x-2 md:divide-y-0">
        {steps.map((step) => <button key={step.number} className="group p-5 text-left hover:bg-slate-50 sm:p-6" onClick={() => onNavigate(step.view)}><span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white ${step.tone}`}>{step.number}</span><h3 className="mt-4 font-bold group-hover:text-teal-700">{step.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{step.copy}</p></button>)}
      </div>
    </section>
  );
}

function Dashboard({ location, onNavigate }: { location: LocationSelection; onNavigate: (view: View) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetchDashboard(location.id)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) {
          setData(null);
          setError(loadError instanceof Error ? loadError.message : "Overview data could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [location.id]);

  if (loading) return <div className="fade-in"><GuidedStart onNavigate={onNavigate} /><section className={`${panelClass} mt-6 p-8 text-center text-slate-500`}>Loading overview…</section></div>;
  if (error || !data) return <div className="fade-in"><section className={`${panelClass} p-8 text-center`}><h2 className="text-xl font-bold">Overview unavailable</h2><p className="mt-2 text-slate-600">{error}</p></section></div>;

  const selected = location.name;
  return (
    <div className="fade-in">
      <GuidedStart onNavigate={onNavigate} />
      <section className={`${panelClass} mt-6 overflow-hidden`}>
        <div className={`border-b-2 px-5 py-4 sm:px-7 ${data.topIssue ? "border-amber-200 bg-amber-50" : "border-teal-200 bg-teal-50"}`}><div className={`flex items-center gap-2 ${data.topIssue ? "text-amber-800" : "text-teal-800"}`}>{data.topIssue ? <WarningCircle size={20} weight="fill" /> : <CheckCircle size={20} weight="fill" />}<p className="text-xs font-bold uppercase tracking-[0.14em]">{data.topIssue ? "Needs attention" : "Current status"}</p></div></div>
        <div className="p-5 sm:p-8">
          {data.topIssue ? <><p className="text-sm font-semibold text-slate-500">{selected}</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.035em]">{data.topIssue.name}</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">{data.topIssue.count} negative {data.topIssue.count === 1 ? "review mentions" : "reviews mention"} this theme.</p><button className={`${buttonSecondary} mt-5`} onClick={() => onNavigate("reviews")}>View reviews <ArrowRight size={17} weight="bold" /></button></> : <><h2 className="text-2xl font-bold">{data.metrics.reviewCount ? "No recurring negative theme detected" : "No review data yet"}</h2><p className="mt-2 max-w-2xl leading-7 text-slate-600">{data.metrics.reviewCount ? "Circuit has not found a repeated negative theme in the analyzed reviews for this selection." : "Add locations and connect feedback sources to begin building this overview."}</p>{!data.metrics.reviewCount && <button className={`${buttonPrimary} mt-5`} onClick={() => onNavigate("sources")}><PlugsConnected size={17} weight="bold" />Connect source</button>}</>}
        </div>
      </section>

      <section className={`${panelClass} mt-6 overflow-hidden`}>
        <div className="flex flex-col gap-4 border-b-2 border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><p className="location-accent-text text-xs font-semibold uppercase tracking-[0.14em]">Performance</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] sm:text-3xl">{selected}</h2><p className="mt-1 text-sm text-slate-500">{data.metrics.reviewCount} reviews from {data.metrics.sourceCount} {data.metrics.sourceCount === 1 ? "source" : "sources"}</p></div><button className={buttonSecondary} onClick={() => onNavigate("reviews")}>View reviews <ArrowRight size={17} weight="bold" /></button></div>
        <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-slate-200 md:grid-cols-4 md:divide-y-0">
          <MetricCard label="Average rating" value={data.metrics.averageRating === null ? "—" : data.metrics.averageRating.toFixed(1)} detail={data.metrics.averageRating === null ? "No rated reviews" : `${data.metrics.reviewCount} total reviews`} />
          <MetricCard label="Positive sentiment" value={data.metrics.positivePercent === null ? "—" : `${data.metrics.positivePercent}%`} detail={data.metrics.positivePercent === null ? "No analyzed reviews" : `${data.metrics.analyzedCount} analyzed`} tone="positive" />
          <MetricCard label="Negative reviews" value={String(data.metrics.negativeCount)} detail="Excludes provider-flagged spam" tone={data.metrics.negativeCount ? "warning" : undefined} />
          <MetricCard label="Analyzed reviews" value={String(data.metrics.analyzedCount)} detail={data.metrics.reviewCount ? `${Math.round((data.metrics.analyzedCount / data.metrics.reviewCount) * 100)}% of feedback` : "No feedback yet"} />
        </div>
        <div className="overflow-x-auto border-t-2 border-slate-200"><table className="w-full min-w-[620px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500"><tr><th className="px-6 py-4">Location</th><th className="px-6 py-4">Rating</th><th className="px-6 py-4">Reviews</th><th className="px-6 py-4">Top issue</th></tr></thead><tbody className="divide-y divide-slate-200">{data.locations.map((row) => <tr key={row.id} className="location-notification bg-white"><td className="px-6 py-4 font-semibold"><span className="inline-flex items-center gap-2"><MapPin size={17} weight="fill" className="location-accent-text" />{row.name}</span></td><td className="px-6 py-4 font-bold">{row.score === null ? "—" : row.score.toFixed(1)}</td><td className="px-6 py-4 text-slate-600">{row.reviews}</td><td className="px-6 py-4 text-slate-600">{row.issue ?? "No recurring issue"}</td></tr>)}{data.locations.length === 0 && <tr><td colSpan={4} className="bg-white px-6 py-8 text-center text-sm text-slate-500">Add a location to begin.</td></tr>}</tbody></table></div>
        <div className="flex justify-end border-t-2 border-slate-200 bg-slate-50 px-5 py-4"><button className={buttonSecondary} onClick={() => onNavigate("locations")}>Manage locations <ArrowRight size={17} weight="bold" /></button></div>
      </section>

      <SourceFreshness location={location} onNavigate={onNavigate} />
    </div>
  );
}

function MetricCard({ label, value, detail, compact = false, tone }: { label: string; value: string; detail: string; compact?: boolean; tone?: "positive" | "warning" }) {
  return <article className="min-h-40 bg-white p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p><p className={`mt-4 font-bold leading-tight tracking-[-0.03em] text-slate-950 ${compact ? "text-[1.35rem]" : "text-3xl"}`}>{value}</p><p className={`mt-3 text-sm font-semibold ${tone === "positive" ? "text-teal-700" : tone === "warning" ? "text-amber-700" : "text-slate-500"}`}>{detail}</p></article>;
}

function SourceFreshness({ location, onNavigate }: { location: LocationSelection; onNavigate: (view: View) => void }) {
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  useEffect(() => {
    void fetchSourceConnections(location.id).then((items) => setConnectedProviders(items.filter((item) => item.status === "connected").map((item) => item.provider.toLowerCase()))).catch(() => setConnectedProviders([]));
  }, [location.id]);
  const sources = [
    { provider: "google", name: "Google", status: "Manager approval required", icon: GoogleLogo, color: "text-blue-600" },
    { provider: "doordash", name: "DoorDash", status: "Account connection required", icon: Storefront, color: "text-rose-600" },
    { provider: "ubereats", name: "Uber Eats", status: "Account connection required", icon: Storefront, color: "text-emerald-700" },
    { provider: "yelp", name: "Yelp", status: "Account connection required", icon: Sparkle, color: "text-red-600" },
    { provider: "grubhub", name: "Grubhub", status: "Account connection required", icon: PlugsConnected, color: "text-orange-700" },
    { provider: "ovation", name: "Ovation + Toast", status: "Partner setup", icon: PlugsConnected, color: "text-violet-700" },
  ];
  return <section className={`${panelClass} mt-6 overflow-hidden`}><div className="flex flex-col gap-3 border-b-2 border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sources for {location.name.toLowerCase()}</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.025em]">Connection status</h2></div><button className={buttonSecondary} onClick={() => onNavigate("sources")}>Manage sources <ArrowRight size={17} weight="bold" /></button></div><div className="grid sm:grid-cols-2 xl:grid-cols-3">{sources.map((source) => { const Icon = source.icon; const connected = providerIsConnected(connectedProviders, source.provider); return <div key={source.name} className="border-b border-r border-slate-200 p-5"><div className="flex items-start gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 ${source.color}`}><Icon size={21} weight="bold" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{source.name}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${connected ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{connected ? "Connected" : "Not connected"}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{connected ? "Feedback is included in this location." : `${source.status}. Connect this source to include its feedback.`}</p></div></div></div>; })}</div></section>;
}

function SourcesScreen({ location, onNavigate }: { location: LocationSelection; onNavigate: (view: View) => void }) {
  const [setupOpen, setSetupOpen] = useState<"google" | "ovation" | "marketplace" | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void fetchSourceConnections(location.id)
      .then((connections) => {
        if (active) setConnectedProviders(connections.filter((connection) => connection.status === "connected").map((connection) => connection.provider.toLowerCase()));
      })
      .catch(() => {
        if (active) setConnectedProviders([]);
      });
    return () => { active = false; };
  }, [location.id]);

  const sourceCards = [
    { provider: "google", name: "Google Business Profile", copy: "Connect the Google account that manages your verified locations.", icon: GoogleLogo, tone: "text-blue-600", setup: "google" as const },
    { provider: "doordash", name: "DoorDash", copy: "Connect merchant feedback when provider access is available for your account.", icon: Storefront, tone: "text-rose-600", setup: "marketplace" as const },
    { provider: "ubereats", name: "Uber Eats", copy: "Connect the restaurant account that receives delivery feedback.", icon: Storefront, tone: "text-emerald-700", setup: "marketplace" as const },
    { provider: "yelp", name: "Yelp", copy: "Connect the business account that manages your Yelp locations.", icon: Sparkle, tone: "text-red-600", setup: "marketplace" as const },
    { provider: "grubhub", name: "Grubhub", copy: "Connect the merchant account associated with your locations.", icon: PlugsConnected, tone: "text-orange-700", setup: "marketplace" as const },
    { provider: "ovation", name: "Ovation + Toast POS", copy: "Bring SMS feedback together with the Toast order and menu items linked to that guest response.", icon: PlugsConnected, tone: "text-violet-700", setup: "ovation" as const },
  ];
  return <div className="fade-in">
    <PageHeading eyebrow="Connections" title="Feedback sources" copy={`Link the accounts that collect feedback for ${location.name.toLowerCase()}.`} />
    <section className={`${panelClass} overflow-hidden`}>
      <div className="grid gap-px bg-slate-200 md:grid-cols-2 xl:grid-cols-3">{sourceCards.map((source) => { const Icon = source.icon; const connected = providerIsConnected(connectedProviders, source.provider); return <article key={source.name} className="flex min-h-[260px] flex-col bg-white p-6"><div className="flex items-start justify-between gap-4"><div className={`grid h-12 w-12 place-items-center rounded-xl border-2 border-slate-200 bg-slate-50 ${source.tone}`}><Icon size={25} weight="bold" /></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"}`}>{connected ? "Connected" : "Not connected"}</span></div><h2 className="mt-5 text-xl font-bold tracking-[-0.02em]">{source.name}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{source.copy}</p><button className={`${buttonSecondary} mt-auto self-start`} onClick={() => setSetupOpen(source.setup)}>{connected ? "Manage connection" : "Connection setup"}<ArrowRight size={17} weight="bold" /></button></article>; })}</div>
    </section>
    <section className={`${panelClass} mt-6 grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center sm:p-7`}><div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-700"><ChartBar size={24} weight="bold" /></div><div><h2 className="text-xl font-bold">Review data</h2><p className="mt-1 text-sm leading-6 text-stone-600">Circuit keeps source, date, rating, review text, and available order context together. AI analysis is stored separately.</p></div><button className={buttonSecondary} onClick={() => onNavigate("reviews")}>Open reviews</button></section>
    {setupOpen && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 p-4" onMouseDown={() => setSetupOpen(null)}><section role="dialog" aria-modal="true" aria-labelledby="source-setup-title" className={`${panelClass} w-full max-w-xl p-6 sm:p-8`} onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700">{setupOpen === "google" ? <GoogleLogo size={26} weight="bold" /> : <PlugsConnected size={26} weight="bold" />}</div><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setSetupOpen(null)} aria-label="Close source setup"><X size={20} weight="bold" /></button></div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">{setupOpen === "google" ? "Google Business Profile" : setupOpen === "ovation" ? "Ovation + Toast POS" : "Marketplace account"}</p><h2 id="source-setup-title" className="mt-2 text-3xl font-bold tracking-[-0.035em]">Connection setup</h2><p className="mt-3 leading-7 text-slate-600">{setupOpen === "google" ? "Sign in with the Google account that manages your verified locations and approve access when Google connection credentials are configured." : setupOpen === "ovation" ? "Enable Ovation in Toast Web for the required locations, then complete Ovation onboarding. Circuit will use authorized SMS feedback with the associated Toast menu items when integration credentials are supplied." : "Direct provider access must be authorized by the restaurant account owner. Circuit will not collect feedback until that connection is available and approved."}</p><div className="mt-6 rounded-xl border border-slate-200 bg-teal-50/60 p-4"><div className="flex gap-3"><CheckCircle size={21} weight="fill" className="mt-0.5 shrink-0 text-teal-700" /><div><p className="font-semibold">Not connected</p><p className="mt-1 text-sm leading-6 text-slate-600">No account data or credentials are stored until the account owner completes provider authorization.</p></div></div></div><div className="mt-7 flex justify-end"><button className={buttonSecondary} onClick={() => setSetupOpen(null)}>Close</button></div></section></div>}
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
<section className={`${panelClass} p-5 sm:p-7`}><h2 className="text-xl font-bold">Add a competitor</h2><div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><label><span className="sr-only">Competitor name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Competitor name" maxLength={120} className="h-11 w-full rounded-lg border-2 border-slate-300 px-4 text-sm outline-none focus:border-slate-600" /></label><label><span className="sr-only">Website (optional)</span><input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="Website (optional)" type="url" className="h-11 w-full rounded-lg border-2 border-slate-300 px-4 text-sm outline-none focus:border-slate-600" /></label><button type="button" className={buttonPrimary} disabled={saving || !name.trim()} onClick={() => void add()}><Plus size={17} weight="bold" />{saving ? "Adding…" : "Add competitor"}</button></div>{error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}</section>
    <section className="mt-6 grid gap-5 lg:grid-cols-2">{loading ? <div className={`${panelClass} p-7 text-sm text-slate-500`}>Loading competitors…</div> : items.length ? items.map((competitor) => <article key={competitor.id} className={`${panelClass} flex flex-col p-5 sm:p-7`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-bold">{competitor.name}</h2>{competitor.website && <a href={competitor.website} target="_blank" rel="noreferrer" className="mt-1 block max-w-sm truncate text-sm text-slate-500 underline decoration-slate-300 underline-offset-4">{competitor.website}</a>}</div><button type="button" className={buttonSecondary} disabled={Boolean(researching)} onClick={() => void research(competitor.id)}><Sparkle size={17} weight="bold" />{researching === competitor.id ? "Researching…" : competitor.latest_summary ? "Refresh briefing" : "Research online"}</button></div>{competitor.latest_summary ? <div className="mt-6"><p className="whitespace-pre-line text-sm leading-7 text-slate-700">{competitor.latest_summary}</p>{competitor.latest_sources.length > 0 && <div className="mt-5 border-t border-slate-200 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sources</p><ul className="mt-2 space-y-2">{competitor.latest_sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">{source.title}</a></li>)}</ul></div>}</div> : <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">No briefing yet. Research runs only when you click the button and uses current public web sources.</p>}</article>) : <div className={`${panelClass} p-8 text-center lg:col-span-2`}><UsersThree className="mx-auto text-slate-400" size={36} weight="bold" /><h2 className="mt-3 text-xl font-bold">No competitors added</h2><p className="mt-1 text-sm text-slate-500">Add a restaurant brand above to start tracking it.</p></div>}</section>
  </div>;
}

function AccountScreen() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchAccount()
      .then((profile) => {
        if (active) {
          setAccount(profile);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Account details could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!account) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateAccount({
        companyName: account.companyName,
        managerName: account.managerName,
        roleTitle: account.roleTitle,
      });
      setAccount(updated);
      setError("");
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Account details could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  const updateField = (field: "companyName" | "managerName" | "roleTitle", value: string) => {
    setAccount((current) => current ? { ...current, [field]: value } : current);
    setSaved(false);
  };

  return <div className="fade-in"><PageHeading eyebrow="Account" title="Company and profile" copy="Set the details used to identify this workspace and manage your sign-in." />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
      <section className={`${panelClass} overflow-hidden`}>
        <div className="border-b-2 border-slate-200 p-6 sm:p-7"><h2 className="text-2xl font-bold">Workspace details</h2><p className="mt-1 text-sm leading-6 text-slate-600">These labels are private to your Circuit account.</p></div>
        {loading ? <p className="p-7 text-sm text-slate-500">Loading account…</p> : account ? <form className="space-y-5 p-6 sm:p-7" onSubmit={save}>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Company name</span><input value={account.companyName} onChange={(event) => updateField("companyName", event.target.value)} maxLength={120} autoComplete="organization" placeholder="Your company" className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-sm outline-none" /></label>
          <div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Your name</span><input value={account.managerName} onChange={(event) => updateField("managerName", event.target.value)} maxLength={120} autoComplete="name" placeholder="Manager name" className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-sm outline-none" /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Role</span><input value={account.roleTitle} onChange={(event) => updateField("roleTitle", event.target.value)} maxLength={120} autoComplete="organization-title" placeholder="Owner, manager…" className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-sm outline-none" /></label></div>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email</span><input value={account.email} readOnly className="h-12 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm text-slate-500" /></label>
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p>}
          {saved && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Account details saved.</p>}
          <button type="submit" className={buttonPrimary} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </form> : <div className="p-7"><p role="alert" className="text-sm font-semibold text-rose-800">{error || "Account details are unavailable."}</p></div>}
      </section>
      <div className="space-y-6">
        <section className={`${panelClass} p-6 sm:p-7`}><div className="location-account-icon grid h-11 w-11 place-items-center rounded-xl"><ShieldCheck size={23} weight="fill" /></div><h2 className="mt-4 text-xl font-bold">Protected workspace</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your reviews, locations, connections, and AI results are isolated to this account.</p></section>
        <section className={`${panelClass} p-6 sm:p-7`}><h2 className="text-xl font-bold">Session</h2><p className="mt-2 text-sm leading-6 text-slate-600">Sign out when you are finished on a shared device.</p><button type="button" onClick={() => void signOut()} className={`${buttonSecondary} mt-5 w-full`}><SignOut size={18} weight="bold" />Sign out</button></section>
      </div>
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
      {loading ? <div className="p-10 text-center"><h3 className="text-xl font-bold">Loading reviews</h3><p className="mt-2 text-slate-600">Reading the latest data from Supabase.</p></div> : loadError ? <div role="alert" className="p-10 text-center"><h3 className="text-xl font-bold">Reviews unavailable</h3><p className="mt-2 text-slate-600">{loadError}</p><button className={`${buttonPrimary} mt-5`} onClick={() => { setLoading(true); setLoadError(""); setRefreshKey((value) => value + 1); }}>Try again</button></div> : storedReviews.length ? <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[860px] border-collapse text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Review</th><th className="px-5 py-4">Theme</th><th className="px-5 py-4">Sentiment</th><th className="px-5 py-4">Rating</th><th className="px-5 py-4">Source</th></tr></thead><tbody className="divide-y divide-slate-100">{storedReviews.map((review) => <ReviewRow key={review.id} review={review} />)}</tbody></table></div><div className="space-y-3 p-4 md:hidden">{storedReviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div></> : <div className="p-10 text-center"><h3 className="text-xl font-bold">No reviews match</h3><p className="mt-2 text-slate-600">Connect a feedback source or try a broader search.</p><button className={`${buttonPrimary} mt-5`} onClick={clear}>Clear filters</button></div>}
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

function AIDigest({ location }: { location: LocationSelection }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetchDashboard(location.id)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "The digest could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [location.id]);

  return <div className="fade-in"><PageHeading eyebrow="AI-assisted review analysis" title="Circuit AI digest" copy={`Recurring themes found in analyzed feedback for ${location.name.toLowerCase()}.`} />
    {loading ? <section className={`${panelClass} p-8 text-center text-slate-500`}>Loading analyzed feedback…</section> : error || !data ? <section className={`${panelClass} p-8 text-center`}><h2 className="text-xl font-bold">Digest unavailable</h2><p className="mt-2 text-slate-600">{error}</p></section> : data.metrics.analyzedCount === 0 ? <section className={`${panelClass} p-8 text-center`}><Sparkle className="mx-auto text-teal-600" size={36} weight="bold" /><h2 className="mt-3 text-2xl font-bold">No analyzed feedback yet</h2><p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">Once connected sources deliver reviews and analysis is complete, recurring themes will appear here.</p></section> : <>
      <section className={`${panelClass} overflow-hidden`}><div className="border-b-2 border-teal-200 bg-teal-50 px-5 py-4 sm:px-7"><p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-800">Current analysis</p></div><div className="p-5 sm:p-7"><h2 className="text-2xl font-bold">{data.metrics.analyzedCount} analyzed {data.metrics.analyzedCount === 1 ? "review" : "reviews"}</h2><p className="mt-2 max-w-3xl leading-7 text-slate-600">The lists below count themes found in the feedback currently stored for this location selection.</p></div></section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><ThemeList title="What customers value" kicker="Positive feedback" themes={data.positiveThemes} tone="positive" /><ThemeList title="What needs attention" kicker="Negative feedback" themes={data.negativeThemes} tone="warning" /></div>
      <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">AI classifications should be checked against the original reviews before operational decisions are made.</div>
    </>}
  </div>;
}

function ThemeList({ title, kicker, themes, tone }: { title: string; kicker: string; themes: DashboardTheme[]; tone: "positive" | "warning" }) {
  return <section className={`${panelClass} overflow-hidden`}><div className="border-b-2 border-slate-200 p-5 sm:p-6"><p className={`text-xs font-bold uppercase tracking-[0.12em] ${tone === "positive" ? "text-teal-700" : "text-amber-700"}`}>{kicker}</p><h2 className="mt-1 text-2xl font-bold">{title}</h2></div><div className="divide-y divide-slate-200">{themes.length ? themes.map((theme) => <div key={theme.name} className="flex items-center justify-between gap-4 bg-white p-5 sm:p-6"><h3 className="font-semibold">{theme.name}</h3><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${tone === "positive" ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"}`}>{theme.count} {theme.count === 1 ? "review" : "reviews"}</span></div>) : <p className="bg-white p-6 text-sm text-slate-500">No {tone === "positive" ? "positive" : "negative"} themes have been recorded yet.</p>}</div></section>;
}
