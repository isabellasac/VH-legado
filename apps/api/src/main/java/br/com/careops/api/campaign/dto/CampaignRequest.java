package br.com.careops.api.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CampaignRequest(
    @NotBlank String name,
    @NotBlank String slug,
    String description,
    String confirmationMessage,
    boolean active,
    List<ProfileConfigRequest> profiles
) {}
