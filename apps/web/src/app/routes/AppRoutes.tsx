import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { AccessGatewayPage } from "../../modules/auth/pages/AccessGatewayPage";
import { ManagementFirstAccessPage } from "../../modules/auth/pages/ManagementFirstAccessPage";
import { ManagementForgotPasswordPage } from "../../modules/auth/pages/ManagementForgotPasswordPage";
import { ManagementLoginPage } from "../../modules/auth/pages/ManagementLoginPage";
import { PatientAssessmentPage } from "../../modules/auth/pages/PatientAssessmentPage";
import { PatientFirstAccessPage } from "../../modules/auth/pages/PatientFirstAccessPage";
import { PatientForgotPasswordPage } from "../../modules/auth/pages/PatientForgotPasswordPage";
import { PatientHomePage } from "../../modules/auth/pages/PatientHomePage";
import { PatientLoginPage } from "../../modules/auth/pages/PatientLoginPage";
import { PartnerFirstAccessPage } from "../../modules/auth/pages/PartnerFirstAccessPage";
import { PartnerForgotPasswordPage } from "../../modules/auth/pages/PartnerForgotPasswordPage";
import { PartnerHomePage } from "../../modules/auth/pages/PartnerHomePage";
import { PartnerLoginPage } from "../../modules/auth/pages/PartnerLoginPage";
import { CampaignsPage } from "../../modules/campaigns/pages/CampaignsPage";
import { CampaignFormPage } from "../../modules/campaigns/pages/CampaignFormPage";
import { CampaignDetailPage } from "../../modules/campaigns/pages/CampaignDetailPage";
import { CampaignLandingPage } from "../../modules/campaigns/pages/public/CampaignLandingPage";
import { CampaignRegistrationPage } from "../../modules/campaigns/pages/public/CampaignRegistrationPage";
import { CampaignQuestionsPage } from "../../modules/campaigns/pages/public/CampaignQuestionsPage";
import { CampaignCompletionPage } from "../../modules/campaigns/pages/public/CampaignCompletionPage";
import { ManagementLayout } from "../../modules/management/layout/ManagementLayout";
import { ManagementDashboardPage } from "../../modules/management/pages/ManagementDashboardPage";
import { PatientsPage } from "../../modules/patients/pages/PatientsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AccessGatewayPage />} />

      <Route
        path="/gestao/login"
        element={
          <PublicRoute redirectTo="/gestao/dashboard" role="MANAGEMENT">
            <ManagementLoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/paciente/login"
        element={
          <PublicRoute redirectTo="/paciente/home" role="PATIENT">
            <PatientLoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/parceiro/login"
        element={
          <PublicRoute redirectTo="/parceiro/home" role="PARTNER">
            <PartnerLoginPage />
          </PublicRoute>
        }
      />

      <Route path="/gestao/esqueci-senha" element={<ManagementForgotPasswordPage />} />
      <Route path="/paciente/esqueci-senha" element={<PatientForgotPasswordPage />} />
      <Route path="/parceiro/esqueci-senha" element={<PartnerForgotPasswordPage />} />
      <Route path="/gestao/primeiro-acesso" element={<ManagementFirstAccessPage />} />
      <Route path="/paciente/primeiro-acesso" element={<PatientFirstAccessPage />} />
      <Route path="/parceiro/primeiro-acesso" element={<PartnerFirstAccessPage />} />

      <Route
        path="/gestao"
        element={
          <ProtectedRoute role="MANAGEMENT">
            <ManagementLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ManagementDashboardPage />} />
        <Route path="pacientes" element={<PatientsPage />} />
        <Route path="campanhas" element={<CampaignsPage />} />
        <Route path="campanhas/nova" element={<CampaignFormPage />} />
        <Route path="campanhas/:id" element={<CampaignDetailPage />} />
        <Route path="campanhas/:id/editar" element={<CampaignFormPage />} />
      </Route>

      <Route
        path="/paciente/home"
        element={
          <ProtectedRoute role="PATIENT">
            <PatientHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paciente/avaliacao"
        element={
          <ProtectedRoute role="PATIENT">
            <PatientAssessmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/parceiro/home"
        element={
          <ProtectedRoute role="PARTNER">
            <PartnerHomePage />
          </ProtectedRoute>
        }
      />

      <Route path="/campanha/:slug" element={<CampaignLandingPage />} />
      <Route path="/campanha/:slug/cadastro/:profileType" element={<CampaignRegistrationPage />} />
      <Route path="/campanha/:slug/perguntas/:profileType" element={<CampaignQuestionsPage />} />
      <Route path="/campanha/:slug/concluido" element={<CampaignCompletionPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
