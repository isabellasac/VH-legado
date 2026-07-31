import { API_BASE_URL, ENABLE_API_FALLBACK } from "../../../shared/config/api";
import {
  mockAction,
  mockManagementLogin,
  mockPartnerLogin,
  mockPatientLogin,
} from "../../../shared/mocks/careopsMockData";

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type SessionData = {
  token: string;
  role: "MANAGEMENT" | "PATIENT" | "PARTNER";
  name: string;
  destination: string;
  institutionId?: string;
  subjectId?: string;
  expiresAt?: string;
  permissions?: string[];
  demoMode?: boolean;
};

export type ActionResponse = {
  message: string;
};

export type ManagementPasswordResetPayload = {
  email: string;
};

export type PatientPasswordResetPayload = {
  cpf: string;
  email: string;
};

export type ManagementFirstAccessPayload = {
  email: string;
  invitationCode: string;
  password: string;
  confirmPassword: string;
};

export type PatientFirstAccessPayload = {
  cpf: string;
  institutionCode: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
};

export type PartnerPasswordResetPayload = {
  email: string;
};

export type PartnerFirstAccessPayload = {
  name: string;
  email: string;
  specialty: string;
  institutionCode: string;
  password: string;
  confirmPassword: string;
};

async function postLogin(path: string, payload: LoginPayload): Promise<SessionData> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Não foi possível validar o acesso.");
    }

    return (await response.json()) as SessionData;
  } catch (error) {
    if (!ENABLE_API_FALLBACK) {
      throw error;
    }
  }

  if (path.includes("/management/")) {
    return mockManagementLogin(payload);
  }

  if (path.includes("/partner/")) {
    return mockPartnerLogin(payload);
  }

  return mockPatientLogin(payload);
}

export function loginManagement(payload: LoginPayload) {
  return postLogin("/auth/management/login", payload);
}

export function loginPatient(payload: LoginPayload) {
  return postLogin("/auth/patient/login", payload);
}

export function loginPartner(payload: LoginPayload) {
  return postLogin("/auth/partner/login", payload);
}

async function postAction<TPayload>(path: string, payload: TPayload): Promise<ActionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Não foi possível concluir a solicitação.");
    }

    return (await response.json()) as ActionResponse;
  } catch (error) {
    if (!ENABLE_API_FALLBACK) {
      throw error;
    }
  }

  if (path.includes("/password-reset")) {
    return mockAction("Solicitação registrada. Confira o e-mail informado para continuar.");
  }

  return mockAction("Acesso confirmado. Você já pode entrar na sua área.");
}

export function requestManagementPasswordReset(payload: ManagementPasswordResetPayload) {
  return postAction("/auth/management/password-reset", payload);
}

export function requestPatientPasswordReset(payload: PatientPasswordResetPayload) {
  return postAction("/auth/patient/password-reset", payload);
}

export function requestPartnerPasswordReset(payload: PartnerPasswordResetPayload) {
  return postAction("/auth/partner/password-reset", payload);
}

export function activateManagementAccess(payload: ManagementFirstAccessPayload) {
  return postAction("/auth/management/first-access", payload);
}

export function activatePatientAccess(payload: PatientFirstAccessPayload) {
  return postAction("/auth/patient/first-access", payload);
}

export function activatePartnerAccess(payload: PartnerFirstAccessPayload) {
  return postAction("/auth/partner/first-access", payload);
}
