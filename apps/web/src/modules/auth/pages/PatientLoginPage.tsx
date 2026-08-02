import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../app/providers/AuthContext";
import { AuthShell } from "../components/AuthShell";
import { readableError } from "../services/authApi";

export function PatientLoginPage() {
  const navigate = useNavigate();
  const { loginPatient } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await loginPatient({ identifier, password });
      navigate(session.destination);
    } catch (error) {
      setError(readableError(error, "Não foi possível validar o acesso do paciente."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área do paciente"
      title="Sua rotina de cuidado"
      description="Acompanhe seu plano, responda às avaliações e registre o que foi feito no seu dia."
      highlights={["Score de saúde", "Metas do dia", "Avaliação periódica"]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>Entrar na área do paciente</h2>
          <p>Use o CPF cadastrado pela clínica para acessar sua rotina de acompanhamento.</p>
        </div>

        <label className="field">
          <span>CPF</span>
          <input
            type="text"
            placeholder="000.000.000-00"
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
          <Link to="/paciente/esqueci-senha">Esqueci minha senha</Link>
          <Link to="/paciente/primeiro-acesso">Primeiro acesso</Link>
        </div>
      </form>
    </AuthShell>
  );
}
