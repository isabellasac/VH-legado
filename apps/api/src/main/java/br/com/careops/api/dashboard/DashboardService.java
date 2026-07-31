package br.com.careops.api.dashboard;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import br.com.careops.api.core.CareopsDataStore;
import br.com.careops.api.core.CareopsDataStore.AssessmentRecord;
import br.com.careops.api.core.CareopsDataStore.PatientRecord;
import br.com.careops.api.dashboard.dto.AlertItemResponse;
import br.com.careops.api.dashboard.dto.DashboardResponse;
import br.com.careops.api.dashboard.dto.HealthHistoryPointResponse;
import br.com.careops.api.dashboard.dto.KpiCardResponse;
import br.com.careops.api.dashboard.dto.PatientStatusCardResponse;
import br.com.careops.api.dashboard.dto.RoiCompositionItemResponse;

@Service
public class DashboardService {

    private final CareopsDataStore store;

    public DashboardService(CareopsDataStore store) {
        this.store = store;
    }

    public DashboardResponse getManagementDashboard() {
        String institutionId = store.defaultInstitutionId();
        List<PatientRecord> patients = store.listPatients(institutionId);
        List<PatientRecord> activePatients = patients.stream().filter(patient -> patient.active).toList();
        long answeredPatients = activePatients.stream()
            .filter(patient -> patient.lastResponseAt != null && !patient.lastResponseAt.isBlank())
            .count();
        int adhesion = activePatients.isEmpty() ? 0 : Math.round((answeredPatients * 100f) / activePatients.size());
        BigDecimal totalRoi = store.totalRoi(institutionId);
        String clinicName = store.findInstitution(institutionId).map(item -> item.name).orElse("Clinica CareOps");

        return new DashboardResponse(
            clinicName,
            "Dr. Ricardo Andrade",
            List.of(
                new KpiCardResponse("Total de vidas", String.valueOf(activePatients.size()), "Pacientes monitorados na clinica"),
                new KpiCardResponse("Taxa de adesao", adhesion + "%", "Pacientes com avaliacao registrada"),
                new KpiCardResponse("Economia total", currency(totalRoi), "Acumulado das intervencoes de ROI")
            ),
            buildHistory(activePatients),
            store.listAlerts(institutionId).stream()
                .limit(6)
                .map(alert -> new AlertItemResponse(alert.tone, alert.message))
                .toList(),
            buildStatuses(activePatients),
            buildRoiComposition(institutionId, totalRoi)
        );
    }

    public Map<String, String> getRoiComposition() {
        Map<String, String> result = new LinkedHashMap<>();
        store.roiByCategory(store.defaultInstitutionId())
            .forEach((category, value) -> result.put(category, currency(value)));
        return result;
    }

    private List<HealthHistoryPointResponse> buildHistory(List<PatientRecord> patients) {
        if (patients.isEmpty()) {
            return List.of(new HealthHistoryPointResponse("Atual", 0));
        }

        List<AssessmentRecord> assessments = new ArrayList<>();
        patients.forEach(patient -> assessments.addAll(store.listAssessments(patient.id)));
        if (assessments.isEmpty()) {
            int average = Math.round((float) patients.stream().mapToInt(patient -> patient.currentScore).average().orElse(0));
            return List.of(new HealthHistoryPointResponse("Atual", average));
        }

        Map<String, List<AssessmentRecord>> byMonth = assessments.stream()
            .collect(Collectors.groupingBy(
                assessment -> assessment.createdAt.substring(0, 7),
                LinkedHashMap::new,
                Collectors.toList()
            ));

        return byMonth.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> new HealthHistoryPointResponse(
                entry.getKey().substring(5) + "/" + entry.getKey().substring(2, 4),
                Math.round((float) entry.getValue().stream().mapToInt(item -> item.score).average().orElse(0))
            ))
            .toList();
    }

    private List<PatientStatusCardResponse> buildStatuses(List<PatientRecord> patients) {
        int total = Math.max(patients.size(), 1);
        Map<String, Long> counts = patients.stream()
            .collect(Collectors.groupingBy(patient -> patient.status, LinkedHashMap::new, Collectors.counting()));

        List<String> order = List.of("Ativo", "Monitorado", "Em Alerta", "Pendente", "Inativo");
        return order.stream()
            .filter(counts::containsKey)
            .map(status -> {
                int count = counts.get(status).intValue();
                String tone = switch (status) {
                    case "Em Alerta" -> "danger";
                    case "Monitorado", "Pendente" -> "warning";
                    default -> "success";
                };
                return new PatientStatusCardResponse(status, count, Math.round((count * 100f) / total) + "% do total", tone);
            })
            .toList();
    }

    private List<RoiCompositionItemResponse> buildRoiComposition(String institutionId, BigDecimal totalRoi) {
        Map<String, BigDecimal> composition = store.roiByCategory(institutionId);
        if (composition.isEmpty()) {
            return List.of(new RoiCompositionItemResponse("Sem eventos", currency(BigDecimal.ZERO), 0));
        }

        BigDecimal safeTotal = totalRoi.compareTo(BigDecimal.ZERO) > 0 ? totalRoi : BigDecimal.ONE;
        return composition.entrySet().stream()
            .map(entry -> new RoiCompositionItemResponse(
                entry.getKey(),
                currency(entry.getValue()),
                entry.getValue().multiply(BigDecimal.valueOf(100)).divide(safeTotal, 0, java.math.RoundingMode.HALF_UP).intValue()
            ))
            .toList();
    }

    private String currency(BigDecimal value) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR"));
        return format.format(value);
    }
}
