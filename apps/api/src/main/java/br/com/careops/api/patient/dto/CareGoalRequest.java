package br.com.careops.api.patient.dto;

import jakarta.validation.constraints.NotBlank;

public record CareGoalRequest(
    @NotBlank String title,
    String frequency,
    String createdBy
) {
}
