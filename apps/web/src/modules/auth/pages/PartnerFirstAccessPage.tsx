import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { activatePartnerAccess, readableError } from "../services/authApi";

export function PartnerFirstAccessPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
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
      const response = await activatePartnerAccess({
        name,
        email,
        specialty,
        institutionCode,
        password,
        confirmPassword,
      });
      setSuccess(response.message);
      window.setTimeout(() => navigate("/parceiro/login"), 1200);
    } catch (error) {
      setError(readableError(error, "Não foi possível concluir o primeiro acesso."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área de parceiros"
      title="Ativar acesso de parceiro"
      description="Finalize seu primeiro acesso com poucos dados para começar pela VH."
      highlights={["Cadastro simples", "Senha pessoal", "Acesso protegido"]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>Primeiro acesso</h2>
          <p>Preencha os dados básicos para liberar sua conta de parceiro.</p>
        </div>

        <label className="field">
          <span>Nome completo</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="field">
          <span>E-mail</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label className="field">
          <span>Especialidade</span>
          <input value={specialty} onChange={(event) => setSpecialty(event.target.value)} />
        </label>

        <label className="field">
          <span>Código da instituição</span>
          <input
            type="text"
            placeholder="Digite o código recebido"
            value={institutionCode}
            onChange={(event) => setInstitutionCode(event.target.value)}
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
          <Link to="/parceiro/login">Voltar para o login</Link>
        </div>
      </form>
    </AuthShell>
  );
}
