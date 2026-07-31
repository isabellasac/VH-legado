package br.com.careops.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PartnerFirstAccessRequest(
    @NotBlank(message = "O nome e obrigatorio")
    String name,
    @Email(message = "Informe um e-mail valido")
    @NotBlank(message = "O e-mail e obrigatorio")
    String email,
    @NotBlank(message = "A area de atuacao e obrigatoria")
    String specialty,
    @NotBlank(message = "O codigo da instituicao e obrigatorio")
    String institutionCode,
    @NotBlank(message = "A senha e obrigatoria")
    @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres")
    String password,
    @NotBlank(message = "A confirmacao da senha e obrigatoria")
    String confirmPassword
) {
}
