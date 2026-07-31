package br.com.careops.api.patient.dto;

public record PatientUpdateRequest(
    String name,
    String cpf,
    String email,
    String phone,
    String birthDate,
    String sex,
    String professional,
    Boolean active
) {
}
