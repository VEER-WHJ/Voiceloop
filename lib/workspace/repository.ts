export type WorkspaceLocation = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  sort_order: number;
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

export type AccountProfile = {
  email: string;
  companyName: string;
  managerName: string;
  roleTitle: string;
};

export async function fetchAccount() {
  const result = await readApiJson<{ account: AccountProfile }>(
    await fetch("/api/account", { cache: "no-store" }),
  );
  return result.account;
}

export async function updateAccount(input: Omit<AccountProfile, "email">) {
  const result = await readApiJson<{ account: AccountProfile }>(
    await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return result.account;
}

export async function fetchLocations() {
  const result = await readApiJson<{ locations: WorkspaceLocation[] }>(
    await fetch("/api/locations", { cache: "no-store" }),
  );
  return result.locations;
}

export async function createLocation(name: string) {
  const result = await readApiJson<{ location: WorkspaceLocation }>(
    await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  );
  return result.location;
}

export async function updateLocation(id: string, updates: { name?: string; isActive?: boolean }) {
  const result = await readApiJson<{ location: WorkspaceLocation }>(
    await fetch(`/api/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }),
  );
  return result.location;
}

export async function fetchManagerActions() {
  const result = await readApiJson<{ actions: ManagerAction[] }>(
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
  const result = await readApiJson<{ action: ManagerAction }>(
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
  const result = await readApiJson<{ action: ManagerAction }>(
    await fetch(`/api/actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }),
  );
  return result.action;
}

export async function fetchCompetitors() {
  const result = await readApiJson<{ competitors: Competitor[] }>(
    await fetch("/api/competitors", { cache: "no-store" }),
  );
  return result.competitors;
}

export async function createCompetitor(name: string, website?: string) {
  const result = await readApiJson<{ competitor: Competitor }>(
    await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, website }),
    }),
  );
  return result.competitor;
}

export async function runCompetitorResearch(id: string) {
  const result = await readApiJson<{ competitor: Competitor }>(
    await fetch(`/api/competitors/${id}/research`, { method: "POST" }),
  );
  return result.competitor;
}

export async function fetchSourceConnections(locationId: string) {
  const result = await readApiJson<{ connections: SourceConnection[] }>(
    await fetch(`/api/connections?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" }),
  );
  return result.connections;
}
import { readApiJson } from "@/lib/http/client";
