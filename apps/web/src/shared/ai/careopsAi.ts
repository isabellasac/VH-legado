import type { DashboardResponse } from "../../modules/management/services/managementApi";

export type AssessmentResponses = Record<string, string>;

type PredictiveTone = "success" | "warning" | "danger" | "info";

export type PredictiveRiskLevel = "Baixo" | "Moderado" | "Alto";

export type ClinicalRagSource = {
  id: "score" | "prm" | "alertas" | "acompanhamento" | "roi";
  title: string;
  scope: string;
};

export type PredictiveSignal = {
  label: string;
  evidence: string;
  action: string;
  tone: PredictiveTone;
  sourceIds: ClinicalRagSource["id"][];
};

export type PatientPredictiveIntelligence = {
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  score: number;
  riskPercent: number;
  riskLevel: PredictiveRiskLevel;
  riskTone: PredictiveTone;
  signals: PredictiveSignal[];
  recommendedActions: string[];
  ragSources: ClinicalRagSource[];
  governanceNote: string;
  apiPolicy: string;
};

const clinicalRagSources: ClinicalRagSource[] = [
  {
    id: "score",
    title: "Regra de score VH",
    scope: "Perguntas fechadas pontuam de 0 a 100; respostas abertas geram aviso para o prontuario.",
  },
  {
    id: "prm",
    title: "Parametros de PRMs",
    scope: "Uso de muitos medicamentos, efeitos relatados e necessidade de revisao farmaceutica.",
  },
  {
    id: "alertas",
    title: "Regras clinicas de alerta",
    scope: "Baixa adesao, queda de score, muitos medicamentos e ausencia de resposta/metas.",
  },
  {
    id: "acompanhamento",
    title: "Plano de cuidado validado",
    scope: "Sono, hidratacao, terapia, metas e acompanhamento humano pela clinica.",
  },
  {
    id: "roi",
    title: "ROI assistencial",
    scope: "Eventos evitados, intervencoes registradas e economia assistencial por tipo.",
  },
];

const sideEffectKeywords = [
  "tontura",
  "queda",
  "enjoo",
  "náusea",
  "nausea",
  "dor",
  "sangramento",
  "falta de ar",
  "confusão",
  "confusao",
  "pressão",
  "pressao",
];

function normalizeValue(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function extractScale(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getRiskLevel(riskPercent: number): {
  level: PredictiveRiskLevel;
  tone: PredictiveTone;
  title: string;
} {
  if (riskPercent >= 65) {
    return {
      level: "Alto",
      tone: "danger",
      title: "Risco alto para acompanhamento prioritario",
    };
  }

  if (riskPercent >= 35) {
    return {
      level: "Moderado",
      tone: "warning",
      title: "Risco moderado com pontos para revisar",
    };
  }

  return {
    level: "Baixo",
    tone: "success",
    title: "Risco baixo no acompanhamento atual",
  };
}

function hasText(value: string | undefined) {
  return normalizeValue(value).length > 0;
}

function includesAny(value: string | undefined, keywords: string[]) {
  const normalized = normalizeValue(value);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function uniqueSources(sourceIds: ClinicalRagSource["id"][]) {
  const uniqueIds = new Set(sourceIds);
  return clinicalRagSources.filter((source) => uniqueIds.has(source.id));
}

function sortSignalsByPriority(signals: PredictiveSignal[]) {
  const priority: Record<PredictiveTone, number> = {
    danger: 0,
    warning: 1,
    info: 2,
    success: 3,
  };

  return [...signals].sort((a, b) => priority[a.tone] - priority[b.tone]);
}

export function buildPatientPredictiveIntelligence(responses: AssessmentResponses): PatientPredictiveIntelligence {
  const sleep = extractScale(responses.sono);
  const energy = extractScale(responses.energia);
  const mood = extractScale(responses.humor);
  const stress = extractScale(responses.estresse);
  const medicationAdherence = extractScale(responses.medicacao);
  const medsCount = normalizeValue(responses.quantidade_medicamentos);
  const sideEffects = responses.efeitos;
  const therapy = normalizeValue(responses.terapia);
  const hydration = normalizeValue(responses.hidratacao);
  const activity = normalizeValue(responses.atividade);
  const reminder = normalizeValue(responses.lembrete);
  const clinicalNote = [responses.burnout, responses.observacao].filter(Boolean).join(" ");

  const signals: PredictiveSignal[] = [];
  let riskPoints = 12;

  const addSignal = (points: number, signal: PredictiveSignal) => {
    riskPoints += points;
    signals.push(signal);
  };

  if ((sleep ?? 5) <= 2) {
    addSignal(14, {
      label: "Sono baixo",
      evidence: "Resposta de sono em faixa critica.",
      action: "Priorizar rotina noturna e revisar fadiga na proxima leitura.",
      tone: "warning",
      sourceIds: ["score", "acompanhamento"],
    });
  } else if (sleep === 3) {
    riskPoints += 6;
  }

  if ((energy ?? 5) <= 2) {
    addSignal(10, {
      label: "Energia baixa",
      evidence: "Energia diaria abaixo do esperado.",
      action: "Cruzar com sono, adesao terapeutica e sinais recentes.",
      tone: "warning",
      sourceIds: ["score", "acompanhamento"],
    });
  }

  if ((mood ?? 5) <= 2 || (stress ?? 0) >= 4) {
    addSignal(12, {
      label: "Sobrecarga emocional",
      evidence: "Humor baixo ou estresse elevado informado na avaliacao.",
      action: "Sinalizar a equipe para acompanhamento e possivel ajuste do plano.",
      tone: "warning",
      sourceIds: ["score", "alertas", "acompanhamento"],
    });
  } else if (stress === 3) {
    riskPoints += 6;
  }

  if ((medicationAdherence ?? 5) <= 2) {
    addSignal(12, {
      label: "Adesao medicamentosa baixa",
      evidence: "Registro indica dificuldade para tomar medicamentos corretamente.",
      action: "Checar rotina de horarios e necessidade de lembrete assistido.",
      tone: "danger",
      sourceIds: ["prm", "alertas"],
    });
  } else if (medicationAdherence === 3) {
    riskPoints += 5;
  }

  if (medsCount.includes("6") || medsCount.includes("mais")) {
    addSignal(14, {
      label: "Risco farmaceutico elevado",
      evidence: "Uso atual de 6 ou mais medicamentos.",
      action: "Encaminhar para revisao farmaceutica e monitorar eventos adversos.",
      tone: "danger",
      sourceIds: ["prm", "alertas", "roi"],
    });
  } else if (medsCount.includes("3")) {
    riskPoints += 6;
  }

  if (includesAny(sideEffects, sideEffectKeywords)) {
    addSignal(14, {
      label: "Possivel evento adverso",
      evidence: "Sintoma relatado em campo aberto de medicamentos.",
      action: "Cruzar relato com prontuario, medicacoes em uso e plano vigente.",
      tone: "danger",
      sourceIds: ["prm", "alertas", "roi"],
    });
  } else if (hasText(sideEffects)) {
    addSignal(6, {
      label: "Relato aberto para revisao",
      evidence: "Paciente registrou desconforto ou observacao livre.",
      action: "Enviar para triagem no prontuario antes de alterar conduta.",
      tone: "info",
      sourceIds: ["score", "acompanhamento"],
    });
  }

  if (therapy === "nao" || therapy === "não") {
    addSignal(12, {
      label: "Baixa adesao terapeutica",
      evidence: "Paciente informou nao seguir as terapias recomendadas.",
      action: "Reordenar metas e simplificar o plano validado pela clinica.",
      tone: "warning",
      sourceIds: ["alertas", "acompanhamento"],
    });
  } else if (therapy === "parcialmente") {
    riskPoints += 6;
  }

  if (hydration === "baixa") {
    addSignal(6, {
      label: "Hidratacao baixa",
      evidence: "Hidratacao marcada como baixa.",
      action: "Definir meta simples de hidratacao para a semana.",
      tone: "info",
      sourceIds: ["score", "acompanhamento"],
    });
  }

  if (activity === "nenhuma") {
    riskPoints += 5;
  }

  if (reminder === "muita dificuldade") {
    addSignal(10, {
      label: "Dificuldade com horarios",
      evidence: "Paciente relata muita dificuldade para lembrar medicamentos.",
      action: "Ativar acompanhamento de lembretes e revisar barreiras da rotina.",
      tone: "warning",
      sourceIds: ["prm", "alertas", "acompanhamento"],
    });
  } else if (reminder === "alguma dificuldade") {
    riskPoints += 5;
  }

  if (hasText(clinicalNote)) {
    addSignal(includesAny(clinicalNote, sideEffectKeywords) ? 8 : 4, {
      label: "Observacao para prontuario",
      evidence: "Campo aberto preenchido pelo paciente.",
      action: "Manter como aviso assistivo para validacao profissional.",
      tone: "info",
      sourceIds: ["score", "acompanhamento"],
    });
  }

  if (signals.length === 0) {
    signals.push({
      label: "Sem sinal critico evidente",
      evidence: "Respostas atuais nao acionaram regras de alerta.",
      action: "Manter monitoramento e repetir leitura na proxima janela.",
      tone: "success",
      sourceIds: ["score", "acompanhamento"],
    });
  }

  const riskPercent = clampScore(riskPoints);
  const score = clampScore(100 - riskPercent);
  const risk = getRiskLevel(riskPercent);
  const sourceIds = signals.flatMap((signal) => signal.sourceIds);
  const ragSources = uniqueSources(sourceIds.length > 0 ? sourceIds : ["score", "acompanhamento"]);
  const prioritizedSignals = sortSignalsByPriority(signals);
  const topSignals = prioritizedSignals.slice(0, 3);
  const recommendedActions = topSignals.map((signal) => signal.action);

  return {
    eyebrow: "IA Preditiva VH",
    title: risk.title,
    summary:
      risk.level === "Alto"
        ? "A leitura preditiva prioriza revisao pela equipe clinica antes de qualquer mudanca no cuidado."
        : risk.level === "Moderado"
          ? "A leitura preditiva encontrou pontos de atencao para acompanhar nesta semana."
          : "A leitura preditiva esta estavel e segue como apoio ao acompanhamento.",
    bullets: topSignals.map((signal) => `${signal.label}: ${signal.action}`),
    score,
    riskPercent,
    riskLevel: risk.level,
    riskTone: risk.tone,
    signals: prioritizedSignals,
    recommendedActions,
    ragSources,
    governanceNote: "Saida assistiva: risco, alerta e apoio a decisao; nao substitui diagnostico medico.",
    apiPolicy: "Sem API externa no front-end: a v1 usa regras locais e fontes aprovadas; IA externa deve passar por controlador interno.",
  };
}

export function buildManagementAiSummary(data: DashboardResponse) {
  const dangerAlerts = data.alerts.filter((item) => item.tone === "danger").length;
  const warningAlerts = data.alerts.filter((item) => item.tone === "warning").length;
  const topStatus = [...data.statuses].sort((a, b) => b.total - a.total)[0];
  const alertStatus = data.statuses.find((status) => status.tone === "danger");
  const latestScore = data.history.at(-1)?.value ?? 0;
  const previousScore = data.history.at(-2)?.value ?? latestScore;
  const trend = latestScore - previousScore;

  return {
    eyebrow: "IA Preditiva + RAG",
    title: dangerAlerts > 0 ? "Priorizacao assistiva da clinica" : "Monitoramento preditivo estavel",
    summary:
      dangerAlerts > 0
        ? `${dangerAlerts} alerta(s) critico(s) e ${warningAlerts} ponto(s) de atencao entram na fila de revisao.`
        : "Os sinais atuais indicam acompanhamento estavel, com monitoramento continuo de score, adesao e ROI.",
    bullets: [
      `Maior concentracao atual: ${topStatus?.label ?? "Ativo"} (${topStatus?.support ?? "sem dado"}).`,
      `${alertStatus?.total ?? 0} paciente(s) em faixa de alerta para triagem da equipe.`,
      `Tendencia do score do grupo: ${trend >= 0 ? "+" : ""}${trend} ponto(s) na ultima leitura.`,
    ],
    ragSources: uniqueSources(["score", "alertas", "prm", "roi"]),
    governanceNote: "A camada preditiva classifica risco e apoio a decisao; diagnostico continua validado por profissional.",
  };
}

export function buildPatientAiSummary(responses: AssessmentResponses) {
  const intelligence = buildPatientPredictiveIntelligence(responses);

  return {
    eyebrow: intelligence.eyebrow,
    title: intelligence.title,
    summary: intelligence.summary,
    bullets: intelligence.bullets,
  };
}
