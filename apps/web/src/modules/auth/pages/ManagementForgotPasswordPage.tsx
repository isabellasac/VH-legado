import { useState } from "react";
import { Link } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { requestManagementPasswordReset } from "../services/authApi";

export function ManagementForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await requestManagementPasswordReset({ email });
      setSuccess(response.message);
    } catch {
      setError("Não foi possível enviar a redefinição de senha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área da clínica"
      title="Recuperar acesso"
      description="Enviaremos um novo link para que a equipe da clínica volte a acessar o painel com segurança."
      highlights={["Recuperação por e-mail", "Acesso individual", "Painel protegido por perfil"]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>Esqueci minha senha</h2>
          <p>Informe o e-mail usado no painel da clínica.</p>
        </div>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            placeholder="voce@clinica.com.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        {error ? <div className="form-message form-message-error">{error}</div> : null}
        {success ? <div className="form-message form-message-success">{success}</div> : null}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar link"}
        </button>

        <div className="auth-footer-links auth-footer-links-start">
          <Link to="/gestao/login">Voltar para o login</Link>
        </div>
      </form>
    </AuthShell>
  );
}
