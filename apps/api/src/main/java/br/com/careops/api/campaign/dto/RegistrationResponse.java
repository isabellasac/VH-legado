package br.com.careops.api.campaign.dto;

public record RegistrationResponse(
    String registrationId,
    String message,
    boolean alreadyRegistered
) {}
