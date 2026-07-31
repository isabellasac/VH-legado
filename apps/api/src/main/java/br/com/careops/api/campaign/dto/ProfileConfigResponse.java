package br.com.careops.api.campaign.dto;

import java.util.List;

public record ProfileConfigResponse(
    String profileType,
    List<QuestionResponse> questions
) {}
