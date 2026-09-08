export type DashboardTheme = { name: string; count: number };

export type DashboardData = {
  metrics: {
    reviewCount: number;
    averageRating: number | null;
    analyzedCount: number;
    positivePercent: number | null;
    negativeCount: number;
    sourceCount: number;
    openActionCount: number;
  };
  topIssue: DashboardTheme | null;
  evidence: Array<{
    id: string;
    review_text: string;
    rating: number | null;
    review_date: string | null;
    source: string | null;
  }>;
  positiveThemes: DashboardTheme[];
  negativeThemes: DashboardTheme[];
  locations: Array<{
    id: string;
    name: string;
    score: number | null;
    reviews: number;
    issue: string | null;
  }>;
};

export async function fetchDashboard(locationId: string): Promise<DashboardData> {
  const response = await fetch(`/api/dashboard?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
  return readApiJson<DashboardData>(response);
}
import { readApiJson } from "@/lib/http/client";
