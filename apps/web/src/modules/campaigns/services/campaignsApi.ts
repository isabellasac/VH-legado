import { API_BASE_URL, ENABLE_API_FALLBACK } from "../../../shared/config/api";

/* ───────── types ───────── */

export type ProfileQuestion = {
  id: string;
  text: string;
  type: "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SCALE";
  options: string[];
  required: boolean;
  order: number;
  conditionalOnQuestionId: string | null;
  conditionalOnAnswer: string | null;
};

export type ProfileConfig = {
  profileType: string;
  questions: ProfileQuestion[];
};

export type CampaignPayload = {
  name: string;
  slug: string;
  description: string;
  confirmationMessage: string;
  active: boolean;
  profiles: ProfileConfig[];
};

export type CampaignItem = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  totalRegistrations: number;
  createdAt: string;
};

export type CampaignDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  confirmationMessage: string;
  active: boolean;
  profiles: ProfileConfig[];
  totalRegistrations: number;
  createdAt: string;
};

/* ───────── mock data ───────── */

const mockCampaigns: CampaignDetail[] = [
  {
    id: "camp-001",
    name: "Minas Summit 2026",
    slug: "minas-summit-2026",
    description:
      "Campanha oficial do Minas Summit 2026. Acesse via QR code no evento para se cadastrar e responder ao questionário de saúde.",
    confirmationMessage:
      "Cadastro realizado com sucesso! Obrigado por participar do Minas Summit 2026. Sua contribuição é muito importante para nós.",
    active: true,
    profiles: [
      {
        profileType: "INSTITUTION",
        questions: [
          {
            id: "inst-q1",
            text: "A sua empresa adota medidas de adequação à NR-1?",
            type: "SINGLE_CHOICE",
            options: ["Sim", "Não", "Em implementação"],
            required: true,
            order: 1,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "inst-q2",
            text: "O que mais observa entre os colaboradores com quem tem contato?",
            type: "MULTIPLE_CHOICE",
            options: [
              "Fadiga recorrente",
              "Dificuldade de concentração",
              "Baixa performance não habitual",
              "Insegurança na comunicação",
              "Afastamentos recorrentes",
              "Outros",
            ],
            required: true,
            order: 2,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "inst-q3",
            text: "Como a saúde do colaborador é monitorada?",
            type: "SINGLE_CHOICE",
            options: [
              "Não há monitoramento",
              "Monitoramento pontual, sem propositivas de melhoria",
              "Monitoramento com propositivas de melhoria do status de saúde",
            ],
            required: true,
            order: 3,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "inst-q4",
            text: "Poderia compartilhar os tratamentos e práticas normalmente indicados para melhora da saúde do colaborador?",
            type: "TEXT",
            options: [],
            required: false,
            order: 4,
            conditionalOnQuestionId: "inst-q3",
            conditionalOnAnswer: "Monitoramento pontual, sem propositivas de melhoria|Monitoramento com propositivas de melhoria do status de saúde",
          },
        ],
      },
      {
        profileType: "USER",
        questions: [
          {
            id: "user-q1",
            text: "Possui algum problema de saúde que gostaria de compartilhar?",
            type: "TEXT",
            options: [],
            required: false,
            order: 1,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "user-q2",
            text: "Quais são os cuidados que tem adotado para reverter os sintomas e buscar a cura?",
            type: "SINGLE_CHOICE",
            options: [
              "Tratamento monitorado com médico/profissional",
              "Busca solucionar apenas quando há crises",
              "Já conhece a forma de tratamento e o realiza por conta própria",
              "Não busca tratamento",
            ],
            required: true,
            order: 2,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "user-q3",
            text: "Dos tratamentos disponíveis, quais busca para solucionar o problema de saúde?",
            type: "MULTIPLE_CHOICE",
            options: [
              "Terapias medicamentosas, apenas",
              "Terapias holísticas associadas à medicação",
              "Terapias holísticas",
            ],
            required: true,
            order: 3,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "user-q4",
            text: "Poderia compartilhar os tratamentos e práticas normalmente adotados para otimizar o tratamento que busca?",
            type: "TEXT",
            options: [],
            required: false,
            order: 4,
            conditionalOnQuestionId: "user-q3",
            conditionalOnAnswer: "Terapias holísticas associadas à medicação|Terapias holísticas",
          },
        ],
      },
      {
        profileType: "PARTNER",
        questions: [
          {
            id: "part-q1",
            text: "Qual a especialidade em que atua?",
            type: "TEXT",
            options: [],
            required: true,
            order: 1,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "part-q2",
            text: "Você é:",
            type: "SINGLE_CHOICE",
            options: [
              "Profissional independente",
              "Possui sua própria clínica",
              "Trabalha em clínicas como PJ ou CLT",
            ],
            required: true,
            order: 2,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "part-q3",
            text: "Qual o número aproximado de pacientes/clientes que atende?",
            type: "SINGLE_CHOICE",
            options: ["0–10", "10–30", "30–60", "60–100"],
            required: true,
            order: 3,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "part-q4",
            text: "Você faz parte de algum sistema integrado de atendimento?",
            type: "TEXT",
            options: [],
            required: false,
            order: 4,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
          {
            id: "part-q5",
            text: "Como acredita que plataformas de monitoramento de pacientes/colaboradores poderiam engajar os usuários e potencializar seus atendimentos?",
            type: "TEXT",
            options: [],
            required: false,
            order: 5,
            conditionalOnQuestionId: null,
            conditionalOnAnswer: null,
          },
        ],
      },
    ],
    totalRegistrations: 12,
    createdAt: "2026-06-09T10:00:00",
  },
];

/* ───────── helpers ───────── */

async function apiGet<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as T;
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
  }
  throw new Error("Fallback needed");
}

async function apiPost<TPayload, TResponse>(path: string, payload: TPayload): Promise<TResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as TResponse;
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
  }
  throw new Error("Fallback needed");
}

async function apiPut<TPayload, TResponse>(path: string, payload: TPayload): Promise<TResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    return (await response.json()) as TResponse;
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
  }
  throw new Error("Fallback needed");
}

async function apiDelete(path: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await response.text());
    return;
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
  }
}

/* ───────── public API ───────── */

export async function listCampaigns(): Promise<CampaignItem[]> {
  try {
    return await apiGet<CampaignItem[]>("/campaigns");
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
    return mockCampaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug,
      active: campaign.active,
      totalRegistrations: campaign.totalRegistrations,
      createdAt: campaign.createdAt,
    }));
  }
}

export async function getCampaign(id: string): Promise<CampaignDetail> {
  try {
    return await apiGet<CampaignDetail>(`/campaigns/${id}`);
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
    const campaign = mockCampaigns.find((item) => item.id === id);
    if (!campaign) throw new Error("Campanha não encontrada", { cause: error });
    return campaign;
  }
}

export async function createCampaign(payload: CampaignPayload): Promise<CampaignDetail> {
  try {
    return await apiPost<CampaignPayload, CampaignDetail>("/campaigns", payload);
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
    const created: CampaignDetail = {
      id: `camp-${Date.now()}`,
      ...payload,
      totalRegistrations: 0,
      createdAt: new Date().toISOString(),
    };
    mockCampaigns.push(created);
    return created;
  }
}

export async function updateCampaign(id: string, payload: CampaignPayload): Promise<CampaignDetail> {
  try {
    return await apiPut<CampaignPayload, CampaignDetail>(`/campaigns/${id}`, payload);
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
    const index = mockCampaigns.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Campanha não encontrada", { cause: error });
    const updated = { ...mockCampaigns[index], ...payload };
    mockCampaigns[index] = updated;
    return updated;
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  try {
    return await apiDelete(`/campaigns/${id}`);
  } catch (error) {
    if (!ENABLE_API_FALLBACK) throw error;
    const index = mockCampaigns.findIndex((item) => item.id === id);
    if (index >= 0) mockCampaigns.splice(index, 1);
  }
}
