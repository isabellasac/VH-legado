import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../providers/AuthContext";

type ProtectedRouteProps = {
  role: "MANAGEMENT" | "PATIENT" | "PARTNER";
  children: ReactNode;
};

export function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { session, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirectTarget =
      role === "PATIENT" ? "/paciente/login" : role === "PARTNER" ? "/parceiro/login" : "/gestao/login";
    return <Navigate to={redirectTarget} replace state={{ from: location.pathname }} />;
  }

  if (session?.role !== role) {
    if (session?.role === "PATIENT") {
      return <Navigate to="/paciente/home" replace />;
    }

    if (session?.role === "PARTNER") {
      return <Navigate to="/parceiro/home" replace />;
    }

    return <Navigate to="/gestao/dashboard" replace />;
  }

  return <>{children}</>;
}
