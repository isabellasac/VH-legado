package br.com.careops.api.patient.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PatientCreateRequest(
    @NotBlank String name,
    @NotBlank String cpf,
    @Email String email,
    String phone,
    String birthDate,
    String sex,
    String professional
) {
}
