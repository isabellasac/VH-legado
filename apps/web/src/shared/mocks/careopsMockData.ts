import type { ActionResponse, LoginPayload, SessionData } from "../../modules/auth/services/authApi";
import type { DashboardResponse } from "../../modules/management/services/managementApi";
import type { PatientItem } from "../../modules/patients/services/patientsApi";

export const mockDashboard: DashboardResponse = {
  clinicName: "Clínica Vida & Saúde",
  operatorName: "Dr. Ricardo Andrade",
  kpis: [
    { label: "Total de vidas", value: "128", support: "Pacientes monitorados na clínica" },
    { label: "Taxa de adesão", value: "76%", support: "Quem respondeu na semana" },
    { label: "Economia total", value: "R$ 186.400,00", support: "Acumulado das intervenções de ROI" },
  ],
  history: [
    { label: "Nov/23", value: 54 },
    { label: "Dez/23", value: 56 },
    { label: "Jan/24", value: 58 },
    { label: "Fev/24", value: 60 },
    { label: "Mar/24", value: 63 },
    { label: "Abr/24", value: 65 },
    { label: "Mai/24", value: 67 },
    { label: "Jun/24", value: 70 },
    { label: "Jul/24", value: 73 },
    { label: "Ago/24", value: 75 },
    { label: "Set/24", value: 77 },
    { label: "Out/24", value: 78 },
  ],
  alerts: [
    { tone: "danger", message: "5 pacientes com alto risco farmacêutico" },
    { tone: "warning", message: "Orçamento de bônus atingiu 70%" },
    { tone: "info", message: "3 pacientes sem resposta há 7 dias" },
    { tone: "danger", message: "2 metas críticas vencem hoje" },
  ],
  statuses: [
    { label: "Ativo", total: 78, support: "61% do total", tone: "success" },
    { label: "Monitorado", total: 32, support: "25% do total", tone: "warning" },
    { label: "Em Alerta", total: 18, support: "14% do total", tone: "danger" },
  ],
  roiComposition: [
    { label: "Ajuste de medicação", value: "R$ 68.900,00", percent: 37 },
    { label: "Risco de queda", value: "R$ 45.300,00", percent: 24 },
    { label: "NR-1", value: "R$ 38.700,00", percent: 21 },
    { label: "Outros", value: "R$ 33.500,00", percent: 18 },
  ],
};

export const mockPatients: PatientItem[] = [
  {
    id: "maria-silva",
    name: "Maria Silva",
    cpfMasked: "123.***.***-00",
    score: "78",
    status: "Ativo",
    lastResponseAt: "Hoje, 08:30",
    professional: "Dra. Ana Costa",
    signal: "Estável",
  },
  {
    id: "joao-oliveira",
    name: "João Oliveira",
    cpfMasked: "341.***.***-91",
    score: "61",
    status: "Monitorado",
    lastResponseAt: "Ontem, 17:10",
    professional: "Dr. Carlos Mendes",
    signal: "Atenção",
  },
  {
    id: "ana-santos",
    name: "Ana Santos",
    cpfMasked: "918.***.***-14",
    score: "84",
    status: "Ativo",
    lastResponseAt: "Hoje, 10:05",
    professional: "Dra. Lúcia Ferreira",
    signal: "Estável",
  },
  {
    id: "pedro-souza",
    name: "Pedro Souza",
    cpfMasked: "557.***.***-30",
    score: "49",
    status: "Em Alerta",
    lastResponseAt: "Sem retorno há 7 dias",
    professional: "Dr. Pedro Santos",
    signal: "Crítico",
  },
];

export function mockManagementLogin(payload: LoginPayload): SessionData {
  if (payload.identifier.toLowerCase() === "gestao@clinicavida.com" && payload.password === "12345678") {
    return {
      token: "mock-token-management",
      role: "MANAGEMENT",
      name: "Dr. Ricardo Andrade",
      destination: "/gestao/dashboard",
    };
  }

  throw new Error("Credenciais inválidas");
}

export function mockPatientLogin(payload: LoginPayload): SessionData {
  if (payload.identifier === "123.456.789-00" && payload.password === "12345678") {
    return {
      token: "mock-token-patient",
      role: "PATIENT",
      name: "Maria Silva",
      destination: "/paciente/home",
    };
  }

  throw new Error("Credenciais inválidas");
}

export function mockPartnerLogin(payload: LoginPayload): SessionData {
  if (payload.identifier.toLowerCase() === "parceiro@vh.com" && payload.password === "12345678") {
    return {
      token: "mock-token-partner",
      role: "PARTNER",
      name: "Dra. Marina Costa",
      destination: "/parceiro/home",
    };
  }

  throw new Error("Credenciais inválidas");
}

export function mockAction(message: string): ActionResponse {
  return { message };
}
