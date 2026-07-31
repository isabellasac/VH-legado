import { ENABLE_API_FALLBACK, apiFetch } from "../../../shared/config/api";
import { mockDashboard } from "../../../shared/mocks/careopsMockData";

export type DashboardResponse = {
  clinicName: string;
  operatorName: string;
  kpis: {
    label: string;
    value: string;
    support: string;
  }[];
  history: {
    label: string;
    value: number;
  }[];
  alerts: {
    tone: "danger" | "warning" | "info";
    message: string;
  }[];
  statuses: {
    label: string;
    total: number;
    support: string;
    tone: "success" | "warning" | "danger";
  }[];
  roiComposition: {
    label: string;
    value: string;
    percent: number;
  }[];
};

export async function fetchDashboard(): Promise<DashboardResponse> {
  try {
    const response = await apiFetch("/management/dashboard");
    if (!response.ok) {
      throw new Error("Não foi possível carregar o dashboard.");
    }
    return (await response.json()) as DashboardResponse;
  } catch (error) {
    if (!ENABLE_API_FALLBACK) {
      throw error;
    }
  }

  return mockDashboard;
}
