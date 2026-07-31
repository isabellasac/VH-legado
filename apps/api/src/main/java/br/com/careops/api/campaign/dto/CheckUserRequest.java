package br.com.careops.api.campaign.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CheckUserRequest(
    @NotBlank @Email String email
) {}
