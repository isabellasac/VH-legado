package br.com.careops.api.campaign.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record RegistrationRequest(
    @NotBlank String profileType,
    @NotBlank String name,
    @NotBlank @Email String email,
    String phone,
    Map<String, String> profileFields
) {}
