const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// A aplicação publicada é servida pela própria API. Assim, o navegador sempre
// conversa com o mesmo domínio em /api e não depende de uma URL fixa ou CORS.
// VITE_API_BASE_URL continua disponível para cenários em que web e API sejam
// publicados separadamente.
export const API_BASE_URL = (rawApiBaseUrl || "/api").replace(/\/$/, "");

export const ENABLE_API_FALLBACK = false;

const SESSION_STORAGE_KEY = "careops-vh.session";

export function readAuthToken() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? "";
  } catch {
    return "";
  }
}

export function authHeaders(extraHeaders?: HeadersInit): HeadersInit {
  const token = readAuthToken();
  return {
    ...(extraHeaders ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: authHeaders(init?.headers),
  });
}

export function isDemoToken(token: string | undefined) {
  return Boolean(token?.startsWith("mock-token-"));
}
