package br.com.careops.api.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PatientFirstAccessRequest(
    @NotBlank(message = "O CPF e obrigatorio")
    String cpf,
    @NotBlank(message = "O codigo da clinica e obrigatorio")
    String institutionCode,
    @NotBlank(message = "A data de nascimento e obrigatoria")
    String birthDate,
    @NotBlank(message = "A senha e obrigatoria")
    @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres")
    String password,
    @NotBlank(message = "A confirmacao da senha e obrigatoria")
    String confirmPassword
) {
}
