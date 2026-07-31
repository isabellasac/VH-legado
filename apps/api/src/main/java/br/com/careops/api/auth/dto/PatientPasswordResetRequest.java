package br.com.careops.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PatientPasswordResetRequest(
    @NotBlank(message = "O CPF e obrigatorio")
    String cpf,
    @Email(message = "Informe um e-mail valido")
    @NotBlank(message = "O e-mail e obrigatorio")
    String email
) {
}
