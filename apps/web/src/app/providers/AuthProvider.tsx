import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AuthContext, type AuthContextValue } from "./AuthContext";
import {
  loginManagement,
  loginPartner,
  loginPatient,
  type LoginPayload,
  type SessionData,
} from "../../modules/auth/services/authApi";

const STORAGE_KEY = "careops-vh.session";

function readStoredSession() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SessionData;
    if (parsed?.role && parsed?.token) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(() => readStoredSession());

  const persist = useCallback((nextSession: SessionData) => {
    setSession(nextSession);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  }, []);

  const handleManagementLogin = useCallback(async (payload: LoginPayload) => {
    const nextSession = await loginManagement(payload);
    persist(nextSession);
    return nextSession;
  }, [persist]);

  const handlePatientLogin = useCallback(async (payload: LoginPayload) => {
    const nextSession = await loginPatient(payload);
    persist(nextSession);
    return nextSession;
  }, [persist]);

  const handlePartnerLogin = useCallback(async (payload: LoginPayload) => {
    const nextSession = await loginPartner(payload);
    persist(nextSession);
    return nextSession;
  }, [persist]);

  const logout = useCallback(() => {
    setSession(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      loginManagement: handleManagementLogin,
      loginPatient: handlePatientLogin,
      loginPartner: handlePartnerLogin,
      logout,
    }),
    [handleManagementLogin, handlePartnerLogin, handlePatientLogin, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
