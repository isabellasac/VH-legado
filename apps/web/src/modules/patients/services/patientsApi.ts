import { ENABLE_API_FALLBACK, apiFetch } from "../../../shared/config/api";
import { mockPatients } from "../../../shared/mocks/careopsMockData";

export type PatientItem = {
  id: string;
  name: string;
  cpfMasked: string;
  score: string;
  status: string;
  lastResponseAt: string;
  professional: string;
  signal: string;
};

export type PatientRecord = {
  patient: {
    id: string;
    name: string;
    cpfMasked: string;
    email: string;
    phone: string;
    birthDate: string;
    sex: string;
    professional: string;
    status: string;
    signal: string;
    score: number;
    riskPercent: number;
    riskLevel: string;
    lastResponseAt: string;
    invitationCode: string;
    active: boolean;
  };
  assessments: Array<{
    id: string;
    answers: Record<string, string>;
    score: number;
    riskPercent: number;
    riskLevel: string;
    rulesVersion: string;
    questionVersion: string;
    createdAt: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    frequency: string;
    status: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
  }>;
  roiEvents: Array<{
    id: string;
    title: string;
    value: number;
    category: string;
    justification: string;
    createdBy: string;
    createdAt: string;
  }>;
  alerts: Array<{
    id: string;
    tone: "danger" | "warning" | "info";
    message: string;
    source: string;
    status: string;
    priority: number;
    createdAt: string;
    resolvedAt: string | null;
  }>;
  intelligence: {
    eyebrow: string;
    title: string;
    summary: string;
    bullets: string[];
    score: number;
    riskPercent: number;
    riskLevel: string;
    riskTone: "danger" | "warning" | "info" | "success";
    signals: Array<{
      label: string;
      evidence: string;
      action: string;
      tone: "danger" | "warning" | "info" | "success";
      sourceIds: string[];
    }>;
    recommendedActions: string[];
    ragSources: Array<{
      id: string;
      title: string;
      scope: string;
      version: string;
      approvedBy: string;
      approvedAt: string;
      domain: string;
    }>;
    governanceNote: string;
    apiPolicy: string;
    rulesVersion: string;
    generatedAt: string;
  };
  lgpdConsentVersion: string;
  lgpdConsentAcceptedAt: string;
};

export type PatientPayload = {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  sex: string;
  professional?: string;
};

type AssessmentPayload = {
  patientId?: string;
  answers: Record<string, string>;
};

async function expectJson<T>(response: Response, fallback: () => T): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  if (!ENABLE_API_FALLBACK) {
    throw new Error(await response.text() || "Falha na API.");
  }

  return fallback();
}

export async function fetchPatients(): Promise<PatientItem[]> {
  try {
    const response = await apiFetch("/management/patients");
    return await expectJson(response, () => mockPatients);
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
    return mockPatients;
  }
}

export async function fetchPatientRecord(id: string): Promise<PatientRecord> {
  const response = await apiFetch(`/management/patients/${id}`);
  return expectJson(response, () => {
    throw new Error("Prontuario indisponivel no modo fallback.");
  });
}

export async function createPatient(payload: PatientPayload): Promise<PatientItem> {
  const response = await apiFetch("/management/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return expectJson(response, () => ({
    id: `mock-${Date.now()}`,
    name: payload.name,
    cpfMasked: payload.cpf,
    score: "0",
    status: "Pendente",
    lastResponseAt: "Sem resposta",
    professional: payload.professional ?? "Equipe clinica",
    signal: "Aguardando avaliacao",
  }));
}

export async function updatePatient(id: string, payload: Partial<PatientPayload> & { active?: boolean }): Promise<PatientItem> {
  const response = await apiFetch(`/management/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return expectJson(response, () => {
    const found = mockPatients.find((patient) => patient.id === id);
    if (!found) throw new Error("Paciente nao encontrado");
    return { ...found, ...payload, cpfMasked: payload.cpf ?? found.cpfMasked };
  });
}

export async function archivePatient(id: string): Promise<PatientItem> {
  const response = await apiFetch(`/management/patients/${id}/archive`, {
    method: "PATCH",
  });
  return expectJson(response, () => {
    const found = mockPatients.find((patient) => patient.id === id);
    if (!found) throw new Error("Paciente nao encontrado");
    return { ...found, status: "Inativo", signal: "Paciente arquivado pelo profissional" };
  });
}

export async function submitPatientAssessment(payload: AssessmentPayload): Promise<PatientRecord> {
  const response = await apiFetch("/patient/assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return expectJson(response, () => {
    throw new Error("Avaliacao indisponivel no modo fallback.");
  });
}

export async function fetchPatientHome(): Promise<PatientRecord> {
  const response = await apiFetch("/patient/home");
  return expectJson(response, () => {
    throw new Error("Home do paciente indisponivel no modo fallback.");
  });
}

export async function updateGoalStatus(patientId: string, goalId: string, status: string): Promise<PatientRecord> {
  const response = await apiFetch(`/management/patients/${patientId}/goals/${goalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return expectJson(response, () => {
    throw new Error("Atualizacao de meta indisponivel no modo fallback.");
  });
}
