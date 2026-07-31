package br.com.careops.api.intelligence;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import br.com.careops.api.core.CareopsDataStore;
import br.com.careops.api.core.CareopsDataStore.IntelligenceSnapshot;
import br.com.careops.api.core.CareopsDataStore.RagSourceRecord;
import br.com.careops.api.core.CareopsDataStore.SignalRecord;
import br.com.careops.api.intelligence.ClinicalIntelligenceResponse.PredictiveSignalResponse;
import br.com.careops.api.intelligence.ClinicalIntelligenceResponse.RagSourceResponse;

@Service
public class ClinicalIntelligenceService {

    public static final String RULES_VERSION = "vh-rules-2026-06-16-backend-v1";

    private static final List<String> SIDE_EFFECT_KEYWORDS = List.of(
        "tontura",
        "queda",
        "enjoo",
        "nausea",
        "náusea",
        "dor",
        "sangramento",
        "falta de ar",
        "confusao",
        "confusão",
        "pressao",
        "pressão"
    );

    private final CareopsDataStore store;

    public ClinicalIntelligenceService(CareopsDataStore store) {
        this.store = store;
    }

    public ClinicalIntelligenceResponse evaluate(Map<String, String> responses) {
        IntelligenceSnapshot snapshot = evaluateSnapshot(responses);
        List<PredictiveSignalResponse> signals = snapshot.signals.stream()
            .map(signal -> new PredictiveSignalResponse(signal.label, signal.evidence, signal.action, signal.tone, signal.sourceIds))
            .toList();
        List<RagSourceResponse> ragSources = resolveSources(snapshot.sourceIds);
        List<String> recommendedActions = snapshot.signals.stream()
            .limit(3)
            .map(signal -> signal.action)
            .toList();

        return new ClinicalIntelligenceResponse(
            "IA Preditiva VH",
            riskTitle(snapshot.riskPercent),
            riskSummary(snapshot.riskLevel),
            snapshot.signals.stream().limit(3).map(signal -> signal.label + ": " + signal.action).toList(),
            snapshot.score,
            snapshot.riskPercent,
            snapshot.riskLevel,
            snapshot.riskTone,
            signals,
            recommendedActions,
            ragSources,
            "Saida assistiva: risco, alerta e apoio a decisao; nao substitui diagnostico medico.",
            "Sem API externa no front-end: regras, fontes e logs ficam no backend CareOps; IA externa futura exige controlador interno.",
            RULES_VERSION,
            LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
    }

    public IntelligenceSnapshot evaluateSnapshot(Map<String, String> responses) {
        List<SignalRecord> signals = new ArrayList<>();
        RiskAccumulator risk = new RiskAccumulator();

        Integer sleep = scale(responses.get("sono"));
        Integer energy = scale(responses.get("energia"));
        Integer mood = scale(responses.get("humor"));
        Integer stress = scale(responses.get("estresse"));
        Integer medicationAdherence = scale(responses.get("medicacao"));
        String medsCount = normalized(responses.get("quantidade_medicamentos"));
        String sideEffects = responses.get("efeitos");
        String therapy = normalized(responses.get("terapia"));
        String hydration = normalized(responses.get("hidratacao"));
        String activity = normalized(responses.get("atividade"));
        String reminder = normalized(responses.get("lembrete"));
        String clinicalNote = (responses.getOrDefault("burnout", "") + " " + responses.getOrDefault("observacao", "")).trim();

        if (orDefault(sleep, 5) <= 2) {
            addSignal(risk, signals, 14, "Sono baixo", "Resposta de sono em faixa critica.", "Priorizar rotina noturna e revisar fadiga na proxima leitura.", "warning", List.of("score", "acompanhamento"));
        } else if (sleep != null && sleep == 3) {
            risk.add(6);
        }

        if (orDefault(energy, 5) <= 2) {
            addSignal(risk, signals, 10, "Energia baixa", "Energia diaria abaixo do esperado.", "Cruzar com sono, adesao terapeutica e sinais recentes.", "warning", List.of("score", "acompanhamento"));
        }

        if (orDefault(mood, 5) <= 2 || orDefault(stress, 0) >= 4) {
            addSignal(risk, signals, 12, "Sobrecarga emocional", "Humor baixo ou estresse elevado informado na avaliacao.", "Sinalizar a equipe para acompanhamento e possivel ajuste do plano.", "warning", List.of("score", "alertas", "acompanhamento"));
        } else if (stress != null && stress == 3) {
            risk.add(6);
        }

        if (orDefault(medicationAdherence, 5) <= 2) {
            addSignal(risk, signals, 12, "Adesao medicamentosa baixa", "Registro indica dificuldade para tomar medicamentos corretamente.", "Checar rotina de horarios e necessidade de lembrete assistido.", "danger", List.of("prm", "alertas"));
        } else if (medicationAdherence != null && medicationAdherence == 3) {
            risk.add(5);
        }

        if (medsCount.contains("6") || medsCount.contains("mais")) {
            addSignal(risk, signals, 14, "Risco farmaceutico elevado", "Uso atual de 6 ou mais medicamentos.", "Encaminhar para revisao farmaceutica e monitorar eventos adversos.", "danger", List.of("prm", "alertas", "roi"));
        } else if (medsCount.contains("3")) {
            risk.add(6);
        }

        if (includesAny(sideEffects, SIDE_EFFECT_KEYWORDS)) {
            addSignal(risk, signals, 14, "Possivel evento adverso", "Sintoma relatado em campo aberto de medicamentos.", "Cruzar relato com prontuario, medicacoes em uso e plano vigente.", "danger", List.of("prm", "alertas", "roi"));
        } else if (hasText(sideEffects)) {
            addSignal(risk, signals, 6, "Relato aberto para revisao", "Paciente registrou desconforto ou observacao livre.", "Enviar para triagem no prontuario antes de alterar conduta.", "info", List.of("score", "acompanhamento"));
        }

        if (therapy.equals("nao") || therapy.equals("não")) {
            addSignal(risk, signals, 12, "Baixa adesao terapeutica", "Paciente informou nao seguir as terapias recomendadas.", "Reordenar metas e simplificar o plano validado pela clinica.", "warning", List.of("alertas", "acompanhamento"));
        } else if (therapy.equals("parcialmente")) {
            risk.add(6);
        }

        if (hydration.equals("baixa")) {
            addSignal(risk, signals, 6, "Hidratacao baixa", "Hidratacao marcada como baixa.", "Definir meta simples de hidratacao para a semana.", "info", List.of("score", "acompanhamento"));
        }

        if (activity.equals("nenhuma")) {
            risk.add(5);
        }

        if (reminder.equals("muita dificuldade")) {
            addSignal(risk, signals, 10, "Dificuldade com horarios", "Paciente relata muita dificuldade para lembrar medicamentos.", "Ativar acompanhamento de lembretes e revisar barreiras da rotina.", "warning", List.of("prm", "alertas", "acompanhamento"));
        } else if (reminder.equals("alguma dificuldade")) {
            risk.add(5);
        }

        if (hasText(clinicalNote)) {
            addSignal(
                risk,
                signals,
                includesAny(clinicalNote, SIDE_EFFECT_KEYWORDS) ? 8 : 4,
                "Observacao para prontuario",
                "Campo aberto preenchido pelo paciente.",
                "Manter como aviso assistivo para validacao profissional.",
                "info",
                List.of("score", "acompanhamento")
            );
        }

        if (signals.isEmpty()) {
            SignalRecord stable = signal("Sem sinal critico evidente", "Respostas atuais nao acionaram regras de alerta.", "Manter monitoramento e repetir leitura na proxima janela.", "success", List.of("score", "acompanhamento"));
            signals.add(stable);
        }

        signals.sort(Comparator.comparingInt(signal -> tonePriority(signal.tone)));

        IntelligenceSnapshot snapshot = new IntelligenceSnapshot();
        snapshot.riskPercent = clamp(risk.value());
        snapshot.score = clamp(100 - snapshot.riskPercent);
        snapshot.riskLevel = riskLevel(snapshot.riskPercent);
        snapshot.riskTone = riskTone(snapshot.riskPercent);
        snapshot.rulesVersion = RULES_VERSION;
        snapshot.signals = signals;
        Set<String> sourceIds = new LinkedHashSet<>();
        signals.forEach(signal -> sourceIds.addAll(signal.sourceIds));
        snapshot.sourceIds = sourceIds.isEmpty() ? List.of("score", "acompanhamento") : new ArrayList<>(sourceIds);
        return snapshot;
    }

    public List<RagSourceResponse> resolveSources(List<String> sourceIds) {
        Set<String> ids = new LinkedHashSet<>(sourceIds);
        return store.ragSources().stream()
            .filter(source -> ids.contains(source.id()))
            .map(this::toResponse)
            .toList();
    }

    private RagSourceResponse toResponse(RagSourceRecord source) {
        return new RagSourceResponse(
            source.id(),
            source.title(),
            source.scope(),
            source.version(),
            source.approvedBy(),
            source.approvedAt(),
            source.domain()
        );
    }

    private static void addSignal(RiskAccumulator risk, List<SignalRecord> signals, int points, String label, String evidence, String action, String tone, List<String> sourceIds) {
        risk.add(points);
        signals.add(signal(label, evidence, action, tone, sourceIds));
    }

    private static SignalRecord signal(String label, String evidence, String action, String tone, List<String> sourceIds) {
        SignalRecord signal = new SignalRecord();
        signal.label = label;
        signal.evidence = evidence;
        signal.action = action;
        signal.tone = tone;
        signal.sourceIds = sourceIds;
        return signal;
    }

    private static String normalized(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static Integer scale(String value) {
        try {
            return value == null || value.isBlank() ? null : Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static int orDefault(Integer value, int fallback) {
        return value == null ? fallback : value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isBlank();
    }

    private static boolean includesAny(String value, List<String> keywords) {
        String normalized = normalized(value);
        return keywords.stream().anyMatch(normalized::contains);
    }

    private static int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private static String riskLevel(int riskPercent) {
        if (riskPercent >= 65) return "Alto";
        if (riskPercent >= 35) return "Moderado";
        return "Baixo";
    }

    private static String riskTone(int riskPercent) {
        if (riskPercent >= 65) return "danger";
        if (riskPercent >= 35) return "warning";
        return "success";
    }

    private static String riskTitle(int riskPercent) {
        if (riskPercent >= 65) return "Risco alto para acompanhamento prioritario";
        if (riskPercent >= 35) return "Risco moderado com pontos para revisar";
        return "Risco baixo no acompanhamento atual";
    }

    private static String riskSummary(String riskLevel) {
        if ("Alto".equals(riskLevel)) {
            return "A leitura preditiva prioriza revisao pela equipe clinica antes de qualquer mudanca no cuidado.";
        }
        if ("Moderado".equals(riskLevel)) {
            return "A leitura preditiva encontrou pontos de atencao para acompanhar nesta semana.";
        }
        return "A leitura preditiva esta estavel e segue como apoio ao acompanhamento.";
    }

    private static int tonePriority(String tone) {
        return switch (tone) {
            case "danger" -> 0;
            case "warning" -> 1;
            case "info" -> 2;
            default -> 3;
        };
    }

    private static class RiskAccumulator {
        private int value = 12;

        void add(int points) {
            value += points;
        }

        int value() {
            return value;
        }
    }
}
