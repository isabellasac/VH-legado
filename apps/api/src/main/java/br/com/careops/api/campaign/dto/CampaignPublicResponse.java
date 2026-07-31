package br.com.careops.api.campaign.dto;

import java.util.List;

public record CampaignPublicResponse(
    String name,
    String description,
    List<String> availableProfiles
) {}
