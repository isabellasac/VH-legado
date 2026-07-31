import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { BrandLogo } from "../../../../shared/components/BrandLogo";
import {
  fetchCampaignQuestions,
  submitCampaignAnswers,
  type AnswerItem,
  type CampaignQuestion,
} from "../../services/campaignPublicApi";

export function CampaignQuestionsPage() {
  const { slug, profileType } = useParams<{ slug: string; profileType: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const registrationId = (location.state as { registrationId?: string } | null)?.registrationId ?? "";
  const profile = profileType ?? "USER";

  const [questions, setQuestions] = useState<CampaignQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [wantsNewsletter, setWantsNewsletter] = useState<string>("");

  // Load questions
  useEffect(() => {
    if (!slug) return;
    fetchCampaignQuestions(slug, profile)
      .then(setQuestions)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar perguntas."))
      .finally(() => setLoading(false));
  }, [slug, profile]);

  // Filter visible questions based on conditionals
  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (!q.conditionalOnQuestionId || !q.conditionalOnAnswer) return true;

      const parentAnswer = answers[q.conditionalOnQuestionId];
      if (!parentAnswer) return false;

      const validAnswers = q.conditionalOnAnswer.split("|");
      // For MULTIPLE_CHOICE, the answer is stored as comma-separated
      const selectedValues = parentAnswer.split(",").map((v) => v.trim());
      return validAnswers.some((valid) => selectedValues.includes(valid));
    });
  }, [questions, answers]);

  // The total steps = visible questions + 1 (newsletter question)
  const totalSteps = visibleQuestions.length + 1;
  const isNewsletterStep = currentIndex >= visibleQuestions.length;
  const currentQuestion = isNewsletterStep ? null : visibleQuestions[currentIndex];
  const isLastStep = currentIndex === totalSteps - 1;

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleMultiChoiceToggle(questionId: string, option: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? "";
      const values = current ? current.split(",").map((v) => v.trim()) : [];
      const idx = values.indexOf(option);
      if (idx >= 0) {
        values.splice(idx, 1);
      } else {
        values.push(option);
      }
      return { ...prev, [questionId]: values.join(",") };
    });
  }

  function canProceed(): boolean {
    if (isNewsletterStep) return wantsNewsletter !== "";

    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;

    const answer = answers[currentQuestion.id];
    return Boolean(answer?.trim());
  }

  function goNext() {
    if (!canProceed()) return;
    setDirection("next");
    setCurrentIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }

  function goPrev() {
    setDirection("prev");
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmit() {
    if (!canProceed()) return;

    setSubmitting(true);
    setError(null);

    const answerItems: AnswerItem[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));

    try {
      await submitCampaignAnswers(slug!, {
        registrationId,
        profileType: profile,
        answers: answerItems,
        wantsNewsletter: wantsNewsletter === "Sim",
      });

      navigate(`/campanha/${slug}/concluido`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar respostas.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="campaign-shell">
        <div className="campaign-loader">
          <Loader2 className="campaign-spinner" size={36} />
          <span>Carregando perguntas…</span>
        </div>
      </main>
    );
  }

  if (error && questions.length === 0) {
    return (
      <main className="campaign-shell">
        <div className="empty-state empty-state-error">
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="campaign-questions-shell">
      <header className="campaign-questions-topbar">
        <BrandLogo compact />
        <div className="campaign-progress-bar">
          <div
            className="campaign-progress-fill"
            style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <span className="campaign-progress-label">
          {currentIndex + 1} de {totalSteps}
        </span>
      </header>

      <section className="campaign-questions-body">
        <div className={`campaign-question-slide campaign-slide-${direction}`} key={currentIndex}>
          {isNewsletterStep ? (
            <div className="campaign-question-card">
              <span className="campaign-question-number">Última pergunta</span>
              <h2>Gostaria de receber informações sobre a VH Health Hub?</h2>
              <div className="campaign-choice-grid">
                {["Sim", "Não"].map((opt) => (
                  <button
                    className={`campaign-choice-card${wantsNewsletter === opt ? " campaign-choice-active" : ""}`}
                    key={opt}
                    type="button"
                    onClick={() => setWantsNewsletter(opt)}
                  >
                    {wantsNewsletter === opt ? <CheckCircle2 size={18} /> : <span className="campaign-choice-radio" />}
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="campaign-question-card">
              <span className="campaign-question-number">
                Pergunta {currentIndex + 1}
                {!currentQuestion.required ? " (opcional)" : ""}
              </span>
              <h2>{currentQuestion.text}</h2>

              {currentQuestion.type === "TEXT" ? (
                <textarea
                  className="assessment-textarea campaign-textarea"
                  placeholder="Escreva sua resposta aqui…"
                  value={answers[currentQuestion.id] ?? ""}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  autoFocus
                />
              ) : null}

              {currentQuestion.type === "SINGLE_CHOICE" ? (
                <div className="campaign-choice-grid">
                  {currentQuestion.options.map((opt) => (
                    <button
                      className={`campaign-choice-card${answers[currentQuestion.id] === opt ? " campaign-choice-active" : ""}`}
                      key={opt}
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.id, opt)}
                    >
                      {answers[currentQuestion.id] === opt ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <span className="campaign-choice-radio" />
                      )}
                      {opt}
                    </button>
                  ))}
                </div>
              ) : null}

              {currentQuestion.type === "MULTIPLE_CHOICE" ? (
                <div className="campaign-choice-grid">
                  {currentQuestion.options.map((opt) => {
                    const selected = (answers[currentQuestion.id] ?? "")
                      .split(",")
                      .map((v) => v.trim())
                      .includes(opt);
                    return (
                      <button
                        className={`campaign-choice-card${selected ? " campaign-choice-active" : ""}`}
                        key={opt}
                        type="button"
                        onClick={() => handleMultiChoiceToggle(currentQuestion.id, opt)}
                      >
                        {selected ? <CheckCircle2 size={18} /> : <span className="campaign-choice-checkbox" />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {currentQuestion.type === "SCALE" ? (
                <div className="campaign-scale-row">
                  {["1", "2", "3", "4", "5"].map((val) => (
                    <button
                      className={`campaign-scale-btn${answers[currentQuestion.id] === val ? " campaign-scale-active" : ""}`}
                      key={val}
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.id, val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {error ? <div className="form-message form-message-error">{error}</div> : null}
      </section>

      <footer className="campaign-questions-footer">
        <button
          className="secondary-button"
          type="button"
          disabled={currentIndex === 0}
          onClick={goPrev}
        >
          <ArrowLeft size={16} />
          Anterior
        </button>

        {isLastStep ? (
          <button
            className="primary-button primary-button-inline"
            type="button"
            disabled={!canProceed() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="campaign-spinner" size={18} /> : null}
            Concluir
            <CheckCircle2 size={16} />
          </button>
        ) : (
          <button
            className="primary-button primary-button-inline"
            type="button"
            disabled={!canProceed()}
            onClick={goNext}
          >
            Próxima
            <ArrowRight size={16} />
          </button>
        )}
      </footer>
    </main>
  );
}
