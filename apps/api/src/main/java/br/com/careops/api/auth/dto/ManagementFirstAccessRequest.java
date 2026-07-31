package br.com.careops.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ManagementFirstAccessRequest(
    @Email(message = "Informe um e-mail valido")
    @NotBlank(message = "O e-mail e obrigatorio")
    String email,
    @NotBlank(message = "O codigo de ativacao e obrigatorio")
    String invitationCode,
    @NotBlank(message = "A senha e obrigatoria")
    @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres")
    String password,
    @NotBlank(message = "A confirmacao da senha e obrigatoria")
    String confirmPassword
) {
}
