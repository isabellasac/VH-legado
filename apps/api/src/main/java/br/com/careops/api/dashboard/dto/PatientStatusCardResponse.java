package br.com.careops.api.dashboard.dto;

public record PatientStatusCardResponse(
    String label,
    int total,
    String support,
    String tone
) {
}
