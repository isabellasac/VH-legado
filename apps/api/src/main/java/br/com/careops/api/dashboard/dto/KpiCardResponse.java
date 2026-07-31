package br.com.careops.api.dashboard.dto;

public record KpiCardResponse(
    String label,
    String value,
    String support
) {
}
