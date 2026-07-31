import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { buildPatientPredictiveIntelligence, type AssessmentResponses } from "../../../shared/ai/careopsAi";
import { submitPatientAssessment } from "../../patients/services/patientsApi";

type QuestionOption = {
  label: string;
  value: string;
};

type QuestionBlock = {
  id: string;
  title: string;
  description: string;
  questions: Array<
    | { id: string; label: string; type: "scale" }
    | { id: string; label: string; type: "text" }
    | { id: string; label: string; type: "single"; options: QuestionOption[] }
  >;
};

const STORAGE_KEY = "careops-vh.patient-assessment";

const assessmentBlocks: QuestionBlock[] = [
  {
    id: "habitos",
    title: "Hábitos e bem-estar",
    description: "Leitura inicial da rotina e da disposição desta semana.",
    questions: [
      { id: "sono", label: "Como está seu sono hoje?", type: "scale" },
      { id: "energia", label: "Como está sua energia ao longo do dia?", type: "scale" },
      { id: "humor", label: "Como você avalia seu humor nesta semana?", type: "scale" },
      {
        id: "hidratacao",
        label: "Sua hidratação está adequada?",
        type: "single",
        options: [
          { label: "Baixa", value: "baixa" },
          { label: "Adequada", value: "adequada" },
          { label: "Alta", value: "alta" },
        ],
      },
      {
        id: "atividade",
        label: "Conseguiu se movimentar nesta semana?",
        type: "single",
        options: [
          { label: "Nenhuma", value: "nenhuma" },
          { label: "1 a 2 vezes", value: "1-2" },
          { label: "3 ou mais vezes", value: "3+" },
        ],
      },
    ],
  },
  {
    id: "medicamentos",
    title: "Medicamentos",
    description: "Informações simples para a clínica acompanhar sua rotina de uso.",
    questions: [
      { id: "medicacao", label: "Você conseguiu tomar seus medicamentos corretamente?", type: "scale" },
      {
        id: "quantidade_medicamentos",
        label: "Quantos medicamentos você usa atualmente?",
        type: "single",
        options: [
          { label: "1 a 2", value: "1-2" },
          { label: "3 a 5", value: "3-5" },
          { label: "6 ou mais", value: "6+" },
        ],
      },
      { id: "efeitos", label: "Sentiu algum desconforto com os medicamentos nesta semana?", type: "text" },
      {
        id: "lembrete",
        label: "Você consegue lembrar dos horários sem dificuldade?",
        type: "single",
        options: [
          { label: "Sem dificuldade", value: "sem dificuldade" },
          { label: "Alguma dificuldade", value: "alguma dificuldade" },
          { label: "Muita dificuldade", value: "muita dificuldade" },
        ],
      },
    ],
  },
  {
    id: "terapias",
    title: "Terapias e sinais de atenção",
    description: "Registro do que foi feito e do que merece atenção no seu acompanhamento.",
    questions: [
      {
        id: "terapia",
        label: "Como você avalia sua adesão às terapias recomendadas?",
        type: "single",
        options: [
          { label: "Sim", value: "sim" },
          { label: "Parcialmente", value: "parcialmente" },
          { label: "Não", value: "nao" },
        ],
      },
      { id: "estresse", label: "Como está seu nível de estresse hoje?", type: "scale" },
      { id: "burnout", label: "Existe algo importante que a equipe clínica precise saber hoje?", type: "text" },
      { id: "observacao", label: "Alguma observação adicional para o prontuário?", type: "text" },
    ],
  },
];

function readStoredState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      responses: AssessmentResponses;
      currentBlockIndex: number;
      completed: boolean;
    };
  } catch {
    return null;
  }
}

export function PatientAssessmentPage() {
  const navigate = useNavigate();
  const storedState = useMemo(() => (typeof window !== "undefined" ? readStoredState() : null), []);
  const [responses, setResponses] = useState<AssessmentResponses>(storedState?.responses ?? {});
  const [currentBlockIndex, setCurrentBlockIndex] = useState(storedState?.currentBlockIndex ?? 0);
  const [saved, setSaved] = useState(Boolean(storedState));
  const [completed, setCompleted] = useState(Boolean(storedState?.completed));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentBlock = assessmentBlocks[currentBlockIndex];
  const isLastBlock = currentBlockIndex === assessmentBlocks.length - 1;
  const predictiveIntelligence = useMemo(() => buildPatientPredictiveIntelligence(responses), [responses]);
  const blockAnswered = useMemo(
    () => currentBlock.questions.every((question) => Boolean(responses[question.id]?.trim())),
    [currentBlock.questions, responses],
  );

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        responses,
        currentBlockIndex,
        completed,
      }),
    );
  }, [responses, currentBlockIndex, completed]);

  const handleScaleAnswer = (questionId: string, value: string) => {
    setResponses((previous) => ({ ...previous, [questionId]: value }));
    setSaved(true);
  };

  const handleTextAnswer = (questionId: string, value: string) => {
    setResponses((previous) => ({ ...previous, [questionId]: value }));
    setSaved(true);
  };

  const handleSingleAnswer = (questionId: string, value: string) => {
    setResponses((previous) => ({ ...previous, [questionId]: value }));
    setSaved(true);
  };

  const handleNext = async () => {
    if (!blockAnswered) return;

    if (isLastBlock) {
      setIsSubmitting(true);
      setError("");
      try {
        await submitPatientAssessment({ answers: responses });
        setCompleted(true);
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            responses,
            currentBlockIndex,
            completed: true,
          }),
        );
        window.setTimeout(() => {
          navigate("/paciente/home");
        }, 700);
      } catch {
        setError("Nao foi possivel enviar a avaliacao agora.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setCurrentBlockIndex((previous) => previous + 1);
  };

  return (
    <main className="patient-home patient-assessment-page">
      <div className="patient-home-container">
        <header className="patient-home-header patient-home-header-clean patient-home-header-slim">
          <div>
            <span className="eyebrow">Avaliação de cuidado integrado</span>
            <h1>Responder avaliação</h1>
            <p>Leitura simples, progresso salvo e blocos organizados para você responder sem se perder.</p>
          </div>
          <Link className="secondary-button secondary-button-link" to="/paciente/home">
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </header>

        <section className="patient-assessment-layout">
          <article className="panel patient-assessment-panel panel-soft">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Bloco {currentBlockIndex + 1}</span>
                <h3>{currentBlock.title}</h3>
                <p className="patient-assessment-description">{currentBlock.description}</p>
              </div>
              {saved ? (
                <span className="assessment-save-state">
                  <CheckCircle2 size={16} />
                  Progresso salvo
                </span>
              ) : null}
            </div>

            <div className="assessment-question-list">
              {currentBlock.questions.map((question) => (
                <div className="assessment-question" key={question.id}>
                  <strong>{question.label}</strong>

                  {question.type === "scale" ? (
                    <div className="assessment-options">
                      {["1", "2", "3", "4", "5"].map((value) => (
                        <button
                          className={`assessment-option${responses[question.id] === value ? " assessment-option-active" : ""}`}
                          key={value}
                          onClick={() => handleScaleAnswer(question.id, value)}
                          type="button"
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {question.type === "single" ? (
                    <div className="assessment-options">
                      {question.options.map((option) => (
                        <button
                          className={`assessment-option${responses[question.id] === option.value ? " assessment-option-active" : ""}`}
                          key={option.value}
                          onClick={() => handleSingleAnswer(question.id, option.value)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {question.type === "text" ? (
                    <textarea
                      className="assessment-textarea"
                      placeholder="Escreva sua resposta aqui"
                      value={responses[question.id] ?? ""}
                      onChange={(event) => handleTextAnswer(question.id, event.target.value)}
                    />
                  ) : null}
                </div>
              ))}
            </div>

            <div className="assessment-footer">
              {error ? <div className="form-message form-message-error">{error}</div> : null}
              <button className="primary-button primary-button-inline" type="button" disabled={!blockAnswered || completed || isSubmitting} onClick={() => void handleNext()}>
                {completed ? "Avaliacao concluida" : isSubmitting ? "Enviando..." : isLastBlock ? "Concluir avaliacao" : "Continuar avaliacao"}
              </button>
            </div>
          </article>

          <article className="panel patient-assessment-panel patient-assessment-side panel-soft">
            <span className="panel-kicker">Seu progresso</span>
            <h3>{currentBlockIndex + 1} de {assessmentBlocks.length} blocos</h3>
            <p>
              Ao concluir, sua Home recebe o score atualizado automaticamente e a clínica passa a visualizar a nova leitura.
            </p>

            <div className="assessment-progress-list">
              {assessmentBlocks.map((block, index) => (
                <div className={`assessment-progress-item${index === currentBlockIndex ? " assessment-progress-item-active" : ""}`} key={block.id}>
                  <strong>{block.title}</strong>
                  <span>{index < currentBlockIndex ? "Concluído" : index === currentBlockIndex ? "Em resposta" : "Pendente"}</span>
                </div>
              ))}
            </div>

            <div className="assessment-ai-panel">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">{predictiveIntelligence.eyebrow}</span>
                  <h3>{predictiveIntelligence.title}</h3>
                </div>
                <Sparkles size={18} />
              </div>

              <div className={`predictive-risk-card predictive-risk-card-${predictiveIntelligence.riskTone}`}>
                <div>
                  <span>Risco {predictiveIntelligence.riskLevel}</span>
                  <strong>{predictiveIntelligence.score}%</strong>
                </div>
                <div className="predictive-meter" aria-label={`Risco preditivo ${predictiveIntelligence.riskPercent}%`}>
                  <span style={{ width: `${predictiveIntelligence.riskPercent}%` }} />
                </div>
              </div>

              <p>{predictiveIntelligence.summary}</p>
              <ul className="assessment-ai-list predictive-signal-list">
                {predictiveIntelligence.signals.slice(0, 3).map((signal) => (
                  <li key={signal.label}>
                    <strong>{signal.label}</strong>
                    <span>{signal.action}</span>
                  </li>
                ))}
              </ul>

              <div className="rag-source-list">
                {predictiveIntelligence.ragSources.map((source) => (
                  <span key={source.id}>{source.title}</span>
                ))}
              </div>

              <p className="predictive-governance">{predictiveIntelligence.governanceNote}</p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
