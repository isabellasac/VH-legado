import { useState } from "react";
import { Link } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { requestPartnerPasswordReset } from "../services/authApi";

export function PartnerForgotPasswordPage() {
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
      const response = await requestPartnerPasswordReset({ email });
      setSuccess(response.message);
    } catch {
      setError("Não foi possível enviar a redefinição de senha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área de parceiros"
      title="Recuperar acesso"
      description="Enviaremos um novo link para que o parceiro recupere a entrada na VH."
      highlights={["Cadastro simples", "Acesso individual", "Vínculo da rede"]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>Esqueci minha senha</h2>
          <p>Informe o e-mail usado no cadastro do parceiro.</p>
        </div>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            placeholder="parceiro@vh.com"
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
          <Link to="/parceiro/login">Voltar para o login</Link>
        </div>
      </form>
    </AuthShell>
  );
}
