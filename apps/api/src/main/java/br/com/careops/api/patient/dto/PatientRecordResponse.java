package br.com.careops.api.patient.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import br.com.careops.api.intelligence.ClinicalIntelligenceResponse;

public record PatientRecordResponse(
    PatientSummary patient,
    List<AssessmentSummary> assessments,
    List<GoalSummary> goals,
    List<RoiEventSummary> roiEvents,
    List<AlertSummary> alerts,
    ClinicalIntelligenceResponse intelligence,
    String lgpdConsentVersion,
    String lgpdConsentAcceptedAt
) {
    public record PatientSummary(
        String id,
        String name,
        String cpfMasked,
        String email,
        String phone,
        String birthDate,
        String sex,
        String professional,
        String status,
        String signal,
        int score,
        int riskPercent,
        String riskLevel,
        String lastResponseAt,
        String invitationCode,
        boolean active
    ) {
    }

    public record AssessmentSummary(
        String id,
        Map<String, String> answers,
        int score,
        int riskPercent,
        String riskLevel,
        String rulesVersion,
        String questionVersion,
        String createdAt
    ) {
    }

    public record GoalSummary(
        String id,
        String title,
        String frequency,
        String status,
        String createdBy,
        String createdAt,
        String updatedAt,
        String completedAt
    ) {
    }

    public record RoiEventSummary(
        String id,
        String title,
        BigDecimal value,
        String category,
        String justification,
        String createdBy,
        String createdAt
    ) {
    }

    public record AlertSummary(
        String id,
        String tone,
        String message,
        String source,
        String status,
        int priority,
        String createdAt,
        String resolvedAt
    ) {
    }
}
