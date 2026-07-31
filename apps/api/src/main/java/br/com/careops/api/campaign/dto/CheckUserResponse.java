package br.com.careops.api.campaign.dto;

public record CheckUserResponse(
    boolean exists,
    String name,
    String registrationId
) {}
