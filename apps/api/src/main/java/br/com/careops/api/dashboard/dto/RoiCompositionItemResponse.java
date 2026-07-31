package br.com.careops.api.dashboard.dto;

public record RoiCompositionItemResponse(
    String label,
    String value,
    int percent
) {
}
