import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../app/providers/AuthContext";
import { AuthShell } from "../components/AuthShell";
import { readableError } from "../services/authApi";

export function ManagementLoginPage() {
  const navigate = useNavigate();
  const { loginManagement } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await loginManagement({ identifier, password });
      navigate(session.destination);
    } catch (error) {
      setError(readableError(error, "Não foi possível validar o acesso da clínica."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área da clínica"
      title="Painel CareOps VH"
      description="Acesso da equipe responsável pelo acompanhamento clínico, pela governança e pela operação do cuidado."
      highlights={["Dashboard da clínica", "Prontuário integrado", "Monitoramento por paciente"]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>Entrar na área da clínica</h2>
          <p>Use seu e-mail corporativo para acessar o painel da instituição.</p>
        </div>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            placeholder="voce@clinica.com.br"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error ? <div className="form-message form-message-error">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Validando acesso..." : "Entrar"}
        </button>

        <div className="auth-footer-links">
          <Link to="/gestao/esqueci-senha">Esqueci minha senha</Link>
          <Link to="/gestao/primeiro-acesso">Primeiro acesso</Link>
        </div>
      </form>
    </AuthShell>
  );
}
