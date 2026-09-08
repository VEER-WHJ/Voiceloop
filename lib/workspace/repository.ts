export type WorkspaceLocation = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};

export type ImportBatch = {
  id: string;
  filename: string;
  row_count: number;
  status: string;
  created_at: string;
};

export type ManagerAction = {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  priority: "high" | "normal";
  status: "open" | "monitoring" | "resolved";
  created_at: string;
  updated_at: string;
};

export type Competitor = {
  id: string;
  name: string;
  website: string | null;
  latest_summary: string | null;
  latest_sources: { title: string; url: string }[];
  last_researched_at: string | null;
};

export type SourceConnection = {
  provider: string;
  status: string;
  account_label: string | null;
  last_synced_at: string | null;
  location_id: string | null;
};

async function readJson<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(result.message ?? "Circuit could not complete the request.");
  return result;
}

export async function fetchLocations() {
  const result = await readJson<{ locations: WorkspaceLocation[] }>(
    await fetch("/api/locations", { cache: "no-store" }),
  );
  return result.locations;
}

export async function createLocation(name: string) {
  const result = await readJson<{ location: WorkspaceLocation }>(
    await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  );
  return result.location;
}

export async function updateLocation(id: string, updates: { name?: string; isActive?: boolean }) {
  const result = await readJson<{ location: WorkspaceLocation }>(
    await fetch(`/api/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }),
  );
  return result.location;
}

export async function fetchImports() {
  const result = await readJson<{ imports: ImportBatch[] }>(
    await fetch("/api/imports", { cache: "no-store" }),
  );
  return result.imports;
}

export async function undoImport(id: string) {
  return readJson<{ removedReviews: number }>(
    await fetch(`/api/imports/${id}`, { method: "DELETE" }),
  );
}

export async function fetchManagerActions() {
  const result = await readJson<{ actions: ManagerAction[] }>(
    await fetch("/api/actions", { cache: "no-store" }),
  );
  return result.actions;
}

export async function createManagerAction(input: {
  title: string;
  description?: string;
  locationName?: string;
  priority?: "high" | "normal";
}) {
  const result = await readJson<{ action: ManagerAction }>(
    await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return result.action;
}

export async function updateManagerAction(
  id: string,
  updates: { status: ManagerAction["status"] },
) {
  const result = await readJson<{ action: ManagerAction }>(
    await fetch(`/api/actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }),
  );
  return result.action;
}

export async function fetchCompetitors() {
  const result = await readJson<{ competitors: Competitor[] }>(
    await fetch("/api/competitors", { cache: "no-store" }),
  );
  return result.competitors;
}

export async function createCompetitor(name: string, website?: string) {
  const result = await readJson<{ competitor: Competitor }>(
    await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, website }),
    }),
  );
  return result.competitor;
}

export async function runCompetitorResearch(id: string) {
  const result = await readJson<{ competitor: Competitor }>(
    await fetch(`/api/competitors/${id}/research`, { method: "POST" }),
  );
  return result.competitor;
}

export async function fetchSourceConnections(locationId: string) {
  const result = await readJson<{ connections: SourceConnection[] }>(
    await fetch(`/api/connections?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" }),
  );
  return result.connections;
}
