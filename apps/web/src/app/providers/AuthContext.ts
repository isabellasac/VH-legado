import { createContext, useContext } from "react";

import type { LoginPayload, SessionData } from "../../modules/auth/services/authApi";

export type AuthRole = "MANAGEMENT" | "PATIENT" | "PARTNER";

export type AuthContextValue = {
  session: SessionData | null;
  isAuthenticated: boolean;
  loginManagement: (payload: LoginPayload) => Promise<SessionData>;
  loginPatient: (payload: LoginPayload) => Promise<SessionData>;
  loginPartner: (payload: LoginPayload) => Promise<SessionData>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
