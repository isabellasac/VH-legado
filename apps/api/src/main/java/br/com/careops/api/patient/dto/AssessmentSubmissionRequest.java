package br.com.careops.api.patient.dto;

import java.util.Map;

import jakarta.validation.constraints.NotEmpty;

public record AssessmentSubmissionRequest(
    String patientId,
    @NotEmpty Map<String, String> answers
) {
}
