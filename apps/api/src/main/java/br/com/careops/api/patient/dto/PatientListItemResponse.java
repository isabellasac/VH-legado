package br.com.careops.api.patient.dto;

public record PatientListItemResponse(
    String id,
    String name,
    String cpfMasked,
    String score,
    String status,
    String lastResponseAt,
    String professional,
    String signal
) {
}
