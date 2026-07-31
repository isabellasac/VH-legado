package br.com.careops.api.campaign.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CampaignResponse(
    String id,
    String name,
    String slug,
    String description,
    String confirmationMessage,
    boolean active,
    List<ProfileConfigResponse> profiles,
    int totalRegistrations,
    LocalDateTime createdAt
) {}
