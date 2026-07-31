import { type FormEvent, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { BrandLogo } from "../../../../shared/components/BrandLogo";
import {
  checkUserExists,
  registerUser,
  type RegistrationPayload,
} from "../../services/campaignPublicApi";

const PROFILE_LABELS: Record<string, string> = {
  INSTITUTION: "Instituição",
  USER: "Usuário",
  PARTNER: "Parceiro",
};

const PORTE_OPTIONS = ["0–10", "10–50", "50–200", "Acima de 200"];
const FATURAMENTO_OPTIONS = ["0–100k", "100–500k", "500k–2M", "Acima de 2M", "Não sei"];
const FAIXA_ETARIA_OPTIONS = ["15–25", "25–35", "35–45", "+45"];

export function CampaignRegistrationPage() {
  const { slug, profileType } = useParams<{ slug: string; profileType: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"email" | "register">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);

  // Email phase
  const [email, setEmail] = useState("");

  // Registration phase
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Profile-specific
  const [institution, setInstitution] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [porte, setPorte] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [faixaEtaria, setFaixaEtaria] = useState("");

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const profile = profileType ?? "USER";
  const profileLabel = PROFILE_LABELS[profile] ?? "Participante";

  async function handleEmailCheck(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setFieldErrors({ email: "Informe seu e-mail." });
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const result = await checkUserExists(slug!, email);

      if (result.exists && result.registrationId) {
        setWelcomeBack(result.name ?? "");
        window.setTimeout(() => {
          navigate(`/campanha/${slug}/perguntas/${profile}`, {
            state: { registrationId: result.registrationId },
          });
        }, 1800);
      } else {
        setPhase("register");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar e-mail.");
    } finally {
      setLoading(false);
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Nome completo é obrigatório.";
    if (!email.trim()) errors.email = "E-mail é obrigatório.";

    if (profile === "INSTITUTION") {
      if (!institution.trim()) errors.institution = "Nome da instituição é obrigatório.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    const profileFields: Record<string, string> = {};

    if (profile === "INSTITUTION") {
      if (institution) profileFields.institution = institution;
      if (cnpj) profileFields.cnpj = cnpj;
      if (porte) profileFields.porte = porte;
      if (faturamento) profileFields.faturamento = faturamento;
    }

    if (profile === "USER" || profile === "PARTNER") {
      if (faixaEtaria) profileFields.faixaEtaria = faixaEtaria;
    }

    const payload: RegistrationPayload = {
      profileType: profile,
      name,
      email,
      phone: phone || undefined,
      profileFields,
    };

    try {
      const result = await registerUser(slug!, payload);

      navigate(`/campanha/${slug}/perguntas/${profile}`, {
        state: { registrationId: result.registrationId },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao realizar cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="campaign-registration-shell">
      <section className="campaign-registration-brand">
        <BrandLogo inverse />

        <div className="auth-copy">
          <span className="eyebrow">Cadastro</span>
          <h1>Participar como {profileLabel.toLowerCase()}</h1>
          <p>
            Preencha seus dados para participar da pesquisa. Leva menos de 2 minutos.
          </p>
        </div>

        <div className="auth-highlight-list">
          <div className="auth-highlight-row">
            <span className="auth-highlight-dot" />
            <span>Dados protegidos pela LGPD</span>
          </div>
          <div className="auth-highlight-row">
            <span className="auth-highlight-dot" />
            <span>Questionário personalizado por perfil</span>
          </div>
          <div className="auth-highlight-row">
            <span className="auth-highlight-dot" />
            <span>Contribua para melhorar a saúde integrada</span>
          </div>
        </div>
      </section>

      <section className="campaign-registration-form-panel">
        <div className="auth-form-wrap">
          <Link
            className="campaign-back-link"
            to={`/campanha/${slug}`}
          >
            <ArrowLeft size={16} />
            Voltar para a campanha
          </Link>

          {welcomeBack !== null ? (
            <div className="auth-card">
              <div className="auth-header">
                <h2>Bem-vindo(a) de volta{welcomeBack ? `, ${welcomeBack}` : ""}!</h2>
                <p>Redirecionando para o questionário…</p>
              </div>
              <div className="campaign-welcome-loader">
                <Loader2 className="campaign-spinner" size={24} />
              </div>
            </div>
          ) : phase === "email" ? (
            <form className="auth-card" onSubmit={handleEmailCheck}>
              <div className="auth-header">
                <h2>Identificação</h2>
                <p>Informe seu e-mail para verificarmos se você já possui cadastro.</p>
              </div>

              <label className="field">
                <span>E-mail</span>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                {fieldErrors.email ? (
                  <span className="campaign-field-error">{fieldErrors.email}</span>
                ) : null}
              </label>

              {error ? <div className="form-message form-message-error">{error}</div> : null}

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? <Loader2 className="campaign-spinner" size={18} /> : null}
                Continuar
              </button>
            </form>
          ) : (
            <form className="auth-card" onSubmit={handleRegister}>
              <div className="auth-header">
                <h2>Cadastro — {profileLabel}</h2>
                <p>Complete seu cadastro para iniciar o questionário.</p>
              </div>

              <label className="field">
                <span>Nome completo *</span>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                {fieldErrors.name ? (
                  <span className="campaign-field-error">{fieldErrors.name}</span>
                ) : null}
              </label>

              <label className="field">
                <span>E-mail *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly
                />
              </label>

              <label className="field">
                <span>Telefone</span>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              {/* INSTITUTION-specific fields */}
              {profile === "INSTITUTION" ? (
                <>
                  <label className="field">
                    <span>Instituição *</span>
                    <input
                      type="text"
                      placeholder="Nome da empresa"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                    />
                    {fieldErrors.institution ? (
                      <span className="campaign-field-error">{fieldErrors.institution}</span>
                    ) : null}
                  </label>

                  <label className="field">
                    <span>CNPJ</span>
                    <input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Porte da empresa</span>
                    <select
                      className="campaign-select"
                      value={porte}
                      onChange={(e) => setPorte(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {PORTE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt} colaboradores</option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Faturamento anual</span>
                    <select
                      className="campaign-select"
                      value={faturamento}
                      onChange={(e) => setFaturamento(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {FATURAMENTO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              {/* USER / PARTNER - age range */}
              {profile === "USER" || profile === "PARTNER" ? (
                <label className="field">
                  <span>Faixa etária</span>
                  <select
                    className="campaign-select"
                    value={faixaEtaria}
                    onChange={(e) => setFaixaEtaria(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {FAIXA_ETARIA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {error ? <div className="form-message form-message-error">{error}</div> : null}

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? <Loader2 className="campaign-spinner" size={18} /> : null}
                Cadastrar e continuar
              </button>
            </form>
          )}

          <p className="auth-legal-copy">
            Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade (LGPD).
          </p>
        </div>
      </section>
    </main>
  );
}
