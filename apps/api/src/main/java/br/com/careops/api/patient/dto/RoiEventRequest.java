package br.com.careops.api.patient.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoiEventRequest(
    @NotBlank String title,
    @NotNull BigDecimal value,
    String category,
    String justification,
    String createdBy
) {
}
