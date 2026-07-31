import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../providers/AuthContext";

type PublicRouteProps = {
  redirectTo: string;
  role: "MANAGEMENT" | "PATIENT" | "PARTNER";
  children: ReactNode;
};

export function PublicRoute({ redirectTo, role, children }: PublicRouteProps) {
  const { isAuthenticated, session } = useAuth();

  if (isAuthenticated && session?.role === role) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
