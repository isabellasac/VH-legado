package br.com.careops.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "O identificador de acesso e obrigatorio")
    String identifier,
    @NotBlank(message = "A senha e obrigatoria")
    String password
) {
}
