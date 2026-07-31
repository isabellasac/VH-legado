import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  type CampaignDetail,
  type CampaignPayload,
  type ProfileConfig,
  type ProfileQuestion,
  createCampaign,
  getCampaign,
  updateCampaign,
} from "../../campaigns/services/campaignsApi";

type TabId = "general" | "INSTITUTION" | "USER" | "PARTNER";

const PROFILE_LABELS: Record<string, string> = {
  INSTITUTION: "Instituição",
  USER: "Usuário",
  PARTNER: "Parceiro",
};

const QUESTION_TYPES = [
  { value: "TEXT", label: "Texto livre" },
  { value: "SINGLE_CHOICE", label: "Escolha única" },
  { value: "MULTIPLE_CHOICE", label: "Múltipla escolha" },
  { value: "SCALE", label: "Escala (1–5)" },
];

function generateId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyQuestion(order: number): ProfileQuestion {
  return {
    id: generateId(),
    text: "",
    type: "TEXT",
    options: [],
    required: false,
    order,
    conditionalOnQuestionId: null,
    conditionalOnAnswer: null,
  };
}

export function CampaignFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  /* form state */
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState(
    "Cadastro realizado com sucesso! Obrigado por participar."
  );
  const [active, setActive] = useState(true);
  const [enabledProfiles, setEnabledProfiles] = useState<Record<string, boolean>>({
    INSTITUTION: true,
    USER: true,
    PARTNER: true,
  });
  const [questions, setQuestions] = useState<Record<string, ProfileQuestion[]>>({
    INSTITUTION: [],
    USER: [],
    PARTNER: [],
  });

  /* load existing */
  useEffect(() => {
    if (!id) return;
    getCampaign(id)
      .then((c: CampaignDetail) => {
        setName(c.name);
        setSlug(c.slug);
        setDescription(c.description);
        setConfirmationMessage(c.confirmationMessage);
        setActive(c.active);

        const ep: Record<string, boolean> = { INSTITUTION: false, USER: false, PARTNER: false };
        const qs: Record<string, ProfileQuestion[]> = { INSTITUTION: [], USER: [], PARTNER: [] };
        for (const p of c.profiles) {
          ep[p.profileType] = true;
          qs[p.profileType] = p.questions;
        }
        setEnabledProfiles(ep);
        setQuestions(qs);
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* auto-generate slug */
  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEditing) {
      setSlug(
        value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  /* questions CRUD */
  const addQuestion = (profile: string) => {
    setQuestions((prev) => ({
      ...prev,
      [profile]: [...prev[profile], emptyQuestion(prev[profile].length + 1)],
    }));
  };

  const updateQuestion = (profile: string, qId: string, patch: Partial<ProfileQuestion>) => {
    setQuestions((prev) => ({
      ...prev,
      [profile]: prev[profile].map((q) => (q.id === qId ? { ...q, ...patch } : q)),
    }));
  };

  const removeQuestion = (profile: string, qId: string) => {
    setQuestions((prev) => ({
      ...prev,
      [profile]: prev[profile]
        .filter((q) => q.id !== qId)
        .map((q, i) => ({ ...q, order: i + 1 })),
    }));
  };

  const moveQuestion = (profile: string, fromIndex: number, toIndex: number) => {
    setQuestions((prev) => {
      const list = [...prev[profile]];
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return {
        ...prev,
        [profile]: list.map((q, i) => ({ ...q, order: i + 1 })),
      };
    });
  };

  /* save */
  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);

    const profiles: ProfileConfig[] = Object.entries(enabledProfiles)
      .filter(([, enabled]) => enabled)
      .map(([profileType]) => ({
        profileType,
        questions: questions[profileType] || [],
      }));

    const payload: CampaignPayload = {
      name,
      slug,
      description,
      confirmationMessage,
      active,
      profiles,
    };

    try {
      if (isEditing) {
        await updateCampaign(id!, payload);
      } else {
        await createCampaign(payload);
      }
      navigate("/gestao/campanhas");
    } finally {
      setSaving(false);
    }
  }, [name, slug, description, confirmationMessage, active, enabledProfiles, questions, id, isEditing, navigate]);

  /* options helper */
  const handleOptionsChange = (profile: string, qId: string, raw: string) => {
    updateQuestion(profile, qId, {
      options: raw.split("\n").filter((o) => o.trim() !== ""),
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

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: "Dados gerais" },
    ...(enabledProfiles.INSTITUTION ? [{ id: "INSTITUTION" as TabId, label: "Perguntas — Instituição" }] : []),
    ...(enabledProfiles.USER ? [{ id: "USER" as TabId, label: "Perguntas — Usuário" }] : []),
    ...(enabledProfiles.PARTNER ? [{ id: "PARTNER" as TabId, label: "Perguntas — Parceiro" }] : []),
  ];

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
          <span className="breadcrumb-current">
            {isEditing ? "Editar" : "Nova campanha"}
          </span>
        </div>

        <div className="page-header-row">
          <div className="page-header-copy">
            <h1>{isEditing ? `Editar: ${name}` : "Nova campanha"}</h1>
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
            <button
              className="primary-button"
              type="button"
              onClick={handleSubmit}
              disabled={saving || !name.trim() || !slug.trim()}
            >
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar campanha"}
            </button>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="campaign-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`campaign-tab${activeTab === tab.id ? " campaign-tab-active" : ""}`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* general tab */}
      {activeTab === "general" && (
        <div className="data-card campaign-form-card">
          <div className="form-group">
            <label htmlFor="campaign-name">Nome da campanha *</label>
            <input
              id="campaign-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Minas Summit 2026"
            />
          </div>

          <div className="form-group">
            <label htmlFor="campaign-slug">Slug (URL) *</label>
            <div className="input-with-prefix">
              <span className="input-prefix">/campanha/</span>
              <input
                id="campaign-slug"
                type="text"
                className="form-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="minas-summit-2026"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="campaign-description">Descrição</label>
            <textarea
              id="campaign-description"
              className="form-input form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descrição exibida na página pública da campanha"
            />
          </div>

          <div className="form-group">
            <label htmlFor="campaign-confirmation">Mensagem de confirmação</label>
            <textarea
              id="campaign-confirmation"
              className="form-input form-textarea"
              value={confirmationMessage}
              onChange={(e) => setConfirmationMessage(e.target.value)}
              rows={3}
              placeholder="Mensagem exibida após o cadastro e questionário"
            />
          </div>

          <div className="form-row">
            <div className="form-group form-group-inline">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span>Campanha ativa</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Perfis habilitados</label>
            <div className="profile-toggles">
              {(["INSTITUTION", "USER", "PARTNER"] as const).map((p) => (
                <label key={p} className="form-checkbox-label profile-toggle-item">
                  <input
                  type="checkbox"
                  checked={enabledProfiles[p]}
                  onChange={(e) => {
                      setEnabledProfiles((prev) => ({ ...prev, [p]: e.target.checked }));
                      if (!e.target.checked) {
                        setActiveTab((current) => (current === p ? "general" : current));
                      }
                    }}
                  />
                  <span>{PROFILE_LABELS[p]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* question tabs */}
      {activeTab !== "general" && (
        <div className="data-card campaign-form-card">
          <div className="campaign-questions-header">
            <h2>
              Perguntas investigativas — {PROFILE_LABELS[activeTab]}
            </h2>
            <p>
              Essas perguntas serão exibidas após o cadastro do usuário.
              Perguntas de enquadramento (nome, e-mail, etc.) já são coletadas automaticamente.
            </p>
          </div>

          <div className="campaign-questions-list">
            {(questions[activeTab] || []).map((q, index) => (
              <div key={q.id} className="campaign-question-item">
                <div className="question-item-header">
                  <div className="question-item-grip">
                    {index > 0 && (
                      <button
                        className="icon-button"
                        type="button"
                        title="Mover para cima"
                        onClick={() => moveQuestion(activeTab, index, index - 1)}
                      >
                        <GripVertical size={14} />
                        ↑
                      </button>
                    )}
                    {index < (questions[activeTab]?.length ?? 0) - 1 && (
                      <button
                        className="icon-button"
                        type="button"
                        title="Mover para baixo"
                        onClick={() => moveQuestion(activeTab, index, index + 1)}
                      >
                        <GripVertical size={14} />
                        ↓
                      </button>
                    )}
                  </div>
                  <span className="question-item-number">Pergunta {q.order}</span>
                  <button
                    className="icon-button icon-button-danger"
                    type="button"
                    title="Remover pergunta"
                    onClick={() => removeQuestion(activeTab, q.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="question-item-body">
                  <div className="form-group">
                    <label>Texto da pergunta</label>
                    <input
                      type="text"
                      className="form-input"
                      value={q.text}
                      onChange={(e) => updateQuestion(activeTab, q.id, { text: e.target.value })}
                      placeholder="Digite o texto da pergunta"
                    />
                  </div>

                  <div className="form-row form-row-compact">
                    <div className="form-group">
                      <label>Tipo</label>
                      <select
                        className="form-input form-select"
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(activeTab, q.id, {
                            type: e.target.value as ProfileQuestion["type"],
                          })
                        }
                      >
                        {QUESTION_TYPES.map((qt) => (
                          <option key={qt.value} value={qt.value}>
                            {qt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group form-group-inline">
                      <label className="form-checkbox-label">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) =>
                            updateQuestion(activeTab, q.id, { required: e.target.checked })
                          }
                        />
                        <span>Obrigatória</span>
                      </label>
                    </div>
                  </div>

                  {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && (
                    <div className="form-group">
                      <label>Opções (uma por linha)</label>
                      <textarea
                        className="form-input form-textarea"
                        rows={4}
                        value={(q.options || []).join("\n")}
                        onChange={(e) => handleOptionsChange(activeTab, q.id, e.target.value)}
                        placeholder={"Opção 1\nOpção 2\nOpção 3"}
                      />
                    </div>
                  )}

                  <div className="form-row form-row-compact">
                    <div className="form-group">
                      <label>Condicional: exibir se a pergunta</label>
                      <select
                        className="form-input form-select"
                        value={q.conditionalOnQuestionId || ""}
                        onChange={(e) =>
                          updateQuestion(activeTab, q.id, {
                            conditionalOnQuestionId: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Sempre exibir</option>
                        {(questions[activeTab] || [])
                          .filter((oq) => oq.id !== q.id)
                          .map((oq) => (
                            <option key={oq.id} value={oq.id}>
                              {oq.order}. {oq.text.slice(0, 50)}
                            </option>
                          ))}
                      </select>
                    </div>
                    {q.conditionalOnQuestionId && (
                      <div className="form-group">
                        <label>Tiver a resposta (use | para múltiplas)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={q.conditionalOnAnswer || ""}
                          onChange={(e) =>
                            updateQuestion(activeTab, q.id, {
                              conditionalOnAnswer: e.target.value || null,
                            })
                          }
                          placeholder="Resposta que ativa esta pergunta"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="secondary-button campaign-add-question"
            type="button"
            onClick={() => addQuestion(activeTab)}
          >
            <Plus size={16} />
            Adicionar pergunta
          </button>
        </div>
      )}
    </>
  );
}
