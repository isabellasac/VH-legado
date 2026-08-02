import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../app/providers/AuthContext";
import { AuthShell } from "../components/AuthShell";
import { readableError } from "../services/authApi";

export function PartnerLoginPage() {
  const navigate = useNavigate();
  const { loginPartner } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await loginPartner({ identifier, password });
      navigate(session.destination);
    } catch (error) {
      setError(readableError(error, "Não foi possível validar o acesso do parceiro."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área de parceiros"
      title="Profissionais e terapeutas"
      description="Acesso simples para parceiros da rede VH acompanharem seu vínculo e darem continuidade ao cadastro."
      highlights={["Cadastro simples", "Primeiro acesso", "Vínculo com a rede VH"]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>Entrar como parceiro</h2>
          <p>Use seu e-mail cadastrado para retomar o acesso da rede.</p>
        </div>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            placeholder="parceiro@vh.com"
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
          <Link to="/parceiro/esqueci-senha">Esqueci minha senha</Link>
          <Link to="/parceiro/primeiro-acesso">Primeiro acesso</Link>
        </div>
      </form>
    </AuthShell>
  );
}
