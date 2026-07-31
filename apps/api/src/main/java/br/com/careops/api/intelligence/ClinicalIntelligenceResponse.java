package br.com.careops.api.intelligence;

import java.util.List;

public record ClinicalIntelligenceResponse(
    String eyebrow,
    String title,
    String summary,
    List<String> bullets,
    int score,
    int riskPercent,
    String riskLevel,
    String riskTone,
    List<PredictiveSignalResponse> signals,
    List<String> recommendedActions,
    List<RagSourceResponse> ragSources,
    String governanceNote,
    String apiPolicy,
    String rulesVersion,
    String generatedAt
) {
    public record PredictiveSignalResponse(
        String label,
        String evidence,
        String action,
        String tone,
        List<String> sourceIds
    ) {
    }

    public record RagSourceResponse(
        String id,
        String title,
        String scope,
        String version,
        String approvedBy,
        String approvedAt,
        String domain
    ) {
    }
}
