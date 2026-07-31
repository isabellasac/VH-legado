package br.com.careops.api.dashboard.dto;

import java.util.List;

public record DashboardResponse(
    String clinicName,
    String operatorName,
    List<KpiCardResponse> kpis,
    List<HealthHistoryPointResponse> history,
    List<AlertItemResponse> alerts,
    List<PatientStatusCardResponse> statuses,
    List<RoiCompositionItemResponse> roiComposition
) {
}
