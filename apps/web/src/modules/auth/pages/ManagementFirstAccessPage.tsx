import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { activateManagementAccess } from "../services/authApi";

export function ManagementFirstAccessPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await activateManagementAccess({
        email,
        invitationCode,
        password,
        confirmPassword,
      });
      setSuccess(response.message);
      window.setTimeout(() => navigate("/gestao/login"), 1200);
    } catch {
      setError("Não foi possível concluir o primeiro acesso.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área da clínica"
      title="Ativar acesso da equipe"
      description="Finalize seu primeiro acesso com o convite enviado pela clínica e crie a senha de uso diário."
      highlights={["Convite individual", "Senha pessoal", "Acesso direto ao painel"]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>Primeiro acesso</h2>
          <p>Use o e-mail convidado e o código enviado pela clínica.</p>
        </div>

        <label className="field">
          <span>E-mail</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label className="field">
          <span>Código de ativação</span>
          <input
            type="text"
            placeholder="Digite o código enviado"
            value={invitationCode}
            onChange={(event) => setInvitationCode(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Nova senha</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        <label className="field">
          <span>Confirmar senha</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        {error ? <div className="form-message form-message-error">{error}</div> : null}
        {success ? <div className="form-message form-message-success">{success}</div> : null}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Finalizando..." : "Concluir acesso"}
        </button>

        <div className="auth-footer-links auth-footer-links-start">
          <Link to="/gestao/login">Voltar para o login</Link>
        </div>
      </form>
    </AuthShell>
  );
}
