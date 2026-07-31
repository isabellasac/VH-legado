import { useState } from "react";
import { Link } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { requestPatientPasswordReset } from "../services/authApi";

export function PatientForgotPasswordPage() {
  const [cpf, setCpf] = useState("");
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
      const response = await requestPatientPasswordReset({ cpf, email });
      setSuccess(response.message);
    } catch {
      setError("Não foi possível enviar um novo link de acesso.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área do paciente"
      title="Recuperar acesso"
      description="Vamos reenviar um novo link de acesso para que você retome sua rotina de acompanhamento."
      highlights={["CPF cadastrado", "Validação por e-mail", "Acesso individual e protegido"]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>Esqueci minha senha</h2>
          <p>Informe os dados cadastrados pela clínica.</p>
        </div>

        <label className="field">
          <span>CPF</span>
          <input
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(event) => setCpf(event.target.value)}
          />
        </label>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            placeholder="seuemail@dominio.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        {error ? <div className="form-message form-message-error">{error}</div> : null}
        {success ? <div className="form-message form-message-success">{success}</div> : null}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar link"}
        </button>

        <div className="auth-footer-links auth-footer-links-start">
          <Link to="/paciente/login">Voltar para o login</Link>
        </div>
      </form>
    </AuthShell>
  );
}
