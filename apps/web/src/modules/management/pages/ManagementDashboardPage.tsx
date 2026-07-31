import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, HeartPulse, Info, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { fetchDashboard, type DashboardResponse } from "../services/managementApi";
import { buildManagementAiSummary } from "../../../shared/ai/careopsAi";

function buildPolyline(history: DashboardResponse["history"]) {
  const maxValue = Math.max(...history.map((point) => point.value));
  const minValue = Math.min(...history.map((point) => point.value));
  const width = 620;
  const height = 220;
  const offsetX = 30;

  return history
    .map((point, index) => {
      const x = offsetX + (width / Math.max(history.length - 1, 1)) * index;
      const y = height - ((point.value - minValue) / Math.max(maxValue - minValue, 1)) * 150 - 24;
      return `${x},${y}`;
    })
    .join(" ");
}

function buildAreaPoints(history: DashboardResponse["history"]) {
  const polyline = buildPolyline(history);
  if (!polyline) return "";
  return `30,220 ${polyline} 650,220`;
}

export function ManagementDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError("Não foi possível carregar a visão principal da clínica."))
      .finally(() => setIsLoading(false));
  }, []);

  const polylinePoints = useMemo(() => (data ? buildPolyline(data.history) : ""), [data]);
  const areaPoints = useMemo(() => (data ? buildAreaPoints(data.history) : ""), [data]);
  const currentAverage = data?.history.at(-1)?.value ?? 0;
  const aiSummary = useMemo(() => (data ? buildManagementAiSummary(data) : null), [data]);
  const totalRoi = data?.kpis.find((item) => item.label === "Economia total")?.value ?? "R$ 0,00";

  if (isLoading) {
    return <section className="empty-state">Carregando o painel principal...</section>;
  }

  if (error || !data) {
    return <section className="empty-state empty-state-error">{error || "Falha ao carregar o painel."}</section>;
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <div className="page-breadcrumb">Gestão / Dashboard</div>
          <h2>Dashboard de ROI e Governança</h2>
          <p>Visão geral dos indicadores da clínica e da economia assistencial.</p>
        </div>
      </div>

      <div className="kpi-grid">
        {data.kpis.map((item, index) => {
          const icon = [Users, HeartPulse, BarChart3][index] ?? Users;
          const Icon = icon;

          return (
            <article className="kpi-card" key={item.label}>
              <div className="kpi-icon">
                <Icon size={20} />
              </div>
              <div>
                <span className="kpi-label">{item.label}</span>
                <strong className="kpi-value">{item.value}</strong>
                <p className="kpi-support">{item.support}</p>
              </div>
              <button className="kpi-action-icon" type="button" aria-label={`Detalhes de ${item.label}`}>
                <Info size={16} />
              </button>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <article className="panel panel-large">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Histórico de saúde do grupo</span>
              <h3>Média dos scores dos pacientes</h3>
            </div>
            <span className="panel-chip">Score médio atual: {currentAverage}</span>
          </div>

          <div className="chart-wrap">
            <svg className="chart-svg" viewBox="0 0 700 220" role="img" aria-label="Histórico de saúde do grupo">
              <defs>
                <linearGradient id="careopsLineFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(63, 120, 212, 0.22)" />
                  <stop offset="100%" stopColor="rgba(63, 120, 212, 0.02)" />
                </linearGradient>
              </defs>
              <polyline className="chart-area" fill="url(#careopsLineFill)" points={areaPoints} />
              <polyline className="chart-polyline-shadow" fill="none" points={polylinePoints} />
              <polyline className="chart-polyline" fill="none" points={polylinePoints} />
              {data.history.map((point, index) => {
                const x = 30 + (620 / Math.max(data.history.length - 1, 1)) * index;
                const maxValue = Math.max(...data.history.map((entry) => entry.value));
                const minValue = Math.min(...data.history.map((entry) => entry.value));
                const y = 220 - ((point.value - minValue) / Math.max(maxValue - minValue, 1)) * 150 - 24;

                return (
                  <g key={point.label}>
                    <circle cx={x} cy={y} r="5" className="chart-point" />
                    <text x={x} y={208} className="chart-label">
                      {point.label}
                    </text>
                    <text x={x} y={y - 14} className="chart-value">
                      {point.value}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </article>

        {aiSummary ? (
          <article className="panel panel-soft">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">{aiSummary.eyebrow}</span>
                <h3>{aiSummary.title}</h3>
              </div>
              <Sparkles size={18} />
            </div>
            <p>{aiSummary.summary}</p>
            <ul className="assessment-ai-list">
              {aiSummary.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="rag-source-list">
              {aiSummary.ragSources.map((source) => (
                <span key={source.id}>{source.title}</span>
              ))}
            </div>
            <p className="predictive-governance">{aiSummary.governanceNote}</p>
          </article>
        ) : null}

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Alertas</span>
              <h3>Itens que exigem atenção</h3>
            </div>
            <AlertTriangle size={18} />
          </div>

          <div className="alert-list">
            {data.alerts.map((item) => (
              <div className={`alert-row alert-row-${item.tone}`} key={item.message}>
                <div className="alert-row-copy">
                  <span>{item.message}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Economia assistencial por tipo</span>
              <h3>Composição do ROI atual</h3>
            </div>
            <Info size={18} />
          </div>

          <div className="roi-panel-grid">
            <div className="roi-donut-wrap">
              <div className="roi-donut" />
              <div className="roi-donut-center">
                <strong>{totalRoi}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="metric-list">
              {data.roiComposition.map((item, index) => {
                const bulletClass = ["metric-bullet-blue", "metric-bullet-teal", "metric-bullet-purple", "metric-bullet-gray"][index] ?? "metric-bullet-gray";
                return (
                  <div className="metric-list-row" key={item.label}>
                    <div className="metric-label-wrap">
                      <span className={`metric-bullet ${bulletClass}`} />
                      <span>{item.label}</span>
                    </div>
                    <strong>{item.value}</strong>
                    <span>{item.percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button className="panel-footer-action" type="button" onClick={() => navigate('/gestao/pacientes')}>
            Ver relatório completo
          </button>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Pacientes por status</span>
              <h3>Distribuição atual</h3>
            </div>
            <Info size={18} />
          </div>

          <div className="status-card-grid">
            {data.statuses.map((status) => (
              <div className={`status-card status-card-${status.tone}`} key={status.label}>
                <div className="status-card-copy">
                  <span className="status-card-title">{status.label}</span>
                  <p className="status-card-support">{status.support}</p>
                </div>
                <div className="status-card-metric">
                  <strong>{status.total}</strong>
                </div>
              </div>
            ))}
          </div>

          <button className="panel-footer-action" type="button" onClick={() => navigate('/gestao/pacientes')}>
            Ver relatório completo
          </button>
        </article>
      </div>
    </section>
  );
}
