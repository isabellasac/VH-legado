import { API_BASE_URL, ENABLE_API_FALLBACK } from "../../../shared/config/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CampaignPublicData = {
  name: string;
  description: string;
  availableProfiles: string[];
};

export type CheckUserResult = {
  exists: boolean;
  name: string | null;
  registrationId: string | null;
};

export type RegistrationPayload = {
  profileType: string;
  name: string;
  email: string;
  phone?: string;
  profileFields: Record<string, string>;
};

export type RegistrationResult = {
  registrationId: string;
  message: string;
  alreadyRegistered: boolean;
};

export type CampaignQuestion = {
  id: string;
  text: string;
  type: "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SCALE";
  options: string[];
  required: boolean;
  order: number;
  conditionalOnQuestionId: string | null;
  conditionalOnAnswer: string | null;
};

export type AnswerItem = {
  questionId: string;
  value: string;
};

export type AnswerSubmissionPayload = {
  registrationId: string;
  profileType: string;
  answers: AnswerItem[];
  wantsNewsletter: boolean;
};

// ---------------------------------------------------------------------------
// Generic helpers (same pattern as authApi.ts)
// ---------------------------------------------------------------------------

async function getJson<TResult>(path: string, fallback: () => TResult): Promise<TResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Não foi possível carregar os dados.");
    }

    return (await response.json()) as TResult;
  } catch (error) {
    if (!ENABLE_API_FALLBACK) {
      throw error;
    }
  }

  return fallback();
}

async function postJson<TPayload, TResult>(
  path: string,
  payload: TPayload,
  fallback: () => TResult,
): Promise<TResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Não foi possível concluir a solicitação.");
    }

    return (await response.json()) as TResult;
  } catch (error) {
    if (!ENABLE_API_FALLBACK) {
      throw error;
    }
  }

  return fallback();
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function mockCampaignPublic(): CampaignPublicData {
  return {
    name: "VH Health Hub — Pesquisa de Saúde Integrada",
    description:
      "Participe da nossa pesquisa para mapear o cenário de saúde e bem-estar. Sua contribuição é essencial para construirmos soluções mais eficazes e personalizadas.",
    availableProfiles: ["INSTITUTION", "USER", "PARTNER"],
  };
}

function mockCheckUser(email: string): CheckUserResult {
  if (email.toLowerCase() === "maria@vh.com") {
    return { exists: true, name: "Maria Silva", registrationId: "mock-reg-maria-001" };
  }
  return { exists: false, name: null, registrationId: null };
}

function mockRegisterUser(): RegistrationResult {
  return {
    registrationId: `mock-reg-${Date.now()}`,
    message: "Cadastro realizado com sucesso!",
    alreadyRegistered: false,
  };
}

const INSTITUTION_QUESTIONS: CampaignQuestion[] = [
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
    text: "O que mais observa entre os colaboradores?",
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
      "Monitoramento pontual, sem propositivas",
      "Monitoramento com propositivas de melhoria",
    ],
    required: true,
    order: 3,
    conditionalOnQuestionId: null,
    conditionalOnAnswer: null,
  },
  {
    id: "inst-q4",
    text: "Poderia compartilhar os tratamentos indicados?",
    type: "TEXT",
    options: [],
    required: false,
    order: 4,
    conditionalOnQuestionId: "inst-q3",
    conditionalOnAnswer: "Monitoramento pontual, sem propositivas|Monitoramento com propositivas de melhoria",
  },
];

const USER_QUESTIONS: CampaignQuestion[] = [
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
    text: "Quais cuidados adotados para reverter os sintomas?",
    type: "SINGLE_CHOICE",
    options: [
      "Tratamento monitorado com médico",
      "Busca solucionar apenas em crises",
      "Realiza por conta própria",
      "Não busca tratamento",
    ],
    required: true,
    order: 2,
    conditionalOnQuestionId: null,
    conditionalOnAnswer: null,
  },
  {
    id: "user-q3",
    text: "Dos tratamentos disponíveis, quais busca?",
    type: "MULTIPLE_CHOICE",
    options: [
      "Terapias medicamentosas apenas",
      "Terapias holísticas + medicação",
      "Terapias holísticas",
    ],
    required: true,
    order: 3,
    conditionalOnQuestionId: null,
    conditionalOnAnswer: null,
  },
  {
    id: "user-q4",
    text: "Poderia compartilhar os tratamentos adotados?",
    type: "TEXT",
    options: [],
    required: false,
    order: 4,
    conditionalOnQuestionId: "user-q3",
    conditionalOnAnswer: "Terapias holísticas + medicação|Terapias holísticas",
  },
];

const PARTNER_QUESTIONS: CampaignQuestion[] = [
  {
    id: "partner-q1",
    text: "Qual a especialidade em que atua?",
    type: "TEXT",
    options: [],
    required: true,
    order: 1,
    conditionalOnQuestionId: null,
    conditionalOnAnswer: null,
  },
  {
    id: "partner-q2",
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
    id: "partner-q3",
    text: "Número aproximado de pacientes/clientes?",
    type: "SINGLE_CHOICE",
    options: ["0–10", "10–30", "30–60", "60–100"],
    required: true,
    order: 3,
    conditionalOnQuestionId: null,
    conditionalOnAnswer: null,
  },
  {
    id: "partner-q4",
    text: "Faz parte de algum sistema integrado?",
    type: "TEXT",
    options: [],
    required: false,
    order: 4,
    conditionalOnQuestionId: null,
    conditionalOnAnswer: null,
  },
  {
    id: "partner-q5",
    text: "Como plataformas de monitoramento poderiam potencializar seus atendimentos?",
    type: "TEXT",
    options: [],
    required: false,
    order: 5,
    conditionalOnQuestionId: null,
    conditionalOnAnswer: null,
  },
];

function mockQuestions(profileType: string): CampaignQuestion[] {
  switch (profileType) {
    case "INSTITUTION":
      return INSTITUTION_QUESTIONS;
    case "USER":
      return USER_QUESTIONS;
    case "PARTNER":
      return PARTNER_QUESTIONS;
    default:
      return USER_QUESTIONS;
  }
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

export function fetchCampaignPublic(slug: string): Promise<CampaignPublicData> {
  return getJson(`/campaigns/${slug}/public`, () => mockCampaignPublic());
}

export function checkUserExists(slug: string, email: string): Promise<CheckUserResult> {
  return postJson(`/campaigns/${slug}/check-user`, { email }, () => mockCheckUser(email));
}

export function registerUser(slug: string, payload: RegistrationPayload): Promise<RegistrationResult> {
  return postJson(`/campaigns/${slug}/register`, payload, () => mockRegisterUser());
}

export function fetchCampaignQuestions(slug: string, profileType: string): Promise<CampaignQuestion[]> {
  return getJson(`/campaigns/${slug}/questions?profileType=${profileType}`, () => mockQuestions(profileType));
}

export function submitCampaignAnswers(
  slug: string,
  payload: AnswerSubmissionPayload,
): Promise<{ message: string }> {
  return postJson(`/campaigns/${slug}/answers`, payload, () => ({
    message: "Respostas registradas com sucesso!",
  }));
}
