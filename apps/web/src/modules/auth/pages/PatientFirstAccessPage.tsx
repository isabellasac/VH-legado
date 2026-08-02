import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { activatePatientAccess, readableError } from "../services/authApi";

export function PatientFirstAccessPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
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
      const response = await activatePatientAccess({
        name,
        cpf,
        institutionCode,
        birthDate,
        email,
        password,
        confirmPassword,
      });
      setSuccess(response.message);
      window.setTimeout(() => navigate("/paciente/login"), 1200);
    } catch (error) {
      setError(readableError(error, "Não foi possível concluir o primeiro acesso."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área do paciente"
      title="Ativar acesso do paciente"
      description="Faça seu cadastro e crie a senha para acompanhar metas, avaliações e o score de saúde."
      highlights={["Cadastro protegido", "Código da clínica", "Senha para acesso diário"]}
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h2>Primeiro acesso</h2>
          <p>Informe seus dados para criar ou ativar seu acesso à área do paciente.</p>
        </div>

        <label className="field">
          <span>Nome completo</span>
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="field">
          <span>CPF</span>
          <input type="text" value={cpf} onChange={(event) => setCpf(event.target.value)} />
        </label>

        <label className="field">
          <span>Código da clínica</span>
          <input
            type="text"
            placeholder="Digite o código recebido"
            value={institutionCode}
            onChange={(event) => setInstitutionCode(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Data de nascimento</span>
          <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
        </label>

        <label className="field">
          <span>E-mail (opcional)</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
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
          <Link to="/paciente/login">Voltar para o login</Link>
        </div>
      </form>
    </AuthShell>
  );
}
