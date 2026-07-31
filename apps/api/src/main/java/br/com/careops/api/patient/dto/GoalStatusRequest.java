package br.com.careops.api.patient.dto;

import jakarta.validation.constraints.NotBlank;

public record GoalStatusRequest(
    @NotBlank String status
) {
}
