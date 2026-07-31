import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, ClipboardList, LogOut, Sparkles, Target } from "lucide-react";

import { useAuth } from "../../../app/providers/AuthContext";
import { fetchPatientHome, updateGoalStatus, type PatientRecord } from "../../patients/services/patientsApi";

export function PatientHomePage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState<PatientRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatientHome()
      .then(setRecord)
      .catch(() => setError("Nao foi possivel carregar sua rotina de cuidado."))
      .finally(() => setIsLoading(false));
  }, []);

  const completedGoals = useMemo(
    () => record?.goals.filter((goal) => goal.status === "Concluida").length ?? 0,
    [record],
  );

  const handleLogout = () => {
    logout();
    window.location.replace("/paciente/login");
  };

  const toggleGoal = async (goalId: string, currentStatus: string) => {
    if (!record) return;
    try {
      const nextStatus = currentStatus === "Concluida" ? "Pendente" : "Concluida";
      const updated = await updateGoalStatus(record.patient.id, goalId, nextStatus);
      setRecord(updated);
    } catch {
      setError("Nao foi possivel atualizar a meta.");
    }
  };

  if (isLoading) {
    return <main className="patient-home"><div className="patient-home-container"><section className="empty-state">Carregando sua area...</section></div></main>;
  }

  if (error || !record) {
    return <main className="patient-home"><div className="patient-home-container"><section className="empty-state empty-state-error">{error || "Falha ao carregar a area do paciente."}</section></div></main>;
  }

  const { patient, intelligence, goals, alerts } = record;

  return (
    <main className="patient-home">
      <div className="patient-home-container">
        <header className="patient-home-header patient-home-header-clean">
          <div className="patient-home-header-copy">
            <span className="eyebrow">Minha saude</span>
            <h1>Ola, {session?.name ?? patient.name}</h1>
            <p>Sua rotina foi sincronizada com a clinica para mostrar metas, sinais e a leitura assistiva mais recente.</p>
          </div>
          <button className="secondary-button" onClick={handleLogout} type="button">
            <LogOut size={16} />
            Sair
          </button>
        </header>

        <section className="patient-home-hero patient-home-hero-clean">
          <article className="patient-score-card patient-score-card-centered">
            <div className="patient-score-ring" style={{ ["--score-value" as string]: `${patient.score}%` }}>
              <div className="patient-score-ring-inner">
                <strong>{patient.score}%</strong>
                <span>Score VH</span>
              </div>
            </div>

            <div className="patient-score-copy">
              <span className="panel-kicker">Sua leitura de hoje</span>
              <h2>{intelligence.title}</h2>
              <p>{intelligence.summary}</p>
              <div className="patient-home-actions">
                <Link className="primary-button primary-button-inline secondary-button-link" to="/paciente/avaliacao">
                  Responder avaliacao
                </Link>
                <button className="secondary-button" type="button" onClick={() => navigate("/paciente/avaliacao")}>
                  Atualizar leitura
                </button>
              </div>
            </div>
          </article>
        </section>

        <section className="patient-home-grid patient-home-grid-summary patient-ai-strip">
          <article className="panel patient-summary-card patient-summary-card-ai">
            <Sparkles size={18} />
            <div>
              <span className="panel-kicker">{intelligence.eyebrow}</span>
              <strong>Risco {patient.riskLevel} · {patient.riskPercent}%</strong>
              <p>{intelligence.governanceNote}</p>
            </div>
          </article>
        </section>

        <section className="patient-home-grid patient-home-grid-main">
          <article className="panel panel-soft">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Metas do dia</span>
                <h3>Acompanhamento diario</h3>
              </div>
              <span className="panel-chip">{completedGoals}/{goals.length} concluidas</span>
            </div>

            <div className="goal-list goal-list-spacious">
              {goals.map((goal) => (
                <button className="goal-row goal-row-button" key={goal.id} onClick={() => void toggleGoal(goal.id, goal.status)} type="button">
                  <div className="goal-row-copy">
                    <strong>{goal.title}</strong>
                    <span>{goal.frequency}</span>
                  </div>
                  <span className={`goal-status goal-status-${goal.status === "Concluida" ? "feito" : "pendente"}`}>
                    {goal.status === "Concluida" ? "Feito" : "Pendente"}
                  </span>
                </button>
              ))}
            </div>
          </article>

          <article className="panel panel-soft">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Plano de cuidado</span>
                <h3>Orientacoes validadas</h3>
              </div>
            </div>

            <div className="plan-list">
              {intelligence.recommendedActions.slice(0, 3).map((item) => (
                <button className="plan-row plan-row-button" key={item} type="button">
                  <span className="plan-marker" />
                  <p>{item}</p>
                </button>
              ))}
            </div>
          </article>

          <article className="panel panel-soft">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Proxima leitura</span>
                <h3>Janela de resposta</h3>
              </div>
            </div>
            <button className="timeline-card timeline-card-button" type="button" onClick={() => navigate("/paciente/avaliacao")}>
              <strong>Avaliacao disponivel agora</strong>
              <p>Atualize sua leitura para refletir o score e os alertas no painel da clinica.</p>
            </button>
          </article>

          <article className="panel panel-soft">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Alertas da semana</span>
                <h3>Itens em atencao</h3>
              </div>
            </div>
            <div className="alert-list alert-list-spacious">
              {(alerts.length > 0 ? alerts : intelligence.signals).slice(0, 2).map((signal) => (
                <button className={`alert-row alert-row-${"tone" in signal ? signal.tone : "info"} alert-row-button`} key={"id" in signal ? signal.id : signal.label} type="button">
                  <Bell size={16} />
                  <span>{"message" in signal ? signal.message : `${signal.label}: ${signal.action}`}</span>
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="patient-home-grid patient-home-grid-summary">
          <article className="panel patient-summary-card">
            <ClipboardList size={18} />
            <div>
              <span className="panel-kicker">Avaliacao</span>
              <strong>{patient.lastResponseAt ? `Ultima resposta em ${patient.lastResponseAt}` : "Nenhuma resposta enviada ainda"}</strong>
            </div>
          </article>
          <article className="panel patient-summary-card">
            <Target size={18} />
            <div>
              <span className="panel-kicker">Metas</span>
              <strong>{completedGoals} metas concluidas nesta rotina</strong>
            </div>
          </article>
          <article className="panel patient-summary-card">
            <CheckCircle2 size={18} />
            <div>
              <span className="panel-kicker">LGPD e governanca</span>
              <strong>Consentimento {record.lgpdConsentVersion} registrado</strong>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
