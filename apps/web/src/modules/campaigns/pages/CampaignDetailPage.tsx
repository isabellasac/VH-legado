import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Copy,
  ExternalLink,
  Pencil,
  Power,
  UserRound,
  UsersRound,
} from "lucide-react";

import { type CampaignDetail, getCampaign } from "../../campaigns/services/campaignsApi";

const PROFILE_LABELS: Record<string, string> = {
  INSTITUTION: "Instituição",
  USER: "Usuário",
  PARTNER: "Parceiro",
};

const PROFILE_ICONS: Record<string, typeof Building2> = {
  INSTITUTION: Building2,
  USER: UserRound,
  PARTNER: UsersRound,
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  TEXT: "Texto livre",
  SINGLE_CHOICE: "Escolha única",
  MULTIPLE_CHOICE: "Múltipla escolha",
  SCALE: "Escala (1–5)",
};

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCampaign(id)
      .then(setCampaign)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyLink = () => {
    if (!campaign) return;
    const url = `${window.location.origin}/campanha/${campaign.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (loading) {
    return (
      <div className="campaigns-loading">
        <div className="spinner" />
        <p>Carregando campanha...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="campaigns-empty">
        <h2>Campanha não encontrada</h2>
        <Link className="primary-button" to="/gestao/campanhas">
          Voltar para campanhas
        </Link>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/campanha/${campaign.slug}`;

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <span>Gestão</span>
          <ChevronRight size={14} />
          <span
            className="breadcrumb-link"
            onClick={() => navigate("/gestao/campanhas")}
          >
            Campanhas
          </span>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">{campaign.name}</span>
        </div>

        <div className="page-header-row">
          <div className="page-header-copy">
            <h1>{campaign.name}</h1>
          </div>
          <div className="page-header-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => navigate("/gestao/campanhas")}
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
            <Link className="primary-button" to={`/gestao/campanhas/${id}/editar`}>
              <Pencil size={16} />
              Editar
            </Link>
          </div>
        </div>
      </div>

      {/* overview cards */}
      <div className="campaign-detail-grid">
        <div className="data-card campaign-info-card">
          <h3>Informações</h3>
          <dl className="campaign-dl">
            <dt>Status</dt>
            <dd>
              <span className={`status-badge status-${campaign.active ? "success" : "neutral"}`}>
                <Power size={12} />
                {campaign.active ? "Ativa" : "Inativa"}
              </span>
            </dd>
            <dt>Cadastros</dt>
            <dd><strong>{campaign.totalRegistrations}</strong></dd>
            <dt>Criação</dt>
            <dd>{new Date(campaign.createdAt).toLocaleDateString("pt-BR")}</dd>
          </dl>

          {campaign.description && (
            <>
              <h4>Descrição</h4>
              <p className="campaign-desc-text">{campaign.description}</p>
            </>
          )}

          {campaign.confirmationMessage && (
            <>
              <h4>Mensagem de confirmação</h4>
              <p className="campaign-desc-text">{campaign.confirmationMessage}</p>
            </>
          )}
        </div>

        <div className="data-card campaign-link-card">
          <h3>Link da campanha</h3>
          <div className="campaign-link-row">
            <code className="campaign-link-url">{publicUrl}</code>
            <button className="icon-button" type="button" onClick={handleCopyLink} title="Copiar link">
              <Copy size={16} />
            </button>
            <a
              className="icon-button"
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir em nova aba"
            >
              <ExternalLink size={16} />
            </a>
          </div>
          {copied && <span className="campaign-link-copied">Link copiado!</span>}

          <div className="campaign-qr-placeholder">
            <div className="qr-mock">QR</div>
            <p>Use este link ou gere um QR code para distribuir no evento.</p>
          </div>
        </div>
      </div>

      {/* profiles & questions */}
      <div className="campaign-profiles-section">
        <h2>Perfis e perguntas</h2>

        {campaign.profiles.length === 0 ? (
          <p className="muted-text">Nenhum perfil configurado nesta campanha.</p>
        ) : (
          <div className="campaign-profiles-grid">
            {campaign.profiles.map((profile) => {
              const Icon = PROFILE_ICONS[profile.profileType] || UserRound;
              return (
                <div key={profile.profileType} className="data-card campaign-profile-card">
                  <div className="campaign-profile-header">
                    <Icon size={20} />
                    <h3>{PROFILE_LABELS[profile.profileType]}</h3>
                    <span className="badge">{profile.questions.length} pergunta(s)</span>
                  </div>

                  {profile.questions.length === 0 ? (
                    <p className="muted-text">Nenhuma pergunta configurada.</p>
                  ) : (
                    <ol className="campaign-question-list-preview">
                      {profile.questions.map((q) => (
                        <li key={q.id}>
                          <span className="question-preview-text">{q.text}</span>
                          <span className="question-preview-type">
                            {QUESTION_TYPE_LABELS[q.type] || q.type}
                            {q.required && " • Obrigatória"}
                          </span>
                          {q.options && q.options.length > 0 && (
                            <span className="question-preview-options">
                              Opções: {q.options.join(", ")}
                            </span>
                          )}
                          {q.conditionalOnQuestionId && (
                            <span className="question-preview-conditional">
                              ⚡ Condicional
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
