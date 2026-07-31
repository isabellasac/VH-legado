package br.com.careops.api.campaign.dto;

import java.time.LocalDateTime;

public record CampaignListItemResponse(
    String id,
    String name,
    String slug,
    boolean active,
    int totalRegistrations,
    LocalDateTime createdAt
) {}
